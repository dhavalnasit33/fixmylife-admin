"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
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
import { Loader2, UploadCloud, X } from "lucide-react";
import { cn, deleteImage, uploadFileToServer } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  PromptDataFormValues,
  promptDataSchema,
  SingleResponse,
  PromptCategory,
} from "@/types";
import apiService from "@/lib/apiService";
import { TiptapEditorNoSSR } from "@/components/shared/TiptapEditor";

interface PromptDataFormProps {
  initialData?: PromptDataFormValues | null;
  onSubmit: (values: PromptDataFormValues) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
}

export default function PromptDataForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
}: PromptDataFormProps) {
  const { toast } = useToast();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleImageDrop = async (files: FileList) => {
    const file = files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const uploadedUrl = await uploadFileToServer(file, "prompt-data");
      form.setValue("image", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast({
        title: "Image Uploaded",
        description: "Prompt image has been uploaded.",
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


  const form = useForm<PromptDataFormValues>({
    resolver: zodResolver(promptDataSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      category: initialData?.category || [], // Empty array if no categories
      image: initialData?.image || "", // Empty string if no image
      short_description: initialData?.short_description || "",
      description: initialData?.description || "",
      is_active: initialData?.is_active ?? true,

    },
  });

  // Fetch Prompt Categories for the dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiService<SingleResponse<PromptCategory[]>>(
          "/prompt-categories/all/admin",
          { method: "GET" }
        );
        if (res.success) {
          setCategories(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch categories");
      }
    };
    fetchCategories();
  }, []);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const uploadedUrl = await uploadFileToServer(file, "prompt-data");
      form.setValue("image", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast({
        title: "Image Uploaded",
        description: "Prompt image has been uploaded.",
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
        <div className="grid gap-6 md:grid-cols-2">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Prompt Name"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value);

                      // Auto-generate slug from name
                      if (value && !form.getValues("slug")) {
                        const slug = value
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace(/[^a-z0-9-]/g, "");
                        form.setValue("slug", slug, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Slug (Optional) */}
          {/* <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="auto-generated-slug" 
                    {...field}
                    onChange={(e) => {
                      // Allow manual override, but format it
                      const value = e.target.value;
                      const formatted = value
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, "");
                      field.onChange(formatted);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Auto-generated from name. Can be edited manually.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          /> */}
        </div>

        {/* Categories (Checkbox grid layout) - Optional */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">
                Prompt Categories (Optional)
              </FormLabel>
              <FormControl>
                <div className="grid grid-cols-2 gap-3 border rounded p-3 bg-white dark:bg-gray-900">
                  {categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No categories found.
                    </p>
                  ) : (
                    categories.map((cat) => (
                      <label
                        key={cat._id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          value={cat._id}
                          checked={field.value?.includes(cat._id)}
                          onChange={(e) => {
                            const value = e.target.value;
                            let newSelected = new Set(field.value || []);

                            if (newSelected.has(value)) {
                              newSelected.delete(value);
                            } else {
                              newSelected.add(value);
                            }

                            field.onChange(Array.from(newSelected));
                          }}
                          className="h-4 w-4"
                        />
                        <span>{cat.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </FormControl>
              <FormDescription>
                Select categories for this prompt (optional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Short Description */}
        <FormField
          control={form.control}
          name="short_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief summary..."
                  className="h-20"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Long Description with Rich Text Editor */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Description</FormLabel>
              <FormControl>
                <div className="border rounded-md">
                  <TiptapEditorNoSSR
                    value={field.value || ""}
                    onChange={(value) => {
                      field.onChange(value);
                      form.setValue("description", value, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      });
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image Upload - Optional */}
        <FormItem>
          <FormLabel>Cover Image (Optional)</FormLabel>

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
                  className="h-40 w-auto rounded-md object-cover"
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
                  Drag & drop image here <br /> or click to upload
                </p>
              </div>
            )}
          </div>

          <FormDescription>Optional cover image for the prompt</FormDescription>
          <FormMessage />
        </FormItem>

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
          <Button type="submit" disabled={isSubmitting || isUploadingImage}>
            {isSubmitting
              ? initialData
                ? "Saving..."
                : "Creating..."
              : initialData
                ? "Save Changes"
                : "Create Prompt Data"}
          </Button>
        </div>
      </form>
    </Form>
  );
}