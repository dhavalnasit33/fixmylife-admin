"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, UploadCloud, Trash2 } from "lucide-react";
import {
  leadMagnetCategorySchema,
  type LeadMagnetCategory,
  type LeadMagnetCategoryFormValues,
} from "@/types";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService";
import { Switch } from "@/components/ui/switch";
import { APP_URL } from "@/config";
import { cn, deleteImage, uploadFileToServer } from "@/lib/utils";

interface LeadMagnetCategoryFormProps {
  initialData?: LeadMagnetCategory;
  onSubmit: (values: LeadMagnetCategoryFormValues) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-");
}

export default function LeadMagnetCategoryForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
}: LeadMagnetCategoryFormProps) {
  const { toast } = useToast();
  const [availableCategories, setAvailableCategories] = useState<LeadMagnetCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingFeatured, setIsUploadingFeatured] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const featuredImageInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<LeadMagnetCategoryFormValues>({
    resolver: zodResolver(leadMagnetCategorySchema),
    defaultValues: initialData
      ? {
        name: initialData.name,
        slug: initialData.slug,
        description: initialData.description || "",
        icon: initialData.icon || "",
        display_order: initialData.display_order || 0,
        is_active: initialData.is_active ?? true,
        related_categories: initialData.related_categories.map((c) =>
          typeof c === "string" ? c : c._id
        ) || [],
        meta_title: initialData.meta_title || "",
        meta_description: initialData.meta_description || "",
        keyphrase: initialData.keyphrase || "",
        featured_image: initialData.featured_image || "",
      }
      : {
        name: "",
        slug: "",
        description: "",
        icon: "",
        display_order: 0,
        is_active: true,
        related_categories: [],
        meta_title: "",
        meta_description: "",
        keyphrase: "",
        featured_image: "",
      },
  });

  const { watch, setValue, control } = form;
  const nameValue = watch("name");

  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const response = await apiService<any>("/lead-magnet-categories/all/admin");
      if (response.success) {
        setAvailableCategories(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories", error);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = availableCategories.filter(cat => {
    if (initialData && cat._id === initialData._id) return false;
    if (!categorySearch) return true;
    return cat.name.toLowerCase().includes(categorySearch.toLowerCase());
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, fieldName: "icon" | "featured_image") => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (fieldName === "icon") setIsUploading(true);
    else setIsUploadingFeatured(true);

    try {
      const uploadedUrl = await uploadFileToServer(file, "lead-magnet-categories");
      setValue(fieldName, uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast({
        title: "Upload Successful",
        description: `${fieldName === "icon" ? "Icon" : "Featured image"} uploaded.`,
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || `Could not upload ${fieldName}.`,
        variant: "destructive",
      });
    } finally {
      if (fieldName === "icon") {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setIsUploadingFeatured(false);
        if (featuredImageInputRef.current) featuredImageInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = async (fieldName: "icon" | "featured_image") => {
    const url = watch(fieldName);
    if (!url) return;

    try {
      await deleteImage(url);
      setValue(fieldName, "", { shouldDirty: true, shouldValidate: true });
    } catch (error) {
      console.error(`Failed to delete ${fieldName}`, error);
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Category Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Ecommerce" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="slug"
                  render={({ field }) => {
                    const slugValue = watch("slug");
                    const rawSlug = slugify(slugValue || nameValue || "");
                    const finalSlug = rawSlug ? (rawSlug.startsWith("free-") && rawSlug.endsWith("-ai-tools") ? rawSlug : `free-${rawSlug}-ai-tools`) : "";
                    const permalink = `${APP_URL}/${finalSlug}`;

                    return (
                      <FormItem>
                        <FormLabel>Slug (Optional)</FormLabel>
                        <FormControl>
                          <div className="space-y-1">
                            <Input
                              placeholder="auto-generated-if-empty"
                              {...field}
                              onChange={(e) => {
                                const val = e.target.value;
                                const formatted = val
                                  .toLowerCase()
                                  .replace(/\s+/g, "-")
                                  .replace(/[^\w-]/g, "");
                                field.onChange(formatted);
                              }}
                            />
                            {finalSlug && (
                              <div className="text-xs text-muted-foreground">
                                <strong>Permalink:</strong>{" "}
                                <a
                                  href={permalink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline break-all"
                                >
                                  {permalink}
                                </a>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Leave empty to auto-generate from name.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Category description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon / Image</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          {field.value ? (
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border group">
                              <img
                                src={field.value}
                                alt="Category Icon"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleRemoveImage("icon")}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => fileInputRef.current?.click()}
                              className={cn(
                                "border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
                                "hover:bg-muted/50 hover:border-primary/50",
                                isUploading && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              {isUploading ? (
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                              ) : (
                                <UploadCloud className="h-8 w-8 text-muted-foreground" />
                              )}
                              <p className="text-sm font-medium">
                                {isUploading ? "Uploading..." : "Click to upload icon"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                SVG, PNG, JPG or GIF
                              </p>
                            </div>
                          )}
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, "icon")}
                            disabled={isUploading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="display_order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Order</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Active Status</FormLabel>
                          <FormDescription>
                            Show or hide this category.
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Related Categories</CardTitle>
                <FormDescription>Select categories related to this one for fallback logic.</FormDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search categories..."
                    className="pl-8"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                  />
                </div>

                <FormField
                  control={control}
                  name="related_categories"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 border rounded p-3 bg-white dark:bg-gray-900 h-[250px] overflow-y-auto content-start">
                          {isLoadingCategories ? (
                            <div className="col-span-2 flex justify-center py-4">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          ) : filteredCategories.length === 0 ? (
                            <p className="text-sm text-muted-foreground col-span-2">
                              No categories found.
                            </p>
                          ) : (
                            filteredCategories.map((cat) => (
                              <label
                                key={cat._id}
                                className="flex items-center gap-2 cursor-pointer p-2 rounded h-fit"
                              >
                                <input
                                  type="checkbox"
                                  value={cat._id}
                                  checked={field.value?.includes(cat._id)}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const newSelected = new Set(field.value || []);
                                    if (newSelected.has(value)) {
                                      newSelected.delete(value);
                                    } else {
                                      newSelected.add(value);
                                    }
                                    field.onChange(Array.from(newSelected));
                                  }}
                                  className="h-4 w-4"
                                />
                                <span className="text-sm">{cat.name}</span>
                              </label>
                            ))
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <FormDescription>Configure SEO meta data for this category page.</FormDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={control}
                  name="meta_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Title</FormLabel>
                      <FormControl>
                        <Input placeholder="SEO Title..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="meta_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="SEO Description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="keyphrase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Focus Keyphrase</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. ecommerce ai tools" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="featured_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Featured Image (SEO)</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          {field.value ? (
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border group">
                              <img
                                src={field.value}
                                alt="Featured Image"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleRemoveImage("featured_image")}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => featuredImageInputRef.current?.click()}
                              className={cn(
                                "border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
                                "hover:bg-muted/50 hover:border-primary/50",
                                isUploadingFeatured && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              {isUploadingFeatured ? (
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                              ) : (
                                <UploadCloud className="h-8 w-8 text-muted-foreground" />
                              )}
                              <p className="text-sm font-medium">
                                {isUploadingFeatured ? "Uploading..." : "Click to upload featured image"}
                              </p>
                            </div>
                          )}
                          <input
                            type="file"
                            ref={featuredImageInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, "featured_image")}
                            disabled={isUploadingFeatured}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-4">
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
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : initialData ? (
                  "Update Category"
                ) : (
                  "Create Category"
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
