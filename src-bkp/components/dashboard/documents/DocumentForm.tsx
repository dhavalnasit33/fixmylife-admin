"use client";

import React, { useEffect, useRef, useState } from "react";
import { useFieldArray } from "react-hook-form";
import { UploadCloud, Trash2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn, deleteImage, uploadFileToServer } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "@/config";
import YoastSeoForm from "../yoast-seo/YoastSeoForm";
import { Textarea } from "@/components/ui/textarea";

interface DocumentFormProps {
  form: any;
  isSubmitting: boolean;
}

export default function DocumentForm({
  form,
  isSubmitting,
}: DocumentFormProps) {
  const { toast } = useToast();
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  // const coverImage = form.watch("cover_image");
  const [preview, setPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Manage multiple file inputs for documents topics
  const fileInputRefs = useRef<HTMLInputElement[]>([]);

  // documents topics field array
  const {
    fields: documentsFields,
    append: appendDocuments,
    remove: removeDocuments,
  } = useFieldArray({
    control: form.control,
    name: "documents",
  });

  useEffect(() => {
    if (documentsFields.length === 0) {
      appendDocuments({ title: "", icon: "" });
    }
  }, [documentsFields, appendDocuments]);

  // // Upload helper
  // const uploadToCloudinary = async (file: File) => {
  //   const formData = new FormData();
  //   formData.append("file", file);
  //   formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  //   const response = await fetch(
  //     `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
  //     { method: "POST", body: formData }
  //   );
  //   return response.json();
  // };

  // // Handle icon upload for documents topic
  // const handleIconUpload = async (
  //   file: File,
  //   onChange: (value: string) => void
  // ) => {
  //   setIsUploading(true);
  //   try {
  //     const data = await uploadToCloudinary(file);
  //     if (data.secure_url) {
  //       onChange(data.secure_url);
  //       toast({ title: "Icon Uploaded" });
  //     } else {
  //       throw new Error(data.error?.message || "Cloudinary upload failed");
  //     }
  //   } catch (error: any) {
  //     toast({
  //       title: "Upload Failed",
  //       description: error.message,
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsUploading(false);
  //   }
  // };

  // // Handle cover image upload
  // const allowedTypes = [
  //   "image/png",
  //   "image/jpeg",
  //   "image/jpg",
  //   "image/svg+xml",
  // ];
  // const handleCoverImageUpload = async (
  //   event: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;

  //   if (!allowedTypes.includes(file.type)) {
  //     toast({
  //       title: "Invalid file type",
  //       description: "Only PNG, JPG, and SVG images are allowed.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   setPreview(true);
  //   try {
  //     const data = await uploadToCloudinary(file);
  //     if (data.secure_url) {
  //       form.setValue("cover_image", data.secure_url, {
  //         shouldDirty: true,
  //         shouldValidate: true,
  //       });
  //       toast({ title: "Cover image uploaded" });
  //     } else {
  //       throw new Error(data.error?.message || "Upload failed");
  //     }
  //   } catch (error: any) {
  //     toast({
  //       title: "Upload Failed",
  //       description: error.message,
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setPreview(false);
  //     if (coverImageInputRef.current) coverImageInputRef.current.value = "";
  //   }
  // };

  const handleIconUpload = async (
    file: File,
    onChange: (value: string) => void
  ) => {
    setIsUploading(true);
    try {
      const uploadedUrl = await uploadFileToServer(file, "documents");

      onChange(uploadedUrl);

      toast({ title: "Image uploaded successfully." });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Could not upload image.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  const [coverImage, setCoverImage] = useState("");

  const handleCoverImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPreview(true);
    try {
      const uploadedUrl = await uploadFileToServer(file, "documents");
      setCoverImage(uploadedUrl); // 👈 update local state
      form.setValue("cover_image", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast({ title: "Image uploaded successfully." });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPreview(false);
      if (coverImageInputRef.current) coverImageInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main Section */}
      <div className="flex-1 space-y-8">
        {/* documents Topics Section */}
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {documentsFields.map((item, index) => (
              <Card key={item.id} className="p-4 bg-muted/30 space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-primary">
                    Documents {index + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDocuments(index)}
                    disabled={isSubmitting || documentsFields.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                  </Button>
                </div>

                {/* Title Field */}
                <FormField
                  control={form.control}
                  name={`documents.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Document about funding research..."
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Icon Field */}
                <FormField
                  control={form.control}
                  name={`documents.${index}.icon`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Icon</FormLabel>
                      <FormControl>
                        <div
                          className={cn(
                            "relative flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-4 cursor-pointer transition",
                            isDragging
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-300 dark:border-gray-600",
                            "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                          )}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                          }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            if (e.dataTransfer.files?.[0]) {
                              handleIconUpload(
                                e.dataTransfer.files[0],
                                field.onChange
                              );
                            }
                          }}
                          onClick={() => fileInputRefs.current[index]?.click()}
                        >
                          <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.svg"
                            className="hidden"
                            ref={(el) => {
                              if (el) fileInputRefs.current[index] = el;
                            }}
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleIconUpload(
                                  e.target.files[0],
                                  field.onChange
                                );
                              }
                            }}
                            disabled={isSubmitting || isUploading}
                          />

                          {isUploading ? (
                            <p className="text-gray-500">Uploading...</p>
                          ) : field.value ? (
                            <div className="relative w-full">
                              <img
                                src={field.value}
                                alt="Icon Preview"
                                className="h-24 w-24 object-cover rounded-md border mx-auto"
                              />
                              <button
                                type="button"
                                className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-sm"
                                onClick={async (e) => {
                                  e.stopPropagation();

                                  try {
                                    // ✅ Call your delete API
                                    await deleteImage(coverImage);

                                    // Clear both local + form state
                                    setCoverImage("");
                                    form.setValue("cover_image", "", {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    });

                                    if (coverImageInputRef.current) {
                                      coverImageInputRef.current.value = "";
                                    }
                                  } catch (err) {
                                    console.error(
                                      "Failed to delete cover image",
                                      err
                                    );
                                  }
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                              <UploadCloud className="h-8 w-8 mb-2" />
                              <p className="text-sm text-center">
                                Drag & drop an icon here <br /> or click to
                                upload
                              </p>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Card>
            ))}

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendDocuments({ title: "", icon: "" })}
                disabled={isSubmitting}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Documents
              </Button>
            </div>
          </CardContent>
        </Card>

        <FormField
          control={form.control}
          name="max_tokens"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">
                Max Tokens
              </FormLabel>
              <FormControl>
                <Input
                  type="text" // use text instead of number
                  placeholder="Enter max tokens"
                  value={field.value?.toString() ?? ""} // show value as string
                  onChange={(e) => {
                    const val = e.target.value;
                    // Only allow digits
                    const digitsOnly = val.replace(/\D/g, "");
                    // Keep empty string if user clears input
                    field.onChange(digitsOnly === "" ? "" : Number(digitsOnly));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="system_prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">
                System Prompt
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter system prompt"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* SEO Section */}
        <div className="pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4">Yoast SEO Settings</h3>
          <YoastSeoForm
            isSubmitting={isSubmitting}
            hideCoverImage
            hidePageDescription
          />
        </div>
      </div>

      {/* Sidebar: Cover Image */}
      <div className="w-full lg:w-[300px] space-y-6 mt-8 lg:mt-0">
        <div>
          <label className="block text-sm font-medium mb-1">
            Featured Image
          </label>

          <Input
            id="cover_image"
            type="file"
            accept=".png,.jpg,.jpeg,.svg"
            className="hidden"
            ref={coverImageInputRef}
            onChange={handleCoverImageUpload}
            disabled={isSubmitting}
          />

          {coverImage ? (
            <div
              className="relative w-full h-40 mt-2 rounded-md overflow-hidden"
              onClick={() => coverImageInputRef.current?.click()}
            >
              <img
                src={coverImage}
                alt="Cover Preview"
                className="w-full h-full object-cover border p-2 cursor-pointer"
              />
              <button
                type="button"
                className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-sm"
                onClick={async (e) => {
                  e.stopPropagation();

                  try {
                    // ✅ Call API to delete file from server
                    if (coverImage) {
                      await deleteImage(coverImage);
                    }

                    // ✅ Clear local state
                    setCoverImage("");

                    // ✅ Clear form state
                    form.setValue("cover_image", "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    });

                    // ✅ Clear input field
                    if (coverImageInputRef.current) {
                      coverImageInputRef.current.value = "";
                    }

                    toast({ title: "Image removed successfully." });
                  } catch (err) {
                    console.error("Failed to delete image:", err);
                    toast({
                      title: "Delete Failed",
                      description: "Could not remove the image from server.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              className="flex items-center justify-center h-40 w-full mt-2 rounded-md border-2 border-dashed border-gray-300 text-gray-500 hover:border-primary transition-colors cursor-pointer"
              onClick={() => coverImageInputRef.current?.click()}
            >
              <p className="text-center text-sm text-gray-600">
                Drag & Drop an image here or Click to Upload
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
