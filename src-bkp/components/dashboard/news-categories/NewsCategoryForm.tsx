"use client";

import type { SubmitHandler } from "react-hook-form";
import { useForm, useFormContext, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import type { NewsCategory } from "@/types";
import { Switch } from "@/components/ui/switch";
import { UploadCloud, Loader2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_BASE_URL } from "@/config";
import { newsCategorySchema, NewsCategoryFormValues } from "@/types";
import { cn, uploadFileToServer } from "@/lib/utils";

const CLOUDINARY_CLOUD_NAME = "dyk7nqgkv";
const CLOUDINARY_UPLOAD_PRESET = "openchatAI";

interface NewsCategoryFormProps {
  initialData?:
    | (NewsCategoryFormValues & {
        parent?: string | { _id: string };
      })
    | null;
  onSubmit: (values: NewsCategoryFormValues) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
  categories?: NewsCategory[];
}

function flattenCategoryTree(
  tree: NewsCategory[],
  level = 0
): { label: string; plainLabel: string; value: string }[] {
  return tree.flatMap((node) => {
    const indent = "\u00A0\u00A0".repeat(level); // 2 non-breaking spaces per level
    const label = `${indent}${level > 0 ? "↳ " : ""}${node.name}`;
    const current = [{ label, plainLabel: node.name, value: node._id }];
    const children = flattenCategoryTree(node.children || [], level + 1);
    return [...current, ...children];
  });
}

export default function NewsCategoryForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
  categories = [],
}: NewsCategoryFormProps) {
  const { toast } = useToast();
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<
    { label: string; plainLabel: string; value: string }[]
  >([]);

  const iconInputRef = useRef<HTMLInputElement>(null);

  const MAX_META_DESCRIPTION_LENGTH = 160;

  const defaultParent =
    typeof initialData?.parent === "object" && initialData.parent !== null
      ? (initialData.parent as { _id: string })._id
      : initialData?.parent || "none";
  const form = useForm<NewsCategoryFormValues>({
    resolver: zodResolver(newsCategorySchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      icon: initialData?.icon || "",
      is_active: initialData?.is_active ?? true,
      parent: defaultParent,
       is_popular: initialData?.is_popular ?? false,
    },
  });
  const description = form.watch("description");
  useEffect(() => {
    const fetchCategoryTree = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/news-categories/tree`);
        const json = await res.json();
        if (json.success) {
          // Add "No Parent" option at the top with empty string value
          const flat = flattenCategoryTree(json.data);
          setCategoryOptions([
            { label: "No Parent", plainLabel: "No Parent", value: "none" },
            ...flat,
          ]);
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCategoryTree();
  }, []);

  const [isDragging, setIsDragging] = useState(false);
  // const handleIconFile = async (file: File) => {
  //   setIsUploadingIcon(true);
  //   const formData = new FormData();
  //   formData.append("file", file);
  //   formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  //   try {
  //     const res = await fetch(
  //       `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
  //       {
  //         method: "POST",
  //         body: formData,
  //       }
  //     );
  //     const data = await res.json();
  //     if (data.secure_url) {
  //       form.setValue("icon", data.secure_url, {
  //         shouldDirty: true,
  //         shouldValidate: true,
  //       });
  //       toast({ title: "Icon uploaded successfully" });
  //     } else {
  //       toast({ title: "Failed to upload icon", variant: "destructive" });
  //     }
  //   } catch (err) {
  //     toast({ title: "Failed to upload icon", variant: "destructive" });
  //   } finally {
  //     setIsUploadingIcon(false);
  //   }
  // };
  const handleIconFile = async (file: File) => {
  setIsUploadingIcon(true);

  try {
    // Use reusable server upload function
    const uploadedUrl = await uploadFileToServer(file, "news-category"); 

    form.setValue("icon", uploadedUrl, {
      shouldDirty: true,
      shouldValidate: true,
    });

    toast({ title: "Icon uploaded successfully" });
  } catch (err: any) {
    console.error("Icon upload failed:", err);
    toast({ title: "Failed to upload icon", description: err.message, variant: "destructive" });
  } finally {
    setIsUploadingIcon(false);
  }
};


  const handleSubmit: SubmitHandler<NewsCategoryFormValues> = async (data) => {
    if (data.parent === "none") {
      data.parent = undefined;
    }
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Category name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Description"
                  maxLength={MAX_META_DESCRIPTION_LENGTH}
                  {...field}
                />
              </FormControl>
              <div className="text-right text-sm text-muted-foreground mt-1">
                {description?.length || 0} / {MAX_META_DESCRIPTION_LENGTH}
              </div>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel className="text-dark dark:text-gray-200">
            Category Icon
          </FormLabel>

          <div
            className={cn(
              "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 cursor-pointer transition",
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
            onDrop={async (e) => {
              e.preventDefault();
              setIsDragging(false);

              const file = e.dataTransfer.files?.[0];
              if (!file) return;

              // trigger the same upload logic
              await handleIconFile(file);
            }}
            onClick={() => iconInputRef.current?.click()}
          >
            {/* Hidden input for normal click upload */}
            <Input
              id="categoryIconInput"
              type="file"
              accept="image/*,.svg"
              className="hidden"
              ref={iconInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleIconFile(file);
              }}
              disabled={isUploadingIcon || isSubmitting}
            />

            {isUploadingIcon ? (
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            ) : form.watch("icon") ? (
              <img
                src={form.watch("icon")}
                alt="Category Icon Preview"
                className="h-16 w-16 rounded-md border object-cover"
              />
            ) : (
              <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                <UploadCloud className="h-8 w-8 mb-2" />
                <p className="text-sm text-center">
                  Drag & drop an icon here <br /> or click to upload
                </p>
              </div>
            )}
          </div>

          {/* Hidden form field to store uploaded URL */}
          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <>
                <FormControl>
                  <input type="hidden" {...field} />
                </FormControl>
                <FormDescription>
                  Upload an icon for the category.
                </FormDescription>
                <FormMessage />
              </>
            )}
          />
        </FormItem>

        {/* <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Icon URL"
                    {...field}
                    value={field.value || ""}
                    onChange={field.onChange}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    ref={iconInputRef}
                    style={{ display: "none" }}
                    onChange={handleIconUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => iconInputRef.current?.click()}
                    disabled={isUploadingIcon}
                  >
                    {isUploadingIcon ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <UploadCloud />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormDescription>
                Upload or paste a URL for the category icon.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        /> */}
        <FormField
          control={form.control}
          name="parent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent Category</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || "none"}
                defaultValue={field.value || "none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="font-mono"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Optional: Assign a parent category for hierarchy.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Status</FormLabel>
                <FormDescription>
                  Set whether this category is active.
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
        <FormField
  control={form.control}
  name="is_popular"
  render={({ field }) => (
    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
      <div className="space-y-0.5">
        <FormLabel>Popular Category</FormLabel>
        <FormDescription>
          Toggle if this category should be marked as popular.
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

        <div className="flex gap-2 justify-end">
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
            {initialData ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
