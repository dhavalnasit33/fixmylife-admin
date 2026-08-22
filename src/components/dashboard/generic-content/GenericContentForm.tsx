"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Trash2, PlusCircle, UploadCloud, Loader2, Trash } from "lucide-react";
import { cn, deleteImage, uploadFileToServer } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import YoastSeoForm from "../yoast-seo/YoastSeoForm";
import { useFieldArray } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { TiptapEditorNoSSR } from "@/components/shared/TiptapEditor";
import apiService from "@/lib/apiService";

interface GenericContentFormProps {
  form: any;
  isSubmitting: boolean;
}

export default function GenericContentForm({
  form,
  isSubmitting,
}: GenericContentFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const tabNormalIconFileInputRef = useRef<HTMLInputElement | null>(null); // ✅ Add this line
  const tabActiveIconFileInputRef = useRef<HTMLInputElement | null>(null); // ✅ Add this line
  const tabIconInputRef = useRef<HTMLInputElement | null>(null);
  const coverImage = form.watch("cover_image");
  const tabNormalIconImage = form.watch("tab_normal_icon_image"); // ✅ Add this line
  const tabActiveIconImage = form.watch("tab_active_icon_image"); // ✅ Add this line
  const tabIconImage = form.watch("tab_image");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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

  // suggested topics field array
  const {
    fields: suggestedTopicFields,
    append: appendSuggestedTopic,
    remove: removeSuggestedTopic,
  } = useFieldArray({
    control: form.control,
    name: "suggested_topics",
  });

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
      whatCanDoItems.filter((_: string, itemIndex: number) => itemIndex !== index),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  useEffect(() => {
    if (suggestedTopicFields.length === 0) {
      appendSuggestedTopic({
        title: "",
        has_input: true,
        image: "",
        sticky: false,
      });
    }
  }, [suggestedTopicFields, appendSuggestedTopic]);
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

  // Upload handler for cover image
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
      const uploadedUrl = await uploadFileToServer(file, "common");
      form.setValue("cover_image", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast({ title: "Cover image uploaded" });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Something went wrong",
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
      const uploadedUrl = await uploadFileToServer(file, "common");
      form.setValue("tab_normal_icon_image", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast({ title: "Tab normal icon uploaded" });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Something went wrong",
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
      const uploadedUrl = await uploadFileToServer(file, "common");
      form.setValue("tab_active_icon_image", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast({ title: "Tab active icon uploaded" });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (tabActiveIconFileInputRef.current)
        tabActiveIconFileInputRef.current.value = "";
    }
  };

  // Upload handler for topic images
  const handleTopicImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number,
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

    try {
      const uploadedUrl = await uploadFileToServer(file, "common");
      form.setValue(`suggested_topics.${index}.image`, uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast({ title: "Topic image uploaded" });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
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
      const url = await uploadFileToServer(file, "common");

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

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main Section */}
      <div className="flex-1 space-y-8">
        {/* Suggested Topics Section */}
        <Card>
          <CardHeader>
            <CardTitle>Suggested Topics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.isArray(suggestedTopicFields) &&
              suggestedTopicFields.map((item, index) => (
                <Card key={item.id} className="p-4 bg-muted/30 space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-primary">
                      Suggested Topic {index + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSuggestedTopic(index)}
                      disabled={isSubmitting}
                      // || suggestedTopicFields.length === 1
                    >
                      <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                    </Button>
                  </div>

                  {/* Title field */}
                  <FormField
                    control={form.control}
                    name={`suggested_topics.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Write a newsletter about..."
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Sticky toggle */}
                  <FormField
                    control={form.control}
                    name={`suggested_topics.${index}.sticky`}
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between border rounded-md px-3 py-2">
                        <FormLabel className="m-0">Sticky</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={(val) => field.onChange(val)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Image upload for topic */}
                  <FormField
                    control={form.control}
                    name={`suggested_topics.${index}.image`}
                    render={({ field }) => {
                      const [isDragging, setIsDragging] = React.useState(false);

                      const handleDrop = async (
                        event: React.DragEvent<HTMLDivElement>,
                      ) => {
                        event.preventDefault();
                        setIsDragging(false);

                        const file = event.dataTransfer.files?.[0];
                        if (!file) return;

                        // Reuse your existing handler logic
                        const fakeEvent = {
                          target: { files: [file] },
                        } as unknown as React.ChangeEvent<HTMLInputElement>;

                        await handleTopicImageUpload(fakeEvent, index);
                      };

                      const handleDragOver = (
                        event: React.DragEvent<HTMLDivElement>,
                      ) => {
                        event.preventDefault();
                        setIsDragging(true);
                      };

                      const handleDragLeave = (
                        event: React.DragEvent<HTMLDivElement>,
                      ) => {
                        event.preventDefault();
                        setIsDragging(false);
                      };

                      return (
                        <FormItem>
                          <FormLabel>Topic Image</FormLabel>
                          <FormControl>
                            <div
                              className={cn(
                                "relative flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-4 cursor-pointer transition",
                                "border-gray-300 dark:border-gray-600",
                                "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10",
                                isDragging &&
                                  "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10",
                              )}
                              onClick={() =>
                                document
                                  .getElementById(`topic-image-${index}`)
                                  ?.click()
                              }
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                            >
                              <input
                                id={`topic-image-${index}`}
                                type="file"
                                accept=".png,.jpg,.jpeg,.svg"
                                className="hidden"
                                onChange={(e) =>
                                  handleTopicImageUpload(e, index)
                                }
                                disabled={isSubmitting}
                              />

                              {field.value ? (
                                <div className="relative h-32 w-32">
                                  <img
                                    src={field.value}
                                    alt="Topic"
                                    className="h-full w-full object-cover rounded-md border"
                                  />
                                  <button
                                    type="button"
                                    className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-sm"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (field.value) {
                                        try {
                                          await deleteImage(field.value);
                                        } catch (err) {
                                          console.error(
                                            "Error deleting image:",
                                            err,
                                          );
                                        }
                                      }
                                      form.setValue(
                                        `suggested_topics.${index}.image`,
                                        "",
                                        {
                                          shouldDirty: true,
                                          shouldValidate: true,
                                        },
                                      );
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                                  <UploadCloud className="h-6 w-6 mb-1" />
                                  <p className="text-xs text-center">
                                    Click or drag & drop topic image
                                  </p>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </Card>
              ))}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendSuggestedTopic({
                    title: "",
                    has_input: true,
                    image: "",
                    sticky: false,
                  })
                }
                disabled={isSubmitting}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Suggested Topic
              </Button>
            </div>
          </CardContent>
        </Card>

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
                  placeholder="e.g., Blog Post Generator"
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
              <FormLabel>Mini Description</FormLabel>
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

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">
                Description
              </FormLabel>
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
                  type="text"
                  placeholder="Enter max tokens"
                  value={field.value?.toString() ?? ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    field.onChange(val === "" ? "" : Number(val));
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
                  Pin this tool to the top of the category list.
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
        {/* SEO Section */}
        <div className="pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4">Yoast SEO Settings</h3>
          <YoastSeoForm
            isSubmitting={isSubmitting}
            hideCoverImage
            hidePageDescription
          />
        </div>

        <div className="space-y-6 border-t pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* What Can Do Section */}
            <FormItem>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                  <FormLabel className="text-dark dark:text-gray-200">
                    What Can Do
                  </FormLabel>
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

              <div className="space-y-3 border rounded p-3 bg-white dark:bg-gray-900 h-[300px] overflow-y-auto">
                {whatCanDoItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No capability items added yet.
                  </p>
                ) : (
                  whatCanDoItems.map((item: string, index: number) => (
                    <div key={`what-can-do-${index}`} className="flex gap-2">
                      <Input
                        value={item || ""}
                        onChange={(e) =>
                          updateWhatCanDoItem(index, e.target.value)
                        }
                        placeholder="e.g., Generate SEO-friendly blog outlines"
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

            {/* Alternative Tools Section */}
            <FormField
              control={form.control}
              name="allternativeTools"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-dark dark:text-gray-200">
                    Alternative Tools
                  </FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 gap-3 border rounded p-3 bg-white dark:bg-gray-900 h-[300px] overflow-y-auto">
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
        </div>
      </div>

      {/* Sidebar: Cover Image */}
      <div className="w-full lg:w-[300px] space-y-6 mt-8 lg:mt-0">
        <FormField
          control={form.control}
          name="cover_image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Featured Image</FormLabel>
              <FormControl>
                <div
                  className={cn(
                    "relative flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-4 cursor-pointer transition",
                    isDragging
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-300 dark:border-gray-600",
                    "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10",
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (
                      e.dataTransfer.files &&
                      e.dataTransfer.files.length > 0
                    ) {
                      handleCoverImageUpload({
                        target: { files: e.dataTransfer.files },
                      } as React.ChangeEvent<HTMLInputElement>);
                      e.dataTransfer.clearData();
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleCoverImageUpload}
                    disabled={isSubmitting || isUploading}
                  />

                  {isUploading ? (
                    <p className="text-gray-500">Uploading...</p>
                  ) : coverImage ? (
                    <div className="relative h-40 w-40">
                      <img
                        src={coverImage}
                        alt="Preview"
                        className="h-full w-full object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (coverImage) {
                            try {
                              await deleteImage(coverImage);
                            } catch (err) {
                              console.error("Error deleting image:", err);
                            }
                          }
                          form.setValue("cover_image", "", {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                      <UploadCloud className="h-8 w-8 mb-2" />
                      <p className="text-sm text-center">
                        Drag & drop an image here <br /> or click to upload
                      </p>
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
                    "relative flex flex-col items-center justify-center w-48 border-2 border-dashed rounded-lg p-4 cursor-pointer transition",
                    isDraggingTabNormalIcon
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-300 dark:border-gray-600",
                    "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10",
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingTabNormalIcon(true);
                  }}
                  onDragLeave={() => setIsDraggingTabNormalIcon(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingTabNormalIcon(false);
                    if (
                      e.dataTransfer.files &&
                      e.dataTransfer.files.length > 0
                    ) {
                      handleTabNormalIconUpload({
                        target: { files: e.dataTransfer.files },
                      } as React.ChangeEvent<HTMLInputElement>);
                      e.dataTransfer.clearData();
                    }
                  }}
                  onClick={() => tabNormalIconFileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg"
                    className="hidden"
                    ref={tabNormalIconFileInputRef}
                    onChange={handleTabNormalIconUpload}
                    disabled={isSubmitting || isUploading}
                  />

                  {isUploading ? (
                    <p className="text-gray-500">Uploading...</p>
                  ) : tabNormalIconImage ? (
                    <div className="relative h-40 w-40">
                      <img
                        src={tabNormalIconImage}
                        alt="Tab Normal Icon Preview"
                        className="h-full w-full object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (tabNormalIconImage) {
                            try {
                              await deleteImage(tabNormalIconImage);
                            } catch (err) {
                              console.error("Error deleting image:", err);
                            }
                          }
                          form.setValue("tab_normal_icon_image", "", {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          if (tabNormalIconFileInputRef.current)
                            tabNormalIconFileInputRef.current.value = "";
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                      <UploadCloud className="h-8 w-8 mb-2" />
                      <p className="text-sm text-center">
                        Drag & drop tab normal icon here <br /> or click to
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
                    "relative flex flex-col items-center justify-center w-48 border-2 border-dashed rounded-lg p-4 cursor-pointer transition",
                    isDraggingTabActiveIcon
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-300 dark:border-gray-600",
                    "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10",
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingTabActiveIcon(true);
                  }}
                  onDragLeave={() => setIsDraggingTabActiveIcon(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingTabActiveIcon(false);
                    if (
                      e.dataTransfer.files &&
                      e.dataTransfer.files.length > 0
                    ) {
                      handleTabActiveIconUpload({
                        target: { files: e.dataTransfer.files },
                      } as React.ChangeEvent<HTMLInputElement>);
                      e.dataTransfer.clearData();
                    }
                  }}
                  onClick={() => tabActiveIconFileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg"
                    className="hidden"
                    ref={tabActiveIconFileInputRef}
                    onChange={handleTabActiveIconUpload}
                    disabled={isSubmitting || isUploading}
                  />

                  {isUploading ? (
                    <p className="text-gray-500">Uploading...</p>
                  ) : tabActiveIconImage ? (
                    <div className="relative h-40 w-40">
                      <img
                        src={tabActiveIconImage}
                        alt="Tab Active Icon Preview"
                        className="h-full w-full object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (tabActiveIconImage) {
                            try {
                              await deleteImage(tabActiveIconImage);
                            } catch (err) {
                              console.error("Error deleting image:", err);
                            }
                          }
                          form.setValue("tab_active_icon_image", "", {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          if (tabActiveIconFileInputRef.current)
                            tabActiveIconFileInputRef.current.value = "";
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                      <UploadCloud className="h-8 w-8 mb-2" />
                      <p className="text-sm text-center">
                        Drag & drop tab active icon here <br /> or click to
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

        <FormField
          control={form.control}
          name="tab_image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tab Image</FormLabel>
              <FormControl>
                <div
                  className={cn(
                    "relative flex flex-col items-center justify-center w-48 border-2 border-dashed rounded-lg p-4 cursor-pointer transition",
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
        <FormField
          control={form.control}
          name="categories"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">
                Home Tool Categories
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
                <div className="grid grid-cols-1 gap-3 border rounded p-3 bg-white dark:bg-gray-900 h-[350px] overflow-y-auto">
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
    </div>
  );
}
