"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Loader2, UploadCloud, X, Film, Clapperboard } from "lucide-react";
import { cn, uploadFileToServer, uploadVideoToServer, deleteVideo, deleteImage } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  VideoPromptFormValues,
  videoPromptSchema,
  SingleResponse,
  ImageStyle,
} from "@/types";
import apiService from "@/lib/apiService";

interface VideoPromptFormProps {
  initialData?: VideoPromptFormValues | null;
  onSubmit: (values: VideoPromptFormValues) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
}

// ─── Helper: extract a frame from a video File as a PNG File ───────────────
function extractVideoThumbnail(videoFile: File, seekTime = 1): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;

    const cleanup = () => URL.revokeObjectURL(objectUrl);

    video.addEventListener("error", () => {
      cleanup();
      reject(new Error("Could not load video for thumbnail extraction."));
    });

    // ── Use loadedmetadata (duration is known) then seek ──────────────────
    video.addEventListener("loadedmetadata", () => {
      // Seek to seekTime, but never beyond 10% of duration (avoids black frames)
      video.currentTime = Math.min(seekTime, video.duration * 0.1);
    });

    video.addEventListener("seeked", () => {
      // Small rAF delay ensures the frame is painted before drawImage
      requestAnimationFrame(() => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            cleanup();
            return reject(new Error("Canvas context unavailable."));
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(
            (blob) => {
              cleanup();
              if (!blob) return reject(new Error("Failed to extract frame."));
              const baseName = videoFile.name.replace(/\.[^.]+$/, "");
              resolve(new File([blob], `${baseName}-thumbnail.png`, { type: "image/png" }));
            },
            "image/png",
            0.92
          );
        } catch (err) {
          cleanup();
          reject(err);
        }
      });
    });

    video.load();
  });
}

