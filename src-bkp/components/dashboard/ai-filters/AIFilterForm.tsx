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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, UploadCloud, X } from "lucide-react";
import { cn, deleteImage, uploadFileToServer } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { aiFilterSchema, AIFilterFormValues } from "@/types";

interface AIFilterFormProps {
  initialData?: AIFilterFormValues;
  onSubmit: (values: AIFilterFormValues) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
  submitLabel: string;
}

export default function AIFilterForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
  submitLabel,
}: AIFilterFormProps) {
  const { toast } = useToast();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingOriginal, setIsUploadingOriginal] = useState(false);
  const [isDraggingOriginal, setIsDraggingOriginal] = useState(false);
  const originalInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<AIFilterFormValues>({
    resolver: zodResolver(aiFilterSchema),
    defaultValues: {
      name: initialData?.name || "",
      image: initialData?.image || "",
      original_image: initialData?.original_image || "",
      description: initialData?.description || "",
      is_active: initialData?.is_active ?? true,
    },
  });

  const handleImageDrop = async (files: FileList) => {
    const file = files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const uploadedUrl = await uploadFileToServer(file, "ai-filters");
      form.setValue("image", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast({
        title: "Image Uploaded",
        description: "Filter image has been uploaded.",
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

  const handleOriginalImageDrop = async (files: FileList) => {
    const file = files?.[0];
    if (!file) return;

    setIsUploadingOriginal(true);
    try {
      const uploadedUrl = await uploadFileToServer(file, "ai-filters");
      form.setValue("original_image", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast({
        title: "Original Image Uploaded",
        description: "Before image has been uploaded.",
      });
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsUploadingOriginal(false);
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
              <FormLabel>Filter Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Cyberpunk, Anime Style" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description Field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description / Prompt</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="e.g., Barbie/Ken-style portrait with flawless features..." 
                  className="resize-none" 
                  rows={3} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image Upload Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormItem>
            <FormLabel>Filter Cover Image</FormLabel>
            <div
              className={cn(
                "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 cursor-pointer transition h-64",
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
                <div className="relative h-full w-full flex items-center justify-center">
                  <img
                    src={form.watch("image")}
                    alt="Preview"
                    className="h-full w-auto rounded-md object-contain"
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
                    Drag & drop filter cover <br /> or click to upload
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

          <FormItem>
            <FormLabel>Example Before Image (Optional)</FormLabel>
            <div
              className={cn(
                "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 cursor-pointer transition h-64",
                isDraggingOriginal
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-gray-600",
                "hover:border-blue-500 hover:bg-muted/50"
              )}
              onClick={() => originalInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOriginal(true);
              }}
              onDragLeave={() => setIsDraggingOriginal(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingOriginal(false);
                if (e.dataTransfer.files?.length) {
                  handleOriginalImageDrop(e.dataTransfer.files);
                  e.dataTransfer.clearData();
                }
              }}
            >
              <Input
                type="file"
                accept="image/*"
                className="hidden"
                ref={originalInputRef}
                onChange={(e) => {
                  if (e.target.files) handleOriginalImageDrop(e.target.files);
                }}
                disabled={isUploadingOriginal || isSubmitting}
              />

              {isUploadingOriginal ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : form.watch("original_image") ? (
                <div className="relative h-full w-full flex items-center justify-center">
                  <img
                    src={form.watch("original_image")}
                    alt="Original"
                    className="h-full w-auto rounded-md object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const currentImage = form.getValues("original_image");
                      if (currentImage) {
                        try {
                          await deleteImage(currentImage);
                        } catch (err) {
                          console.error("Failed to delete image:", err);
                        }
                      }
                      form.setValue("original_image", "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      if (originalInputRef.current) originalInputRef.current.value = "";
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-muted-foreground">
                  <UploadCloud className="h-8 w-8 mb-2" />
                  <p className="text-sm text-center">
                    Drag & drop 'before' image <br /> or click to upload
                  </p>
                </div>
              )}
            </div>
            <FormField
              control={form.control}
              name="original_image"
              render={() => <FormMessage />}
            />
          </FormItem>
        </div>

        {/* Active Switch */}
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Active Status</FormLabel>
                <FormDescription>
                  Enable or disable this filter in the app.
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
