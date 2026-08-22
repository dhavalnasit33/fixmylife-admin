"use client";

import { useRef, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { UploadCloud, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "@/config";
import { TiptapEditorNoSSR } from "@/components/shared/TiptapEditor";
import { deleteImage, uploadFileToServer } from "@/lib/utils";

interface YoastSeoFormProps {
  isSubmitting: boolean;
  hideCoverImage?: boolean;
  hidePageDescription?: boolean;
  labelOverrides?: Partial<{
    seo_keyphrase: string;
    seo_title: string;
    meta_description: string;
    cover_image: string;
    page_description: string;
  }>;
  renderCoverImageOverride?: (
    coverImage: string | undefined
  ) => React.ReactNode;
  renderPageDescriptionOverride?: (
    pageDescription: string | undefined,
    setValue: (field: string, value: any) => void
  ) => React.ReactNode;
}

const MAX_META_DESCRIPTION_LENGTH = 160;

export default function YoastSeoForm({
  isSubmitting,
  hideCoverImage = false,
  hidePageDescription = false,
  labelOverrides = {},
  renderCoverImageOverride,
  renderPageDescriptionOverride,
}: YoastSeoFormProps) {
  const { watch, setValue, control } = useFormContext();
  const toolIconInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleCoverImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only PNG, JPG, and SVG images are allowed.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload via reusable API
      const uploadedUrl = await uploadFileToServer(file, "common");

      // Update form value
      setValue("cover_image", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });

      toast({ title: "Cover image uploaded" });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload cover image.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (toolIconInputRef.current) toolIconInputRef.current.value = "";
    }
  };

  // drag/drop handler (reuses your existing upload logic)
  const handleCoverImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file && toolIconInputRef.current) {
      // simulate input change
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      toolIconInputRef.current.files = dataTransfer.files;

      // manually trigger upload
      const changeEvent = {
        target: toolIconInputRef.current,
      } as React.ChangeEvent<HTMLInputElement>;
      handleCoverImageUpload(changeEvent);
    }
  };

  const coverImage = watch("cover_image");
  const metaDescription = watch("meta_description");
  const pageDescription = watch("page_description");

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Left side: Text fields */}
      <div className="flex-1 space-y-6">
        <FormField
          name="seo_keyphrase"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">
                {labelOverrides.seo_keyphrase || "Keyphrase"}
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. AI writing tool" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="seo_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">
                {labelOverrides.seo_title || "SEO Title"}
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Best AI Writing Tool" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="meta_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">
                {labelOverrides.meta_description || "Meta Description"}
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  maxLength={MAX_META_DESCRIPTION_LENGTH}
                  placeholder="Brief description for search engines"
                  {...field}
                />
              </FormControl>
              <div className="text-right text-sm text-muted-foreground mt-1">
                {metaDescription?.length || 0} / {MAX_META_DESCRIPTION_LENGTH}
              </div>

              <FormMessage />
            </FormItem>
          )}
        />

        {!hidePageDescription &&
          (renderPageDescriptionOverride ? (
            renderPageDescriptionOverride(pageDescription, setValue)
          ) : (
            <Controller
              name="page_description"
              control={control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-dark dark:text-gray-200">
                    Page Description
                  </FormLabel>
                  <FormControl>
                    <div className="border rounded-md">
                      <TiptapEditorNoSSR
                        value={field.value || ""}
                        onChange={(value) => field.onChange(value)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
      </div>
      {!hideCoverImage &&
        (renderCoverImageOverride ? (
          renderCoverImageOverride(coverImage)
        ) : (
          <div className="w-full lg:w-[300px] space-y-6 mt-8 lg:mt-0">
            <FormField
              name="cover_image"
              render={() => (
                <FormItem>
                  <FormLabel className="text-dark dark:text-gray-200">
                    {labelOverrides.cover_image || "Cover Image"}
                  </FormLabel>
                  <FormControl>
                    <div
                      className="space-y-4"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={handleCoverImageDrop}
                    >
                      <Input
                        id="cover_image"
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg"
                        className="hidden"
                        ref={toolIconInputRef}
                        onChange={handleCoverImageUpload}
                        disabled={isSubmitting || isUploading}
                      />

                      {!coverImage ? (
                        // Drop zone (shown only when no image is uploaded)
                        <div
                          onClick={() => toolIconInputRef.current?.click()}
                          className="flex flex-col items-center justify-center h-40  rounded-md border-2 border-dashed border-gray-300 text-gray-500 hover:border-primary transition-colors cursor-pointer"
                        >
                          {isUploading ? (
                            <Loader2 className="h-6 w-6 animate-spin mb-2" />
                          ) : (
                            <UploadCloud className="h-6 w-6 mb-2" />
                          )}
                          <p className="text-sm text-center">
                            Drag & drop an image here, or click to upload
                          </p>
                        </div>
                      ) : (
                        // Preview
                        <div className="relative w-full h-40">
                          <img
                            src={coverImage}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-md border p-2"
                          />
                          <button
                            type="button"
                            className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-sm"
                            onClick={async () => {
                              const currentUrl = coverImage;
                              if (!currentUrl) return;

                              try {
                                // Call delete API
                                await deleteImage(currentUrl);

                                // Clear form value
                                setValue("cover_image", "", {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });

                                // Reset input
                                if (toolIconInputRef.current) {
                                  toolIconInputRef.current.value = "";
                                }
                              } catch (err) {
                                console.error("Failed to delete image:", err);
                              }
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ))}
    </div>
  );
}