export default function VideoPromptForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
}: VideoPromptFormProps) {
  const { toast } = useToast();
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [styles, setStyles] = useState<ImageStyle[]>([]);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);

  // ── Holds the raw video File in memory so the generate button can use it ──
  const videoFileRef = useRef<File | null>(null);

  const form = useForm<VideoPromptFormValues>({
    resolver: zodResolver(videoPromptSchema),
    defaultValues: {
      image: initialData?.image || "",
      video: initialData?.video || "",
      style: initialData?.style || "",
      video_prompt: initialData?.video_prompt || "",
      short_video_prompt: (initialData as any)?.short_video_prompt || "",
      is_active: initialData?.is_active ?? true,
    },
  });

  // Watch values for button states
  const videoValue = form.watch("video");
  const imageValue = form.watch("image");

  // ── Button disabled states & tooltip message ─────────────────────────────
  // Button is enabled if: video exists (URL or File) AND no thumbnail AND not busy
  const noVideo = !videoValue;
  const hasThumbnail = !!imageValue;
  const generateBtnDisabled = noVideo || hasThumbnail || isGeneratingThumbnail || isUploadingVideo;

  const generateTooltip = noVideo
    ? "Upload a video first to generate a thumbnail"
    : hasThumbnail
      ? "Thumbnail already exists — remove it first to regenerate"
      : "Extract a thumbnail frame from your uploaded video";

  // Fetch Video Styles for the dropdown
  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const res = await apiService<SingleResponse<ImageStyle[]>>(
          "/image-styles/all/video/admin",
          { method: "GET" }
        );
        if (res.success) setStyles(res.data);
      } catch (error) {
        console.error("Failed to fetch styles");
      }
    };
    fetchStyles();
  }, []);

  // ─── Manual generate thumbnail (button click) ────────────────────────────
  const handleGenerateThumbnail = async () => {
    setIsGeneratingThumbnail(true);
    try {
      let file = videoFileRef.current;

      // ── Edit mode: no File in memory, fetch from URL ──────────────────────
      if (!file) {
        const videoUrl = form.getValues("video");
        if (!videoUrl) return;

        const response = await fetch(videoUrl);
        const blob = await response.blob();
        const fileName = videoUrl.split("/").pop() || "video.mp4";
        file = new File([blob], fileName, { type: blob.type || "video/mp4" });
      }

      const thumbnailFile = await extractVideoThumbnail(file);
      const uploadedUrl = await uploadFileToServer(thumbnailFile, "video-prompt-thumbnails");
      form.setValue("image", uploadedUrl, { shouldDirty: true, shouldValidate: true });
      toast({
        title: "Thumbnail Generated",
        description: "A frame was extracted from your video and set as the thumbnail.",
      });
    } catch (err: any) {
      toast({
        title: "Generation Failed",
        description: err.message || "Could not extract a frame. Please upload a thumbnail manually.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const handleThumbnailDrop = async (files: FileList) => {
    const file = files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingThumbnail(true);
    try {
      const uploadedUrl = await uploadFileToServer(file, "video-prompt-thumbnails");
      form.setValue("image", uploadedUrl, { shouldDirty: true, shouldValidate: true });
      toast({ title: "Thumbnail Uploaded", description: "Prompt thumbnail image has been uploaded." });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleVideoUpload = async (files: FileList) => {
    const file = files?.[0];
    if (!file) return;

    // const ext = file.name.split(".").pop()?.toLowerCase();
    // const allowedExts = ["mp4", "mkv", "mov"];
    // const ext = file.name.split(".").pop()?.toLowerCase();
    // const allowedExts = ["mp4", "mkv", "mov"];
    const ext = file.name.split(".").pop()?.toLowerCase();

    const allowedMimeTypes = [
      "video/mp4",
      "video/x-matroska",
      "video/quicktime",
    ];

    const allowedExts = ["mp4", "mkv", "mov"];

    const MAX_SIZE = 50 * 1024 * 1024; // ✅ 50MB

    // ✅ Size validation (FIRST - fastest fail)
    if (file.size > MAX_SIZE) {
      toast({
        title: "File too large",
        description: "Max file size is 50MB",
        variant: "destructive",
      });
      return;
    }

    // ✅ Cross validation (MIME + EXT)
    const isMimeValid = allowedMimeTypes.includes(file.type);
    const isExtValid = ext && allowedExts.includes(ext);

    if (!isMimeValid || !isExtValid) {
      toast({
        title: "Invalid file type",
        description: "Only MP4, MKV, MOV videos are allowed",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("video/") && (!ext || !allowedExts.includes(ext))) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid video file (MP4, MKV, MOV).",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingVideo(true);
    try {
      // ── Save raw File reference so generate button can use it later ──
      videoFileRef.current = file;

      const uploadedUrl = await uploadVideoToServer(file, "video-prompts-files");
      form.setValue("video", uploadedUrl, { shouldDirty: true, shouldValidate: true });
      toast({ title: "Video Uploaded", description: "Video file has been uploaded." });
    } catch (err: any) {
      videoFileRef.current = null;
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const isThumbnailBusy = isUploadingThumbnail || isGeneratingThumbnail;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6">

          {/* Style Selection */}
          <FormField
            control={form.control}
            name="style"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Style</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a video style" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {styles.map((style) => (
                      <SelectItem key={style._id} value={style._id}>
                        {style.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Video Upload */}
          <FormField
            control={form.control}
            name="video"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Video File (Required)</FormLabel>
                <div
                  className={cn(
                    "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 cursor-pointer transition",
                    isDraggingVideo
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-300 dark:border-gray-600",
                    "hover:border-blue-500 hover:bg-muted/50",
                    field.value && "border-blue-500/50 bg-muted/30"
                  )}
                  onClick={() => videoInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingVideo(true); }}
                  onDragLeave={() => setIsDraggingVideo(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingVideo(false);
                    if (e.dataTransfer.files?.length) {
                      handleVideoUpload(e.dataTransfer.files);
                      e.dataTransfer.clearData();
                    }
                  }}
                >
                  <Input
                    type="file"
                    accept="video/mp4,video/x-matroska,video/quicktime,.mp4,.mkv,.mov"
                    className="hidden"
                    ref={videoInputRef}
                    onChange={(e) => { if (e.target.files) handleVideoUpload(e.target.files); }}
                    disabled={isUploadingVideo || isSubmitting}
                  />

                  {isUploadingVideo ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground py-4">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <p className="text-sm">Uploading video…</p>
                    </div>
                  ) : field.value ? (
                    <div className="relative w-full max-w-2xl mx-auto">
                      <video
                        src={field.value}
                        controls
                        className="w-full aspect-video rounded-md border shadow-sm bg-black"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-3 -right-3 h-7 w-7 shadow-lg z-10"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const currentVideo = form.getValues("video");
                          if (currentVideo) {
                            try {
                              await deleteVideo(currentVideo, "video-prompts-files");
                            } catch (err) {
                              console.error("Failed to delete video:", err);
                            }
                          }
                          videoFileRef.current = null;
                          form.setValue("video", "", { shouldDirty: true, shouldValidate: true });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Film className="h-3 w-3" />
                        <span className="truncate max-w-[300px]">{field.value}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground py-4">
                      <div className="bg-muted p-3 rounded-full mb-3">
                        <UploadCloud className="h-8 w-8" />
                      </div>
                      <p className="text-sm font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground mt-1 text-center">
                        MP4, MKV, MOV (MAX. 500MB)
                      </p>
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Thumbnail Image Upload */}
        <FormItem className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <FormLabel>Thumbnail Image (Required)</FormLabel>

            {/* ── Generate Thumbnail Button — always visible, conditionally disabled ── */}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* span wrapper so tooltip works even when button is disabled */}
                  <span tabIndex={generateBtnDisabled ? 0 : undefined} className="inline-flex">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-8 text-xs gap-1.5 font-medium",
                        generateBtnDisabled
                          ? "opacity-50 cursor-not-allowed pointer-events-none"
                          : "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 dark:hover:bg-blue-900/20"
                      )}
                      disabled={generateBtnDisabled}
                      onClick={handleGenerateThumbnail}
                    >
                      {isGeneratingThumbnail ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Clapperboard className="h-3.5 w-3.5" />
                      )}
                      {isGeneratingThumbnail ? "Generating…" : "Generate from Video"}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[220px] text-center text-xs">
                  {generateTooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div
            className={cn(
              "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 cursor-pointer transition",
              isDraggingThumbnail
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600",
              "hover:border-blue-500 hover:bg-muted/50"
            )}
            onClick={() => !isThumbnailBusy && thumbnailInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDraggingThumbnail(true); }}
            onDragLeave={() => setIsDraggingThumbnail(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingThumbnail(false);
              if (e.dataTransfer.files?.length) {
                handleThumbnailDrop(e.dataTransfer.files);
                e.dataTransfer.clearData();
              }
            }}
          >
            <Input
              type="file"
              accept="image/*"
              className="hidden"
              ref={thumbnailInputRef}
              onChange={(e) => { if (e.target.files) handleThumbnailDrop(e.target.files); }}
              disabled={isThumbnailBusy || isSubmitting}
            />

            {isGeneratingThumbnail ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground py-2">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Generating thumbnail from video…</p>
              </div>
            ) : isUploadingThumbnail ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground py-2">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Uploading thumbnail…</p>
              </div>
            ) : imageValue ? (
              <div className="relative">
                <img
                  src={imageValue}
                  alt="Thumbnail Preview"
                  className="h-48 w-auto rounded-md object-contain"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const currentImage = form.getValues("image");
                    if (currentImage) {
                      try {
                        await deleteImage(currentImage);
                      } catch (err) {
                        console.error("Failed to delete thumbnail:", err);
                      }
                    }
                    form.setValue("image", "", { shouldDirty: true, shouldValidate: true });
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <UploadCloud className="h-8 w-8 mb-2" />
                <p className="text-sm text-center">
                  Drag & drop thumbnail here <br /> or click to upload
                </p>
                {videoValue && (
                  <p className="text-xs text-blue-500 mt-2 text-center">
                    ✦ Or use "Generate from Video" button above
                  </p>
                )}
              </div>
            )}
          </div>
          <FormField
            control={form.control}
            name="image"
            render={() => <FormMessage />}
          />
        </FormItem>

        {/* Short Video Prompt Text */}
        <FormField
          control={form.control}
          name="short_video_prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short Video Prompt Text</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter a short version of the prompt..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Video Prompt Text */}
        <FormField
          control={form.control}
          name="video_prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Video Prompt Text</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter the prompt used to generate the video..."
                  className="h-32"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Active Status */}
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Active Status</FormLabel>
                <FormDescription>Visible to users when active.</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || isThumbnailBusy || isUploadingVideo}
          >
            {isSubmitting
              ? initialData ? "Saving..." : "Creating..."
              : initialData ? "Save Changes" : "Create Video Prompt"}
          </Button>
        </div>
      </form>
    </Form>
  );
}


// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
//   FormDescription,
// } from "@/components/ui/form";
// import { Loader2, UploadCloud, X, Film } from "lucide-react";
// import { cn, uploadFileToServer, uploadVideoToServer, deleteVideo } from "@/lib/utils";
// import { useToast } from "@/hooks/use-toast";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Switch } from "@/components/ui/switch";
// import { Button } from "@/components/ui/button";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   VideoPromptFormValues,
//   videoPromptSchema,
//   SingleResponse,
//   ImageStyle,
// } from "@/types";
// import apiService from "@/lib/apiService";

// interface VideoPromptFormProps {
//   initialData?: VideoPromptFormValues | null;
//   onSubmit: (values: VideoPromptFormValues) => Promise<void>;
//   isSubmitting: boolean;
//   onCancel?: () => void;
// }

// export default function VideoPromptForm({
//   initialData,
//   onSubmit,
//   isSubmitting,
//   onCancel,
// }: VideoPromptFormProps) {
//   const { toast } = useToast();
//   const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
//   const [isUploadingVideo, setIsUploadingVideo] = useState(false);
//   const [styles, setStyles] = useState<ImageStyle[]>([]);
//   const thumbnailInputRef = useRef<HTMLInputElement>(null);
//   const videoInputRef = useRef<HTMLInputElement>(null);
//   const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false);
//   const [isDraggingVideo, setIsDraggingVideo] = useState(false);

