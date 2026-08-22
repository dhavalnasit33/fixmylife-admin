"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, UploadCloud, X } from "lucide-react";
import { cn, deleteImage, uploadFileToServer } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { imageStyleSchema, ImageStyleFormValues } from "@/types";

interface ImageStyleFormProps {
  initialData?: ImageStyleFormValues;
  onSubmit: (values: ImageStyleFormValues) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
  submitLabel: string;
}

export default function ImageStyleForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
  submitLabel,
}: ImageStyleFormProps) {
  const { toast } = useToast();
  const [isUploadingImage, setIsUploadingImage] = useState(false); // ✅ Upload state
  const [isDragging, setIsDragging] = useState(false); // ✅ Drag state
  const imageInputRef = useRef<HTMLInputElement>(null); // ✅ Ref

  const form = useForm<ImageStyleFormValues>({
    resolver: zodResolver(imageStyleSchema),
    defaultValues: {
      name: initialData?.name || "",
      image: initialData?.image || "",
      type: initialData?.type || "image",
      is_active: initialData?.is_active ?? true,
    },
  });

  // ✅ Image Upload Handler (Same as Image Prompt)
  const handleImageDrop = async (files: FileList) => {
    const file = files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const uploadedUrl = await uploadFileToServer(file, "image-styles"); // Changed folder name to 'image-styles'
      form.setValue("image", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast({
        title: "Image Uploaded",
        description: "Style image has been uploaded.",
      });
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Style Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Oil Painting, 3D Render" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ✅ Image Upload Field */}
        <FormItem>
          <FormLabel>Style Cover Image</FormLabel>
          <div
            className={cn(
              "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 cursor-pointer transition",
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600",
              "hover:border-blue-500 hover:bg-muted/50"
            )}
            onClick={() => imageInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.length) {
                handleImageDrop(e.dataTransfer.files);
                e.dataTransfer.clearData();
              }
            }}
          >
            <Input
              type="file"
              accept="image/*"
              className="hidden"
              ref={imageInputRef}
              onChange={(e) => {
                if (e.target.files) handleImageDrop(e.target.files);
              }}
              disabled={isUploadingImage || isSubmitting}
            />

            {isUploadingImage ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : form.watch("image") ? (
              <div className="relative">
                <img
                  src={form.watch("image")}
                  alt="Preview"
                  className="h-48 w-auto rounded-md object-contain"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  // onClick={(e) => {
                  //   e.stopPropagation();
                  //   form.setValue("image", "", {
                  //     shouldDirty: true,
                  //     shouldValidate: true,
                  //   });
                  // }}
                  onClick={async (e) => {
                    e.stopPropagation();
                    const currentImage = form.getValues("image");
                    if (currentImage) {
                      try {
                        await deleteImage(currentImage);
                      } catch (err) {
                        console.error("Failed to delete image:", err);
                      }
                    }
                    form.setValue("image", "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    if (imageInputRef.current) imageInputRef.current.value = "";
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <UploadCloud className="h-8 w-8 mb-2" />
                <p className="text-sm text-center">
                  Drag & drop image here <br /> or click to upload
                </p>
              </div>
            )}
          </div>
          <FormField
             control={form.control}
             name="image"
             render={() => <FormMessage />}
          />
        </FormItem>

        {/* Type Field */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Style Type</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex flex-row gap-6"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="image" id="type-image" />
                    </FormControl>
                    <FormLabel htmlFor="type-image" className="font-normal cursor-pointer">
                      Image
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="video" id="type-video" />
                    </FormControl>
                    <FormLabel htmlFor="type-video" className="font-normal cursor-pointer">
                      Video
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormDescription>Set whether this style applies to image or video prompts.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Active Switch */}
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Active Status</FormLabel>
                <FormDescription>
                  Enable or disable this style in the app.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isUploadingImage}>
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}