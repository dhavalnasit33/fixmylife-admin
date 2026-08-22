"use client";

import React, { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Loader2, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "@/config";
import { TiptapEditorNoSSR } from "@/components/shared/TiptapEditor";
import {
  DiscoverRecipe,
  DiscoverRecipeCollectionFormValues,
  discoverRecipeCollectionSchema,
} from "@/types";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import apiService from "@/lib/apiService";

interface DiscoverRecipeCollectionFormProps {
  initialData?: DiscoverRecipeCollectionFormValues;
  onSubmit: (values: DiscoverRecipeCollectionFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  recipes: DiscoverRecipe[];
}

export default function DiscoverRecipeCollectionForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  recipes,
}: DiscoverRecipeCollectionFormProps) {
  const form = useForm<DiscoverRecipeCollectionFormValues>({
    resolver: zodResolver(discoverRecipeCollectionSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      image: "",
      discover_recipes: [],
      max_tokens: 4000,
      system_prompt: "",
      is_active: true,
    },
  });

  const { toast } = useToast();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const image = form.watch("image");
  const title = form.watch("title");

const handleImageUpload = async (file: File, folder: string = "food") => {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
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
    const formData = new FormData();
    formData.append("file", file);

    // Pass folder via query param instead of formData
    const res = await apiService<{ url: string; error?: string }>(
      `/upload?folder=${folder}`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (res.url) {
      form.setValue("image", res.url, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast({ title: "Image uploaded successfully." });
    } else {
      throw new Error(res.error || "Upload failed");
    }
  } catch (err: any) {
    toast({
      title: "Upload failed",
      description: err.message,
      variant: "destructive",
    });
  } finally {
    setIsUploading(false);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }
};

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">
                Title
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter collection title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">
                Description
              </FormLabel>
              <FormControl>
                <TiptapEditorNoSSR
                  value={field.value || ""}
                  onChange={(value) => field.onChange(value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image Upload */}
        <FormField
          control={form.control}
          name="image"
          render={() => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">
                Collection Image
              </FormLabel>
              <FormControl>
                <div>
                  {/* Hidden input */}
                  <Input
                    ref={imageInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg"
                    className="hidden"
                    onChange={handleFileInput}
                    disabled={isUploading}
                  />

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragActive(true);
                    }}
                    onDragLeave={() => setIsDragActive(false)}
                    onDrop={handleDrop}
                    className={cn(
                      "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 cursor-pointer transition",
                      isDragActive
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-600",
                      "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                    )}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                    ) : image ? (
                      // ✅ PREVIEW IS INSIDE DROP ZONE
                      <div className="relative w-full h-40">
                        <img
                          src={image}
                          alt="Preview"
                          className="w-full h-full object-contain rounded-md border p-2"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-sm"
                          onClick={(e) => {
                            e.stopPropagation(); // ✅ prevent triggering file dialog
                            form.setValue("image", "", {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            if (imageInputRef.current)
                              imageInputRef.current.value = "";
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      // Empty state (icon + text)
                      <>
                        <UploadCloud className="h-6 w-6 text-gray-500 mb-2" />
                        <p className="text-sm text-gray-600">
                          Drag & drop or click to upload
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Discover Recipes Multi-select */}
        <FormField
          control={form.control}
          name="discover_recipes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">
                Discover Recipes
              </FormLabel>
              <FormControl>
                {recipes.length === 0 ? (
                  <p>No recipes available</p>
                ) : (
                  <div className="max-h-60 overflow-auto border rounded p-2 space-y-1">
                    {recipes.map((recipe) => (
                      <label
                        key={recipe._id}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={field.value?.includes(recipe._id) || false}
                          onChange={(e) => {
                            const newValue = e.target.checked
                              ? [...(field.value || []), recipe._id]
                              : (field.value || []).filter(
                                  (id) => id !== recipe._id
                                );
                            field.onChange(newValue);
                          }}
                        />
                        <span>{recipe.title}</span>
                      </label>
                    ))}
                  </div>
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        {/* Active Toggle */}
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between border rounded p-3">
              <FormLabel className="text-dark dark:text-gray-200">
                Active
              </FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