//   const form = useForm<VideoPromptFormValues>({
//     resolver: zodResolver(videoPromptSchema),
//     defaultValues: {
//       image: initialData?.image || "",
//       video: initialData?.video || "",
//       style: initialData?.style || "",
//       video_prompt: initialData?.video_prompt || "",
//       is_active: initialData?.is_active ?? true,
//     },
//   });

//   // Fetch Video Styles for the dropdown
//   useEffect(() => {
//     const fetchStyles = async () => {
//       try {
//         const res = await apiService<SingleResponse<ImageStyle[]>>(
//           "/image-styles/all/video/admin",
//           { method: "GET" }
//         );
//         if (res.success) {
//           setStyles(res.data);
//         }
//       } catch (error) {
//         console.error("Failed to fetch styles");
//       }
//     };
//     fetchStyles();
//   }, []);

//   const handleThumbnailDrop = async (files: FileList) => {
//     const file = files?.[0];
//     if (!file) return;

//     if (!file.type.startsWith("image/")) {
//       toast({
//         title: "Invalid file type",
//         description: "Please upload an image file.",
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsUploadingThumbnail(true);
//     try {
//       const uploadedUrl = await uploadFileToServer(file, "video-prompt-thumbnails");
//       form.setValue("image", uploadedUrl, {
//         shouldDirty: true,
//         shouldValidate: true,
//       });
//       toast({
//         title: "Thumbnail Uploaded",
//         description: "Prompt thumbnail image has been uploaded.",
//       });
//     } catch (err: any) {
//       toast({
//         title: "Upload Failed",
//         description: err.message,
//         variant: "destructive",
//       });
//     } finally {
//       setIsUploadingThumbnail(false);
//     }
//   };

//   const handleVideoUpload = async (files: FileList) => {
//     const file = files?.[0];
//     if (!file) return;

//     const ext = file.name.split(".").pop()?.toLowerCase();
//     const allowedExts = ["mp4", "mkv", "mov",];

