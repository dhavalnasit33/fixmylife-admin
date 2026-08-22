"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
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
  FormDescription,
} from "@/components/ui/form";
import { UploadCloud, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import {
  APP_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
} from "@/config";
import type {
  AIProviderComparisonFormValues,
  AIProviderConfig,
  PaginatedResponse,
  SingleResponse,
} from "@/types";
import { aiProviderComparisonSchema } from "@/types";
import { TiptapEditorNoSSR } from "@/components/shared/TiptapEditor";
import apiService from "@/lib/apiService";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@radix-ui/react-select";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, uploadFileToServer } from "@/lib/utils";

interface AIProviderComparisonFormProps {
  initialData?: Partial<AIProviderComparisonFormValues> | null;
  onSubmit: (values: AIProviderComparisonFormValues) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
}
const MAX_META_DESCRIPTION_LENGTH = 160;
export default function AIProviderComparisonForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
}: AIProviderComparisonFormProps) {
  const { toast } = useToast();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const profilePictureInputRef = useRef<HTMLInputElement>(null);
const MAX_SHORT_DESCRIPTION_LENGTH = 200;
  const form = useForm<AIProviderComparisonFormValues>({
    resolver: zodResolver(aiProviderComparisonSchema),
    defaultValues: {
      modelId: initialData?.modelId || "",
      firstModel: initialData?.firstModel || "",
      secondModel: initialData?.secondModel || "",
      slug: initialData?.slug || "",
      title: initialData?.title || "",
      description: initialData?.description || "",
      short_description: initialData?.short_description || "",
      metaDescription: initialData?.metaDescription || "",
      keyPhrase: initialData?.keyPhrase || "",
      coverImage: initialData?.coverImage || "",
      is_active: initialData?.is_active ?? true,
      type: (initialData as any)?.type || "text",
      categories: initialData?.categories || [], // ✅ Added '?' here
      tags: initialData?.tags || [],             // ✅ Added '?' here
    },
  });


  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [tags, setTags] = useState<{ _id: string; name: string }[]>([]);

  // ✅ 2. FETCH DATA ON MOUNT
  useEffect(() => {
    const fetchCategoriesAndTags = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          apiService<any>("/home-tool-categories?limit=100"),
          apiService<any>("/home-tool-tags?limit=100"),
        ]);
        
        if (catRes.success) {
          setCategories(catRes.data?.data || catRes.data || []);
        }
        if (tagRes.success) {
          setTags(tagRes.data?.data || tagRes.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch categories or tags", error);
      }
    };

    fetchCategoriesAndTags();
  }, []);
  const [providerConfigs, setProviderConfigs] = useState<AIProviderConfig[]>(
    []
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingProviderConfigs, setIsLoadingProviderConfigs] =
    useState(true);
  const [comparisonMap, setComparisonMap] = useState<
    { firstModel: string; secondModels: string[] }[]
  >([]);

  const fetchProviderConfigs = useCallback(async () => {
    setIsLoadingProviderConfigs(true);
    try {
      const response = await apiService<PaginatedResponse<AIProviderConfig>>(
        "/ai-providers"
      );
      if (response.success) {
        setProviderConfigs(response.data || []);
      } else {
        toast({
          title: "Error",
          description:
            response.message || "Failed to fetch AI Provider Configurations.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message ||
          "An unexpected error occurred fetching provider configs.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProviderConfigs(false);
    }
  }, [toast]);

  useEffect(() => {
    const fetchComparisonMap = async () => {
      const res = await apiService<
        SingleResponse<{ firstModel: string; secondModels: string[] }[]>
      >("/ai-comparison/grouped");
      if (res.success) {
        setComparisonMap(res.data);
      }
    };
    fetchComparisonMap();
  }, []);

  useEffect(() => {
    fetchProviderConfigs();
  }, [fetchProviderConfigs]);

  // const handleProfilePictureUpload = async (
  //   event: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;

  //   setIsUploadingImage(true);
  //   const formData = new FormData();
  //   formData.append("file", file);
  //   formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  //   try {
  //     const response = await fetch(
  //       `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
  //       {
  //         method: "POST",
  //         body: formData,
  //       }
  //     );

  //     const dataRes = await response.json();
  //     if (dataRes.secure_url) {
  //       form.setValue("coverImage", dataRes.secure_url, {
  //         shouldDirty: true,
  //         shouldValidate: true,
  //       });
  //       toast({
  //         title: "Image Uploaded",
  //         description: "Cover image is ready.",
  //       });
  //     } else {
  //       throw new Error(dataRes.error?.message || "Cloudinary upload failed");
  //     }
  //   } catch (error: any) {
  //     toast({
  //       title: "Upload Failed",
  //       description: error.message || "Could not upload image.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsUploadingImage(false);
  //     if (profilePictureInputRef.current) {
  //       profilePictureInputRef.current.value = "";
  //     }
  //   }
  // };

 const handleProfilePictureUpload = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setIsUploadingImage(true);

  try {
    // ✅ Reuse your upload function
    const url = await uploadFileToServer(file, "provider-comparison");

    // Update form field
    form.setValue("coverImage", url, {
      shouldDirty: true,
      shouldValidate: true,
    });

    toast({
      title: "Image Uploaded",
      description: "Cover image is ready.",
    });
  } catch (error: any) {
    toast({
      title: "Upload Failed",
      description: error.message || "Could not upload image.",
      variant: "destructive",
    });
  } finally {
    setIsUploadingImage(false);
    if (profilePictureInputRef.current) {
      profilePictureInputRef.current.value = "";
    }
  }
};


  const handleSubmit: SubmitHandler<AIProviderComparisonFormValues> = async (
    data
  ) => {
    console.log("🚀 ~ handleSubmit ~ data:", data);
    data.modelId = data.firstModel;
    await onSubmit(data);
  };

  const initialSecondModelId = initialData?.secondModel || "";

  const metaDescription = useWatch({
    control: form.control,
    name: "metaDescription",
  });
  const isButtonDisabled = isUploadingImage || isSubmitting;

  useEffect(() => {
    const first = providerConfigs.find(
      (p) => p._id === form.watch("firstModel")
    );
    const second = providerConfigs.find(
      (p) => p._id === form.watch("secondModel")
    );

    let slug = "";

    if (first) {
      slug += first?.title?.toLowerCase().replace(/\s+/g, "-");
    }

    if (first && second) {
      slug += "-vs-" + second?.title?.toLowerCase().replace(/\s+/g, "-");
    } else if (first) {
      slug += "-vs";
    }

    form.setValue("slug", slug, {
      shouldDirty: true,
      shouldTouch: false,
      shouldValidate: true,
    });
  }, [form.watch("firstModel"), form.watch("secondModel"), providerConfigs]);

  useEffect(() => {
    if (initialData?.firstModel) {
      form.setValue("modelId", initialData.firstModel);
    }
  }, [initialData?.firstModel]);

  const shortDescription = useWatch({
    control: form.control,
    name: "short_description",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-dark dark:text-gray-200">
                  First Model
                </FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    // onValueChange={(e) => {
                    //     const selectedId = e.target.value;
                    //     field.onChange(selectedId);
                    //     form.setValue('modelId', selectedId);
                    // }}
                    onValueChange={(selectedId) => {
                      field.onChange(selectedId);
                      form.setValue("modelId", selectedId);
                    }}
                    // className="w-full border rounded-md p-2"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select first model" />
                    </SelectTrigger>
                    <SelectContent>
                      {providerConfigs.map((provider) => (
                        <SelectItem key={provider._id} value={provider._id}>
                          {provider.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="secondModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-dark dark:text-gray-200">
                  Compare Against
                </FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    disabled={!form.watch("firstModel")}
                    onValueChange={field.onChange}
                    // className="w-full border rounded-md p-2"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select second model" />
                    </SelectTrigger>
                    <SelectContent>
                      {providerConfigs
                        .filter((p) => {
                          const selectedFirstId = form.watch("firstModel");
                          const selectedSecondId = form.watch("secondModel");

                          if (!selectedFirstId) return true;

                          const firstModel = providerConfigs.find(
                            (cfg) => cfg._id === selectedFirstId
                          );
                          if (!firstModel) return false;

                          const comparisonEntry = comparisonMap.find(
                            (entry: any) =>
                              entry.firstModel ===
                              firstModel?.title?.toLowerCase()
                          );

                          const excludedNames =
                            comparisonEntry?.secondModels || [];

                          const isExcluded = excludedNames.includes(
                            p?.title?.toLowerCase()
                          );
                          const isCurrentSecondModel =
                            p._id === selectedSecondId;
                          const isInitialSecondModel =
                            p._id === initialSecondModelId;

                          return (
                            p._id !== selectedFirstId &&
                            (!isExcluded ||
                              isCurrentSecondModel ||
                              isInitialSecondModel)
                          );
                        })
                        .map((provider) => (
                          <SelectItem key={provider._id} value={provider._id}>
                            {provider.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="slug"
          render={() => {
            const slugValue = form.watch("slug");
            const permalink = `${APP_URL}/${slugValue}`;

            return (
              <FormItem>
                <FormControl>
                  <div className="space-y-1">
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
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comparison Type</FormLabel>
              <FormControl>
                <Select
                  value={field.value || "text"}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="short_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief summary for listings..."
                  className="h-20"
                  maxLength={MAX_SHORT_DESCRIPTION_LENGTH}
                  {...field}
                />
              </FormControl>
              <div className="flex justify-between text-sm mt-1">
                <FormDescription>
                  Summary displayed in comparison cards.
                </FormDescription>
                <div className={cn(
                  "font-medium",
                  (shortDescription?.length || 0) >= MAX_SHORT_DESCRIPTION_LENGTH 
                    ? "text-destructive" 
                    : "text-muted-foreground"
                )}>
                  {shortDescription?.length || 0} / {MAX_SHORT_DESCRIPTION_LENGTH}
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

<FormField
          control={form.control}
          name="categories"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">Categories</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-4 border p-4 rounded-md max-h-48 overflow-y-auto bg-background">
                  {categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No categories found.</p>
                  ) : (
                    categories.map((category) => (
                      <label key={category._id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          value={category._id}
                          checked={field.value?.includes(category._id)}
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
                        <span className="text-sm">{category.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ✅ TAGS SELECTION */}
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">Tags</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-4 border p-4 rounded-md max-h-48 overflow-y-auto bg-background">
                  {tags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tags found.</p>
                  ) : (
                    tags.map((tag) => (
                      <label key={tag._id} className="flex items-center gap-2 cursor-pointer">
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
                        <span className="text-sm">{tag.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Controller
          name="description"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
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

        <FormField
          control={form.control}
          name="keyPhrase"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Key Phrase</FormLabel>
              <FormControl>
                <Input placeholder="e.g. chatbot comparison" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. ChatGPT vs Gemini" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="metaDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meta Description</FormLabel>
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

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <FormItem>
            <FormLabel className="text-dark dark:text-gray-200">
              Cover Image
            </FormLabel>

            <div
              className={cn(
                "flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary transition",
                isDragging && "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              )}
              onClick={() => profilePictureInputRef.current?.click()}
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

                const fakeEvent = {
                  target: { files: [file] },
                } as unknown as React.ChangeEvent<HTMLInputElement>;

                await handleProfilePictureUpload(fakeEvent);
              }}
            >
              <Input
                id="coverImageInput"
                type="file"
                accept=".png,.jpg,.jpeg,.svg"
                className="hidden"
                ref={profilePictureInputRef}
                onChange={handleProfilePictureUpload}
                disabled={isUploadingImage || isButtonDisabled}
              />

              {/* Show loader while uploading */}
              {isUploadingImage && (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              )}

              {/* Show icon + text ONLY if no image */}
              {!form.watch("coverImage") && !isUploadingImage && (
                <>
                  <UploadCloud className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground text-center">
                    Drag & drop an image here, or click to upload
                  </span>
                </>
              )}

              {/* Preview image */}
              {form.watch("coverImage") && (
                <img
                  src={form.watch("coverImage")}
                  alt="Preview"
                  className="mt-3 h-28 w-28 rounded-md border object-cover"
                />
              )}
              
            </div>

            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <>
                  <FormControl>
                    <input type="hidden" {...field} />
                  </FormControl>
                  <FormDescription>
                    Upload a cover image (JPG, PNG, or SVG).
                  </FormDescription>
                  <FormMessage />
                </>
              )}
            />
          </FormItem>

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm w-full md:w-1/2">
                <div className="space-y-0.5">
                  <FormLabel>Status</FormLabel>
                  <FormDescription>
                    Is this comparison currently active and visible?
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

        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isButtonDisabled}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isButtonDisabled}>
            {isSubmitting
              ? initialData
                ? "Updating Comparison..."
                : "Creating Comparison..."
              : initialData
              ? "Update Comparison"
              : "Create Comparison"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
