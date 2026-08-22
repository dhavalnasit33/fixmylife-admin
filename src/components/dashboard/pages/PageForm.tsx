"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TiptapEditorNoSSR } from "@/components/shared/TiptapEditor";
import YoastSeoForm from "@/components/dashboard/yoast-seo/YoastSeoForm";

import type { Page, PageFormValues } from "@/types";
import { pageSchema } from "@/types";
import {
  APP_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
} from "@/config";
import { useToast } from "@/hooks/use-toast";
import { cn, deleteImage, uploadFileToServer } from "@/lib/utils";
import { PlusCircle, Trash, UploadCloud } from "lucide-react";
import apiService from "@/lib/apiService";
import { Switch } from "@/components/ui/switch";

interface PageFormProps {
  initialData?: Partial<Page>;
  onSubmit: (values: PageFormValues) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
}

export default function PageForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
}: PageFormProps) {
  const extractIds = (items: any[] | undefined): string[] => {
    if (!items) return [];
    return items
      .filter((item) => item !== null && item !== undefined)
      .map((item) => (typeof item === "object" && "_id" in item ? item._id : item))
      .filter((id): id is string => typeof id === "string");
  };

  const form = useForm<PageFormValues>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      page_title: initialData?.page_title ?? "",
      display_name: initialData?.display_name ?? "",
      slug: initialData?.slug ?? "",
      short_description: initialData?.short_description ?? "",
      mini_description: initialData?.mini_description ?? "",
      page_description: initialData?.page_description ?? "",
      seo_keyphrase: initialData?.seo_keyphrase ?? "",
      seo_title: initialData?.seo_title ?? "",
      meta_description: initialData?.meta_description ?? "",
      cover_image: initialData?.cover_image ?? "",
      tab_normal_icon_image: initialData?.tab_normal_icon_image ?? "",
      tab_active_icon_image: initialData?.tab_active_icon_image ?? "",
      tab_image: initialData?.tab_image ?? "",
      categories: extractIds(initialData?.categories),
      tags: extractIds(initialData?.tags),
      allternativeTools: extractIds(initialData?.allternativeTools),
      whatCanDO: initialData?.whatCanDO ?? [],
      sticky: initialData?.sticky ?? false,
    },
  });

  const { toast } = useToast();
  const coverImage = form.watch("cover_image");
  const tabNormalIconImage = form.watch("tab_normal_icon_image"); // ✅ Add this line
  const tabActiveIconImage = form.watch("tab_active_icon_image"); // ✅ Add this line
  const pageTitle = form.watch("page_title");
  const tabIconImage = form.watch("tab_image");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const tabNormalIconFileInputRef = useRef<HTMLInputElement | null>(null); // ✅ Add this line
  const tabActiveIconFileInputRef = useRef<HTMLInputElement | null>(null); // ✅ Add this line
  const tabIconInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingTabNormalIcon, setIsDraggingTabNormalIcon] = useState(false); // ✅ Add this line
  const [isDraggingTabActiveIcon, setIsDraggingTabActiveIcon] = useState(false); // ✅ Add this line
  const [isDraggingTabImage, setIsDraggingTabImage] = useState(false);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    [],
  );
  const [tags, setTags] = useState<{ _id: string; name: string }[]>([]);
  const [alternativeTools, setAlternativeTools] = useState<
    { _id: string; name: string }[]
  >([]);

  const whatCanDoItems = form.watch("whatCanDO") || [];

  const addWhatCanDoItem = () => {
    form.setValue("whatCanDO", [...whatCanDoItems, ""], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const updateWhatCanDoItem = (index: number, value: string) => {
    const updated = [...whatCanDoItems];
    updated[index] = value;
    form.setValue("whatCanDO", updated, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const removeWhatCanDoItem = (index: number) => {
    form.setValue(
      "whatCanDO",
      whatCanDoItems.filter((_, itemIndex) => itemIndex !== index),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  function slugify(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-");
  }

  useEffect(() => {
    const newSlug = slugify(pageTitle);

    // Set slug value silently without triggering immediate validation
    form.setValue("slug", newSlug, {
      shouldDirty: true,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [pageTitle]);

  // const handleCoverImageUpload = async (
  //   event: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;

  //   const allowedTypes = [
  //     "image/png",
  //     "image/jpeg",
  //     "image/jpg",
  //     "image/svg+xml",
  //   ];

  //   if (!allowedTypes.includes(file.type)) {
  //     toast({
  //       title: "Invalid file type",
  //       description: "Only PNG, JPG, and SVG images are allowed.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   setIsUploading(true);

  //   const formData = new FormData();
  //   formData.append("file", file);
  //   formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  //   try {
  //     const response = await fetch(
  //       `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
  //       { method: "POST", body: formData }
  //     );

  //     const data = await response.json();

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
  //     setIsUploading(false);
  //     if (fileInputRef.current) fileInputRef.current.value = "";
  //   }
  // };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiService<{ success: boolean; data: any[] }>(
          "/home-tool-categories",
        );

        if (res.success && Array.isArray(res.data)) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };

    const fetchTags = async () => {
      try {
        const res = await apiService<{ success: boolean; data: any[] }>(
          "/home-tool-tags",
        );

        if (res.success && Array.isArray(res.data)) {
          setTags(res.data);
        }
      } catch (err) {
        console.error("Failed to load tags", err);
      }
    };

    const fetchAlternativeTools = async () => {
      try {
        const res = await apiService<{ success: boolean; data: any[] }>(
          "/alternative-tools/all",
        );

        const toolList = Array.isArray((res.data as any)?.data)
          ? (res.data as any).data
          : Array.isArray(res.data)
            ? res.data
            : [];

        if (res.success) {
          setAlternativeTools(toolList);
        }
      } catch (err) {
        console.error("Failed to load alternative tools", err);
      }
    };

    fetchCategories();
    fetchTags();
    fetchAlternativeTools();
  }, []);

  const handleCoverImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
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
      // Use reusable server upload function
      const uploadedUrl = await uploadFileToServer(file, "pages"); // specify folder

      // Set form value
      form.setValue("cover_image", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });

      toast({ title: "Cover image uploaded" });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ✅ Add this function for tab normal icon image upload
  const handleTabNormalIconUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
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
      const uploadedUrl = await uploadFileToServer(file, "pages");

      form.setValue("tab_normal_icon_image", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });

      toast({ title: "Tab normal icon uploaded" });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (tabNormalIconFileInputRef.current)
        tabNormalIconFileInputRef.current.value = "";
    }
  };

  // ✅ Add this function for tab active icon image upload
  const handleTabActiveIconUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
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
      const uploadedUrl = await uploadFileToServer(file, "pages");

      form.setValue("tab_active_icon_image", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });

      toast({ title: "Tab active icon uploaded" });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (tabActiveIconFileInputRef.current)
        tabActiveIconFileInputRef.current.value = "";
    }
  };

  const handleCoverImageDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Reuse the same upload logic
      await handleCoverImageUpload({ target: { files: [file] } } as any);
    }
  };

  const handleTabNormalIconDrop = async (
    e: React.DragEvent<HTMLDivElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTabNormalIcon(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleTabNormalIconUpload({ target: { files: [file] } } as any);
    }
  };

  const handleTabActiveIconDrop = async (
    e: React.DragEvent<HTMLDivElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTabActiveIcon(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleTabActiveIconUpload({ target: { files: [file] } } as any);
    }
  };

  const handleTabIconUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
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
      const url = await uploadFileToServer(file, "pages");

      form.setValue("tab_image", url, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast({ title: "Tab icon uploaded" });
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (tabIconInputRef.current) tabIconInputRef.current.value = "";
    }
  };

  const onError = (errors: any) => {
    console.error("PageForm validation errors:", errors);
    const errorMessages: string[] = [];
    const extractErrors = (obj: any, path = "") => {
      if (!obj) return;
      if (obj.message) {
        errorMessages.push(`${path}: ${obj.message}`);
        return;
      }
      Object.keys(obj).forEach((key) => {
        const value = obj[key];
        const newPath = path ? `${path}.${key}` : key;
        if (typeof value === "object") {
          extractErrors(value, newPath);
        }
      });
    };
    extractErrors(errors);
    toast({
      title: "Validation Error",
      description: errorMessages.length > 0
        ? `Please correct the following fields:\n${errorMessages.join("\n")}`
        : "Form validation failed. Please check the fields.",
      variant: "destructive",
    });
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onError)}
        className="flex flex-col lg:flex-row gap-8"
      >
        {/* Main Form Section */}
        <div className="flex-1 space-y-8">
          {/* Page Title */}
          <FormField
            control={form.control}
            name="page_title"
            render={({ field }) => {
              const slugValue = form.watch("slug");
              const permalink = `${APP_URL}/${slugValue}`;
              return (
                <FormItem>
                  <FormLabel className="text-dark dark:text-gray-200">
                    Page Title
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-1">
                      <Input placeholder="e.g. About Us" {...field} />
                      {slugValue && (
                        <div className="text-xs text-muted-foreground">
                          <strong>Permalink:</strong>{" "}
                          <a
                            href={permalink}
                            className="text-blue-600 hover:underline break-all"
                            target="_blank"
                          >
                            {permalink}
                          </a>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="display_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-dark dark:text-gray-200">
                  Display Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. About Our Company"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  This is the friendly title you want to show in the frontend.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* <FormField
            control={form.control}
            name="slug"
            render={({ field }) => {
              const permalink = `${APP_URL}/${field.value}`;
              return (
                <FormItem>
                  <FormLabel className="text-dark dark:text-gray-200">Permalink</FormLabel>
                  <FormControl>
                    <div className="space-y-1">
                      <Input
                        placeholder="e.g. about-us"
                        {...field}
                        readOnly
                        className="bg-muted cursor-not-allowed"
                      />
                      <div className="text-xs text-muted-foreground">
                        {field.value && (
                          <span className="break-all">
                            <strong>URL:</strong>{" "}
                            <a
                              href={permalink}
                              className="text-blue-600 hover:underline"
                            >
                              {permalink}
                            </a>
                          </span>
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          /> */}

          <FormField
            control={form.control}
            name="short_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-dark dark:text-gray-200">
                  Short Description
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., AI tool that simplifies your daily tasks"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mini_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-dark dark:text-gray-200">
                  Mini Description
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., A quick 1-sentence summary"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Page Description */}
          <FormField
            control={form.control}
            name="page_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-dark dark:text-gray-200">
                  Page Description
                </FormLabel>
                <FormControl>
                  <div className="border rounded-md p-2">
                    <TiptapEditorNoSSR
                      value={field.value || ""}
                      onChange={(value) => {
                        field.onChange(value);
                        form.setValue("page_description", value, {
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

          <FormField
            control={form.control}
            name="sticky"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm my-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-dark dark:text-gray-200">
                    Sticky Tool
                  </FormLabel>
                  <p className="text-[0.8rem] text-muted-foreground">
                    Pin this page to the top of the category list.
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="grid  grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 items-start gap-4">
            <FormField
              control={form.control}
              name="categories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-dark dark:text-gray-200">
                    Home Tool Categories
                  </FormLabel>

                  <FormControl>
                    <div className="grid grid-cols-2 gap-3 border rounded p-3 bg-white dark:bg-gray-900 h-[300px] overflow-y-auto">
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

                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-dark dark:text-gray-200">
                    Home Tool Tags
                  </FormLabel>

                  <FormControl>
                    <div className="grid grid-cols-1 gap-3 border rounded p-3 bg-white dark:bg-gray-900 h-[300px] overflow-y-auto">
                      {tags.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No tags found.
                        </p>
                      ) : (
                        tags.map((tag) => (
                          <label
                            key={tag._id}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              value={tag._id}
                              checked={field.value?.includes(tag._id)}
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
                            <span>{tag.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1   items-start gap-4">
            <FormField
              control={form.control}
              name="allternativeTools"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-dark dark:text-gray-200">
                    Alternative Tools
                  </FormLabel>

                  <FormControl>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 border rounded p-3 bg-white dark:bg-gray-900 h-[300px] overflow-y-auto">
                      {alternativeTools.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No alternative tools found.
                        </p>
                      ) : (
                        alternativeTools.map((tool) => (
                          <label
                            key={tool._id}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              value={tool._id}
                              checked={field.value?.includes(tool._id)}
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
                            <span>{tool.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

          </div>
          <FormItem>
            <div className="flex items-center justify-between gap-3">
              <div>
                <FormLabel className="text-dark dark:text-gray-200">
                  What Can Do
                </FormLabel>
                <FormDescription>
                  Add one frontend capability point per row.
                </FormDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addWhatCanDoItem}
                disabled={isSubmitting}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3 border rounded p-3 bg-white dark:bg-gray-900 min-h-[300px]">
              {whatCanDoItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No capability items added yet.
                </p>
              ) : (
                whatCanDoItems.map((item, index) => (
                  <div key={`what-can-do-${index}`} className="flex gap-2">
                    <Input
                      value={item || ""}
                      onChange={(e) =>
                        updateWhatCanDoItem(index, e.target.value)
                      }
                      placeholder="e.g. Show company mission and story"
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeWhatCanDoItem(index)}
                      disabled={isSubmitting}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </FormItem>
          {/* SEO Fields */}
          <div className="pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4">Yoast SEO Settings</h3>
            <YoastSeoForm
              isSubmitting={isSubmitting}
              hideCoverImage
              hidePageDescription
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6">
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
              {isSubmitting
                ? initialData?._id
                  ? "Saving..."
                  : "Creating..."
                : initialData?._id
                  ? "Save Changes"
                  : "Create"}
            </Button>
          </div>
        </div>

        {/* Sidebar Section */}
        <div className="w-full lg:w-[300px] space-y-6 mt-8 lg:mt-0">
          <FormField
            control={form.control}
            name="cover_image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Featured Image</FormLabel>
                <FormControl>
                  <div
                    className="space-y-3"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={handleCoverImageDrop}
                  >
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleCoverImageUpload}
                    />
                    {/* <Button
                      type="button"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSubmitting || isUploading}
                      className="w-full"
                    >
                      {isUploading ? "Uploading..." : "Upload Featured Image"}
                    </Button> */}
                    {coverImage ? (
                      <div className="relative">
                        <img
                          src={coverImage}
                          alt="Preview"
                          className="h-full w-full object-cover rounded-md border p-2"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-sm"
                          onClick={async () => {
                            if (!coverImage) return;

                            try {
                              // Call delete API
                              await deleteImage(coverImage);

                              // Clear form field
                              form.setValue("cover_image", "", {
                                shouldDirty: true,
                                shouldValidate: true,
                              });

                              // Clear file input
                              if (fileInputRef.current)
                                fileInputRef.current.value = "";
                            } catch (err) {
                              console.error("Failed to delete image:", err);
                            }
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-center h-40 w-full rounded-md border-2 border-dashed border-gray-300 text-gray-500 hover:border-primary transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={handleCoverImageDrop}
                      >
                        <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                          <UploadCloud className="h-8 w-8 mb-2" />
                          <p className="text-sm text-center">
                            Drag & drop tab active icon <br /> or click to
                            upload
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ✅ Add Tab Normal Icon Image Field */}
          <FormField
            control={form.control}
            name="tab_normal_icon_image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tab Normal Icon Image</FormLabel>
                <FormControl>
                  <div
                    className={cn(
                      "relative flex flex-col items-center justify-center w-44 border-2 border-dashed rounded-lg p-4 cursor-pointer transition",
                      isDraggingTabNormalIcon
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-600",
                      "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10",
                    )}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingTabNormalIcon(true);
                    }}
                    onDragLeave={() => setIsDraggingTabNormalIcon(false)}
                    onDrop={handleTabNormalIconDrop}
                  >
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg"
                      className="hidden"
                      ref={tabNormalIconFileInputRef}
                      onChange={handleTabNormalIconUpload}
                    />
                    {tabNormalIconImage ? (
                      <div className="relative">
                        <img
                          src={tabNormalIconImage}
                          alt="Tab Normal Icon Preview"
                          className="h-full w-full object-cover rounded-md border p-2"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-sm"
                          onClick={async () => {
                            if (!tabNormalIconImage) return;

                            try {
                              await deleteImage(tabNormalIconImage);

                              form.setValue("tab_normal_icon_image", "", {
                                shouldDirty: true,
                                shouldValidate: true,
                              });

                              if (tabNormalIconFileInputRef.current)
                                tabNormalIconFileInputRef.current.value = "";
                            } catch (err) {
                              console.error("Failed to delete image:", err);
                            }
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex flex-col items-center text-gray-500 dark:text-gray-400"
                        onClick={() =>
                          tabNormalIconFileInputRef.current?.click()
                        }
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDraggingTabNormalIcon(true);
                        }}
                        onDragLeave={() => setIsDraggingTabNormalIcon(false)}
                        onDrop={handleTabNormalIconDrop}
                      >
                        <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                          <UploadCloud className="h-8 w-8 mb-2" />
                          <p className="text-sm text-center">
                            Drag & drop tab active icon <br /> or click to
                            upload
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ✅ Add Tab Active Icon Image Field */}
          <FormField
            control={form.control}
            name="tab_active_icon_image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tab Active Icon Image</FormLabel>
                <FormControl>
                  <div
                    className={cn(
                      "relative flex flex-col items-center justify-center w-44 border-2 border-dashed rounded-lg p-4 cursor-pointer transition",
                      isDraggingTabActiveIcon
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-600",
                      "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10",
                    )}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingTabActiveIcon(true);
                    }}
                    onDragLeave={() => setIsDraggingTabActiveIcon(false)}
                    onDrop={handleTabActiveIconDrop}
                  >
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg"
                      className="hidden"
                      ref={tabActiveIconFileInputRef}
                      onChange={handleTabActiveIconUpload}
                    />
                    {tabActiveIconImage ? (
                      <div className="relative">
                        <img
                          src={tabActiveIconImage}
                          alt="Tab Active Icon Preview"
                          className="h-full w-full object-cover rounded-md border p-2"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-sm"
                          onClick={async () => {
                            if (!tabActiveIconImage) return;

                            try {
                              await deleteImage(tabActiveIconImage);

                              form.setValue("tab_active_icon_image", "", {
                                shouldDirty: true,
                                shouldValidate: true,
                              });

                              if (tabActiveIconFileInputRef.current)
                                tabActiveIconFileInputRef.current.value = "";
                            } catch (err) {
                              console.error("Failed to delete image:", err);
                            }
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex flex-col items-center text-gray-500 dark:text-gray-400"
                        onClick={() =>
                          tabActiveIconFileInputRef.current?.click()
                        }
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDraggingTabActiveIcon(true);
                        }}
                        onDragLeave={() => setIsDraggingTabActiveIcon(false)}
                        onDrop={handleTabActiveIconDrop}
                      >
                        <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                          <UploadCloud className="h-8 w-8 mb-2" />
                          <p className="text-sm text-center">
                            Drag & drop tab active icon <br /> or click to
                            upload
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tab_image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tab Image</FormLabel>
                <FormControl>
                  <div
                    className={cn(
                      "relative flex flex-col items-center justify-center w-44 border-2 border-dashed rounded-lg p-4 cursor-pointer transition",
                      isDraggingTabImage
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-600",
                      "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10",
                    )}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingTabImage(true);
                    }}
                    onDragLeave={() => setIsDraggingTabImage(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingTabImage(false);
                      if (
                        e.dataTransfer.files &&
                        e.dataTransfer.files.length > 0
                      ) {
                        handleTabIconUpload({
                          target: { files: e.dataTransfer.files },
                        } as React.ChangeEvent<HTMLInputElement>);
                        e.dataTransfer.clearData();
                      }
                    }}
                    onClick={() => tabIconInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg"
                      className="hidden"
                      ref={tabIconInputRef}
                      onChange={handleTabIconUpload}
                      disabled={isSubmitting || isUploading}
                    />

                    {isUploading ? (
                      <p className="text-gray-500">Uploading...</p>
                    ) : tabIconImage ? (
                      <div className="relative w-full">
                        <img
                          src={tabIconImage}
                          alt="Tab Active Icon Preview"
                          className="h-full w-full object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-sm"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (tabIconImage) {
                              try {
                                await deleteImage(tabIconImage);
                              } catch (err) {
                                console.error("Failed to delete image:", err);
                              }
                            }
                            form.setValue("tab_image", "", {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            if (tabIconInputRef.current)
                              tabIconInputRef.current.value = "";
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                        <UploadCloud className="h-8 w-8 mb-2" />
                        <p className="text-sm text-center">
                          Drag & drop tab icon here <br /> or click to upload
                        </p>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </FormProvider>
  );
}