//     if (!file.type.startsWith("video/") && (!ext || !allowedExts.includes(ext))) {
//       toast({
//         title: "Invalid file type",
//         description: "Please upload a valid video file (MP4, MKV, MOV).",
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsUploadingVideo(true);
//     try {
//       const uploadedUrl = await uploadVideoToServer(file, "video-prompts-files");
//       form.setValue("video", uploadedUrl, {
//         shouldDirty: true,
//         shouldValidate: true,
//       });
//       toast({
//         title: "Video Uploaded",
//         description: "Video file has been uploaded.",
//       });
//     } catch (err: any) {
//       toast({
//         title: "Upload Failed",
//         description: err.message,
//         variant: "destructive",
//       });
//     } finally {
//       setIsUploadingVideo(false);
//     }
//   };

//   const handleVideoDrop = async (files: FileList) => {
//     handleVideoUpload(files);
//   };

//   return (
//     <Form {...form}>
//       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//         <div className="space-y-6">
//           {/* Style Selection */}
//           <FormField
//             control={form.control}
//             name="style"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Style</FormLabel>
//                 <Select onValueChange={field.onChange} value={field.value}>
//                   <FormControl>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select a video style" />
//                     </SelectTrigger>
//                   </FormControl>
//                   <SelectContent>
//                     {styles.map((style) => (
//                       <SelectItem key={style._id} value={style._id}>
//                         {style.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           {/* Video URL & Upload */}
//           <FormField
//             control={form.control}
//             name="video"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Video File (Required)</FormLabel>
//                 <div
//                   className={cn(
//                     "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 cursor-pointer transition",
//                     isDraggingVideo
//                       ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
//                       : "border-gray-300 dark:border-gray-600",
//                     "hover:border-blue-500 hover:bg-muted/50",
//                     field.value && "border-blue-500/50 bg-muted/30"
//                   )}
//                   onClick={() => videoInputRef.current?.click()}
//                   onDragOver={(e) => {
//                     e.preventDefault();
//                     setIsDraggingVideo(true);
//                   }}
//                   onDragLeave={() => setIsDraggingVideo(false)}
//                   onDrop={(e) => {
//                     e.preventDefault();
//                     setIsDraggingVideo(false);
//                     if (e.dataTransfer.files?.length) {
//                       handleVideoDrop(e.dataTransfer.files);
//                       e.dataTransfer.clearData();
//                     }
//                   }}
//                 >
//                   <Input
//                     type="file"
//                     accept="video/mp4,video/x-matroska,video/quicktime,.mp4,.mkv,.mov"
//                     className="hidden"
//                     ref={videoInputRef}
//                     onChange={(e) => {
//                       if (e.target.files) handleVideoUpload(e.target.files);
//                     }}
//                     disabled={isUploadingVideo || isSubmitting}
//                   />

//                   {isUploadingVideo ? (
//                     <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
//                   ) : field.value ? (
//                     <div className="relative w-full max-w-2xl mx-auto">
//                       <video
//                         src={field.value}
//                         controls
//                         className="w-full aspect-video rounded-md border shadow-sm bg-black"
//                         onClick={(e) => e.stopPropagation()}
//                       />
//                       <Button
//                         type="button"
//                         variant="destructive"
//                         size="icon"
//                         className="absolute -top-3 -right-3 h-7 w-7 shadow-lg z-10"
//                         onClick={async (e) => {
//                           e.stopPropagation();
//                           const currentVideo = form.getValues("video");
//                           if (currentVideo) {
//                             try {
//                               await deleteVideo(currentVideo, "video-prompts-files");
//                             } catch (err) {
//                               console.error("Failed to delete video:", err);
//                             }
//                           }
//                           form.setValue("video", "", {
//                             shouldDirty: true,
//                             shouldValidate: true,
//                           });
//                         }}
//                       >
//                         <X className="h-4 w-4" />
//                       </Button>
//                       <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
//                         <Film className="h-3 w-3" />
//                         <span className="truncate max-w-[300px]">{field.value}</span>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="flex flex-col items-center text-muted-foreground py-4">
//                       <div className="bg-muted p-3 rounded-full mb-3">
//                         <UploadCloud className="h-8 w-8" />
//                       </div>
//                       <p className="text-sm font-medium">Click to upload or drag and drop</p>
//                       <p className="text-xs text-muted-foreground mt-1 text-center">
//                         MP4, MKV, MOV  (MAX. 500MB)
//                       </p>
//                     </div>
//                   )}
//                 </div>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//         </div>

//         {/* Thumbnail Image Upload */}
//         <FormItem className="mt-6">
//           <FormLabel>Thumbnail Image (Required)</FormLabel>
//           <div
//             className={cn(
//               "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 cursor-pointer transition",
//               isDraggingThumbnail
//                 ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
//                 : "border-gray-300 dark:border-gray-600",
//               "hover:border-blue-500 hover:bg-muted/50"
//             )}
//             onClick={() => thumbnailInputRef.current?.click()}
//             onDragOver={(e) => {
//               e.preventDefault();
//               setIsDraggingThumbnail(true);
//             }}
//             onDragLeave={() => setIsDraggingThumbnail(false)}
//             onDrop={(e) => {
//               e.preventDefault();
//               setIsDraggingThumbnail(false);
//               if (e.dataTransfer.files?.length) {
//                 handleThumbnailDrop(e.dataTransfer.files);
//                 e.dataTransfer.clearData();
//               }
//             }}
//           >
//             <Input
//               type="file"
//               accept="image/*"
//               className="hidden"
//               ref={thumbnailInputRef}
//               onChange={(e) => {
//                 if (e.target.files) handleThumbnailDrop(e.target.files);
//               }}
//               disabled={isUploadingThumbnail || isSubmitting}
//             />

//             {isUploadingThumbnail ? (
//               <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
//             ) : form.watch("image") ? (
//               <div className="relative">
//                 <img
//                   src={form.watch("image")}
//                   alt="Thumbnail Preview"
//                   className="h-48 w-auto rounded-md object-contain"
//                 />
//                 <Button
//                   type="button"
//                   variant="destructive"
//                   size="icon"
//                   className="absolute -top-2 -right-2 h-6 w-6"
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     form.setValue("image", "", {
//                       shouldDirty: true,
//                       shouldValidate: true,
//                     });
//                   }}
//                 >
//                   <X className="h-3 w-3" />
//                 </Button>
//               </div>
//             ) : (
//               <div className="flex flex-col items-center text-muted-foreground">
//                 <UploadCloud className="h-8 w-8 mb-2" />
//                 <p className="text-sm text-center">
//                   Drag & drop thumbnail here <br /> or click to upload
//                 </p>
//               </div>
//             )}
//           </div>
//           <FormField
//              control={form.control}
//              name="image"
//              render={() => <FormMessage />}
//           />
//         </FormItem>

//         {/* Video Prompt Text */}
//         <FormField
//           control={form.control}
//           name="video_prompt"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Video Prompt Text</FormLabel>
//               <FormControl>
//                 <Textarea
//                   placeholder="Enter the prompt used to generate the video..."
//                   className="h-32"
//                   {...field}
//                 />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         {/* Active Status */}
//         <FormField
//           control={form.control}
//           name="is_active"
//           render={({ field }) => (
//             <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
//               <div className="space-y-0.5">
//                 <FormLabel>Active Status</FormLabel>
//                 <FormDescription>Visible to users when active.</FormDescription>
//               </div>
//               <FormControl>
//                 <Switch
//                   checked={field.value}
//                   onCheckedChange={field.onChange}
//                   disabled={isSubmitting}
//                 />
//               </FormControl>
//             </FormItem>
//           )}
//         />

//         <div className="flex justify-end space-x-3">
//           {onCancel && (
//             <Button
//               type="button"
//               variant="outline"
//               onClick={onCancel}
//               disabled={isSubmitting}
//             >
//               Cancel
//             </Button>
//           )}
//           <Button type="submit" disabled={isSubmitting || isUploadingThumbnail || isUploadingVideo}>
//             {isSubmitting
//               ? initialData
//                 ? "Saving..."
//                 : "Creating..."
//               : initialData
//                 ? "Save Changes"
//                 : "Create Video Prompt"}
//           </Button>
//         </div>
//       </form>
//     </Form>
//   );
// }
