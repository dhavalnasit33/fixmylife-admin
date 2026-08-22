"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { useToast } from "@/hooks/use-toast";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "@/config";
import { destinationToolSchema, DestinationToolFormValues } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GripVertical,
  Loader2,
  Plus,
  PlusCircle,
  Trash,
  UploadCloud,
  ChevronDown,
  ChevronUp, // Add this
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useWatch } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import YoastSeoForm from "../yoast-seo/YoastSeoForm";
import { cn, deleteImage, uploadFileToServer } from "@/lib/utils";
import apiService from "@/lib/apiService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableFieldItem } from "@/components/shared/SortableFieldItem";
import { TiptapEditorNoSSR } from "@/components/shared/TiptapEditor";

interface DestinationToolFormProps {
  initialData?: DestinationToolFormValues;
  onSubmit: (values: DestinationToolFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function DestinationToolForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: DestinationToolFormProps) {
  const form = useForm<DestinationToolFormValues>({
    resolver: zodResolver(destinationToolSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      short_description: "",
      prompt_template: "",
      fields: [],
      seo_keyphrase: "",
      seo_title: "",
      meta_description: "",
      cover_image: "",
      tool_cover_image: "", // ✅ Add this line
      max_tokens: 4000,
      system_prompt: "",
      tab_image: "",
      display_name: "",
      allternativeTools: [],
      whatCanDO: [],
    },
  });

  const {
    fields: fieldArray,
    append,
    remove,
    move, // ✅ ADD THIS for drag and drop
  } = useFieldArray({
    control: form.control,
    name: "fields",
  });

  const { control, setValue } = form;

  const {
    fields: suggestedTopicFields,
    append: appendSuggestedTopic,
    remove: removeSuggestedTopic,
  } = useFieldArray({
    control: form.control,
    name: "suggested_topics",
  });

  const { toast } = useToast();
  const coverImage = form.watch("cover_image");
  const toolCoverImage = form.watch("tool_cover_image"); // ✅ Add this line
  const tabNormalIconImage = form.watch("tab_normal_icon_image"); // ✅ Add this line
  const tabActiveIconImage = form.watch("tab_active_icon_image"); // ✅ Add this line
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toolCoverImageFileInputRef = useRef<HTMLInputElement | null>(null); // ✅ Add this line
  const tabNormalIconFileInputRef = useRef<HTMLInputElement | null>(null); // ✅ Add this line
  const tabActiveIconFileInputRef = useRef<HTMLInputElement | null>(null); // ✅ Add this line
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingToolCover, setIsDraggingToolCover] = useState(false); // ✅ Add this line
  const [isDraggingTabNormalIcon, setIsDraggingTabNormalIcon] = useState(false); // ✅ Add this line
  const [isDraggingTabActiveIcon, setIsDraggingTabActiveIcon] = useState(false); // ✅ Add this line
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [openFieldIndex, setOpenFieldIndex] = useState<number | null>(0); // Default first field open
  const [isDraggingField, setIsDraggingField] = useState(false); // Add this state
  const [tags, setTags] = useState<{ _id: string; name: string }[]>([]);
  const [alternativeTools, setAlternativeTools] = useState<
    { _id: string; name: string }[]
  >([]);

  // Function to toggle field open/close
  const toggleField = (index: number) => {
    setOpenFieldIndex(openFieldIndex === index ? null : index);
  };

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
      }
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ✅ ADD DRAG START HANDLER
  const handleDragStart = (event: any) => {
    // Close any open field when drag starts
    setOpenFieldIndex(null);
    setIsDraggingField(true);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiService<{ success: boolean; data: any[] }>(
          "/home-tool-categories"
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
          "/home-tool-tags"
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
          "/alternative-tools/all"
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
  // ✅ UPDATE DRAG END HANDLER
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = fieldArray.findIndex((field) => field.id === active.id);
      const newIndex = fieldArray.findIndex((field) => field.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        move(oldIndex, newIndex);
      }
    }
    setIsDraggingField(false);
  };

  // Handle field removal properly
  useEffect(() => {
    // If the open field was removed, open the first field or set to null if no fields left
    if (openFieldIndex !== null && openFieldIndex >= fieldArray.length) {
      if (fieldArray.length > 0) {
        setOpenFieldIndex(0); // Open first field
      } else {
        setOpenFieldIndex(null); // No fields left
      }
    }
  }, [fieldArray.length, openFieldIndex]);

  // ✅ ADD TOPIC IMAGE UPLOAD HANDLER
  const handleTopicImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
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
      const uploadedUrl = await uploadFileToServer(file, "destination-tools");
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

  // ✅ deeply watches fields array
  const watchedFields = useWatch({
    control: form.control,
    name: "fields",
  });

  useEffect(() => {
    if (!watchedFields) return;

    // Get current template
    const currentTemplate = form.getValues("prompt_template") || "";
    const lines = currentTemplate.split("\n");

    // Keep manual lines (lines without {{key}})
    const manualLines = lines.filter((line: any) => !/\{\{.*?\}\}/.test(line));

    // Generate field lines
    const fieldLines = watchedFields
      .map((f) => {
        const key = f?.key;
        const prompt = f?.prompt;
        if (!key || !prompt) return null;
        return `${prompt} = {{${key}}}`;
      })
      .filter(Boolean);

    // Combine manual lines and field lines
    const updatedTemplate = [...manualLines, ...fieldLines].join("\n");

    form.setValue("prompt_template", updatedTemplate, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [watchedFields]);

  // const handleFileUpload = async (
  //   index: number,
  //   e: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   setIsUploading(true);
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
  //       form.setValue(`fields.${index}.default_value` as any, data.secure_url, {
  //         shouldDirty: true,
  //         shouldValidate: true,
  //       });
  //       toast({ title: "File uploaded successfully." });
  //     } else {
  //       throw new Error(data.error?.message || "Upload failed");
  //     }
  //   } catch (err: any) {
  //     toast({
  //       title: "Upload failed",
  //       description: err.message,
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsUploading(false);
  //     if (fileInputRefs.current[index]) fileInputRefs.current[index].value = "";
  //   }
  // };

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

  // For dynamic fields
  const handleFileUpload = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadFileToServer(file, "destination-tools");
      form.setValue(`fields.${index}.default_value` as any, url, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast({ title: "File uploaded successfully." });
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRefs.current[index]) fileInputRefs.current[index].value = "";
    }
  };

  // For cover image
  const handleCoverImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadFileToServer(file, "destination-tools");
      form.setValue("cover_image", url, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast({ title: "Cover image uploaded" });
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ✅ Add this function for tool cover image upload
  const handleToolCoverImageUpload = async (
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
      const url = await uploadFileToServer(file, "destination-tools");

      form.setValue("tool_cover_image", url, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast({ title: "Tool cover image uploaded" });
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (toolCoverImageFileInputRef.current)
        toolCoverImageFileInputRef.current.value = "";
    }
  };

  // ✅ Add this function for tab normal icon image upload
  const handleTabNormalIconUpload = async (
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
      const url = await uploadFileToServer(file, "destination-tools");

      form.setValue("tab_normal_icon_image", url, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast({ title: "Tab normal icon uploaded" });
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message,
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
      const url = await uploadFileToServer(file, "destination-tools");

      form.setValue("tab_active_icon_image", url, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast({ title: "Tab active icon uploaded" });
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (tabActiveIconFileInputRef.current)
        tabActiveIconFileInputRef.current.value = "";
    }
  };

  const handleTabIconUpload = async (
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
      const url = await uploadFileToServer(file, "destination-tools");

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
      if (tabActiveIconFileInputRef.current)
        tabActiveIconFileInputRef.current.value = "";
    }
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">
                Destination Title
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter destination title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
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
                  placeholder="e.g., Blog Post Generator"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
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
              <FormLabel className="text-dark dark:text-gray-200">
                Short Description
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Beautiful beach city with vibrant nightlife"
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
                Destination Description
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

        {/* Prompt Template (auto-generated) */}
        <FormField
          control={form.control}
          name="prompt_template"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">
                Prompt Template
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  className="w-full border rounded p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 cursor-not-allowed"
                  placeholder="Auto-generated prompt template"
                  readOnly
                  rows={10}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dynamic Fields */}
        <div className="space-y-2 border p-2 rounded">
          <h4 className="font-semibold my-2 mx-4">Fields</h4>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fieldArray.map((field: any) => field.id)}
              strategy={verticalListSortingStrategy}
            >
              {fieldArray.map((fieldItem, index) => {
                const currentType =
                  watchedFields[index]?.type?.toLowerCase() || "";
                const isFieldOpen = openFieldIndex === index;
                return (
                  <SortableFieldItem key={fieldItem.id} id={fieldItem.id}>
                    {({ attributes, listeners, isDragging }) => (
                      <div
                        key={fieldItem.id}
                        className={`border p-4 rounded !my-12 mx-4 ${isFieldOpen ? " " : " bg-secondary "
                          }  border-sidebar-primary`}
                      >
                        {/* Header */}
                        <div
                          className={`flex justify-between ${isFieldOpen ? " mb-2" : " "
                            } items-center`}
                        >
                          <div className="flex items-center gap-2">
                            {/* Drag Handle */}
                            <div
                              {...attributes}
                              {...listeners}
                              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                            >
                              <GripVertical className="h-6 w-6" />
                            </div>
                            <span className="font-medium">
                              {fieldItem.label || `Field ${index + 1}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Delete button - only show when field is open */}
                            {isFieldOpen && (
                              <Button
                                type="button"
                                onClick={() => remove(index)}
                                size="icon"
                                className="h-8 w-8 rounded-full border border-red-500 text-red-500 bg-white
                                 hover:bg-red-500 hover:text-white"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Toggle button */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleField(index)}
                              className="h-8 w-8"
                            >
                              {isFieldOpen ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        {isFieldOpen && (
                          <div className="grid grid-cols-2 gap-4">
                            {/* Label (auto generates hidden key) */}
                            <FormField
                              control={control}
                              name={`fields.${index}.label`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-dark dark:text-gray-200">
                                    Label
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Enter field label"
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        field.onChange(val);

                                        const slug = val
                                          .toLowerCase()
                                          .replace(/\s+/g, "_")
                                          .replace(/[^a-z0-9_]/g, "");
                                        setValue(`fields.${index}.key`, slug, {
                                          shouldDirty: true,
                                        });
                                      }}
                                    />
                                  </FormControl>
                                  {/* 👇 show generated key under the input */}
                                  {watchedFields?.[index]?.key && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Key:{" "}
                                      <span className="font-mono">
                                        {watchedFields[index].key}
                                      </span>
                                    </p>
                                  )}

                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Prompt for this Field */}
                            <FormField
                              control={form.control}
                              name={`fields.${index}.prompt` as const}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-dark dark:text-gray-200">
                                    Prompt
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="e.g. Generate recipes, with this..."
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Description */}
                            <FormField
                              control={form.control}
                              name={`fields.${index}.description` as const}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-dark dark:text-gray-200">
                                    Description
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Field description"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Type Select */}
                            <FormField
                              control={form.control}
                              name={`fields.${index}.type` as const}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-dark dark:text-gray-200">
                                    Type
                                  </FormLabel>
                                  <FormControl>
                                    <Select
                                      value={field.value}
                                      onValueChange={field.onChange}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="textbox">
                                          Textbox
                                        </SelectItem>
                                        <SelectItem value="textarea">
                                          Textarea
                                        </SelectItem>
                                        <SelectItem value="dropdown">
                                          Dropdown
                                        </SelectItem>
                                        <SelectItem value="radio">
                                          Radio
                                        </SelectItem>
                                        <SelectItem value="checkbox">
                                          Checkbox
                                        </SelectItem>
                                        <SelectItem value="imageupload">
                                          Image Upload
                                        </SelectItem>
                                        <SelectItem value="fileupload">
                                          File Upload
                                        </SelectItem>
                                        <SelectItem value="number">
                                          Number
                                        </SelectItem>
                                        <SelectItem value="date">
                                          Date
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Placeholder */}
                            {["textbox", "textarea", "number", "date"].includes(
                              currentType
                            ) && (
                                <FormField
                                  control={form.control}
                                  name={`fields.${index}.placeholder` as const}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-dark dark:text-gray-200">
                                        Placeholder
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          placeholder="Placeholder text"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}

                            {/* Options */}
                            {["dropdown", "radio", "checkbox"].includes(
                              currentType
                            ) && (
                                <FormField
                                  control={form.control}
                                  name={`fields.${index}.options` as const}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-dark dark:text-gray-200">
                                        Options (comma separated)
                                      </FormLabel>
                                      {/* <FormControl>
                            <Input
                              value={
                                Array.isArray(field.value)
                                  ? field.value.join(", ")
                                  : ""
                              }
                              placeholder="Option1, Option2"
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value.split(",").map((o) => o.trim())
                                )
                              }
                            />
                          </FormControl> */}
                                      <FormControl>
                                        <Input
                                          defaultValue={
                                            Array.isArray(field.value)
                                              ? field.value.join(", ")
                                              : ""
                                          }
                                          placeholder="Option1, Option2"
                                          onChange={(e) => {
                                            // Just update raw text in form, don't split yet
                                            const inputValue = e.target.value;
                                            // Keep it as string for now
                                            field.onChange(inputValue);
                                          }}
                                          onBlur={(e) => {
                                            const raw = e.target.value;
                                            const options = raw
                                              .split(",")
                                              .map((opt) => opt.trim())
                                              .filter((opt) => opt);
                                            // Save parsed array back to form
                                            form.setValue(
                                              `fields.${index}.options`,
                                              options,
                                              {
                                                shouldDirty: true,
                                              }
                                            );
                                          }}
                                        />
                                      </FormControl>
                                      <div className="text-sm text-muted-foreground mt-1">
                                        {Array.isArray(field.value) &&
                                          field.value.length > 0 ? (
                                          <div>
                                            <span className="font-medium">
                                              {field.value.length} options:
                                            </span>
                                            <div className="mt-1 flex flex-wrap gap-1">
                                              {field.value.map(
                                                (option, optIndex) => (
                                                  <span
                                                    key={optIndex}
                                                    className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs"
                                                  >
                                                    {option}
                                                  </span>
                                                )
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          "Type options separated by commas, e.g. Email Input, Food Blog, Country"
                                        )}
                                      </div>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}

                            {/* Required */}
                            <FormField
                              control={form.control}
                              name={`fields.${index}.required` as const}
                              render={({ field }) => (
                                <FormItem className="flex items-center !h-[60px] mt-3 justify-between border p-3 rounded">
                                  <FormLabel className="text-dark dark:text-gray-200">
                                    Required?
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

                            {/* Upload for file/image types */}
                            {["imageupload", "fileupload"].includes(
                              currentType
                            ) &&
                              (() => {
                                const uploadedFile = form.watch(
                                  `fields.${index}.default_value`
                                );
                                return (
                                  <FormItem key={index}>
                                    <FormLabel className="text-dark dark:text-gray-200">
                                      Upload File
                                    </FormLabel>
                                    <div className="flex items-center gap-4">
                                      <Input
                                        id={`fileInput-${index}`}
                                        type="file"
                                        className="hidden"
                                        ref={(el) =>
                                          void (fileInputRefs.current[index] =
                                            el)
                                        }
                                        onChange={(e) =>
                                          handleFileUpload(index, e)
                                        }
                                        disabled={isUploading}
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                          fileInputRefs.current[index]?.click()
                                        }
                                        disabled={isUploading}
                                      >
                                        {isUploading ? (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                          <UploadCloud className="mr-2 h-4 w-4" />
                                        )}
                                        Upload File
                                      </Button>

                                      {uploadedFile &&
                                        (["imageupload"].includes(
                                          currentType
                                        ) ? (
                                          <img
                                            src={uploadedFile}
                                            alt="Preview"
                                            className="h-12 w-12 rounded-md border object-cover"
                                          />
                                        ) : (
                                          <a
                                            href={uploadedFile}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-blue-500 underline"
                                          >
                                            View uploaded file
                                          </a>
                                        ))}
                                    </div>
                                  </FormItem>
                                );
                              })()}
                          </div>
                        )}
                      </div>
                    )}
                  </SortableFieldItem>
                );
              })}
            </SortableContext>
          </DndContext>

          {/* Add Field Button */}
          <Button
            type="button"
            onClick={() => {
              const newIndex = fieldArray.length;
              append({
                key: "", // hidden internal key
                label: "",
                prompt: "",
                description: "",
                type: "textbox",
                required: true,
                placeholder: "",
                options: [],
                default_value: "",
              });
              setOpenFieldIndex(newIndex);
            }}
            size="sm"
            className="
                       hover:bg-green-700 hover:text-white bg-white m-4 !mb-2 text-black border"
          >
            <PlusCircle className="mr-2 h-5 w-5" /> Add Field
          </Button>
        </div>

        {/* suggsted topic  */}
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
                      <Trash className="h-4 w-4 text-destructive/70 hover:text-destructive" />
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
                            placeholder="e.g., Plan a budget trip to..."
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
                        event: React.DragEvent<HTMLDivElement>
                      ) => {
                        event.preventDefault();
                        setIsDragging(false);

                        const file = event.dataTransfer.files?.[0];
                        if (!file) return;

                        const fakeEvent = {
                          target: { files: [file] },
                        } as unknown as React.ChangeEvent<HTMLInputElement>;

                        await handleTopicImageUpload(fakeEvent, index);
                      };

                      const handleDragOver = (
                        event: React.DragEvent<HTMLDivElement>
                      ) => {
                        event.preventDefault();
                        setIsDragging(true);
                      };

                      const handleDragLeave = (
                        event: React.DragEvent<HTMLDivElement>
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
                                "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
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
                                            err
                                          );
                                        }
                                      }
                                      form.setValue(
                                        `suggested_topics.${index}.image`,
                                        "",
                                        {
                                          shouldDirty: true,
                                          shouldValidate: true,
                                        }
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
        <div className="pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4">Yoast SEO Settings</h3>
          <YoastSeoForm
            isSubmitting={isSubmitting}
            hideCoverImage
            hidePageDescription
          />
        </div>
        <div className="grid gap-4 grid-cols-1 justify-center justify-items-center md:grid-cols-2">
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
                        <div className="relative w-full">
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
                                } catch {
                                  return;
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
          </div>
          {/* ✅ Add Tool Cover Image Field */}
          <div className="w-full lg:w-[300px] space-y-6 mt-8 lg:mt-0">
            <FormField
              control={form.control}
              name="tool_cover_image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tool Cover Image</FormLabel>
                  <FormControl>
                    <div
                      className={cn(
                        "relative flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-4 cursor-pointer transition",
                        isDraggingToolCover
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-300 dark:border-gray-600",
                        "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                      )}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingToolCover(true);
                      }}
                      onDragLeave={() => setIsDraggingToolCover(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingToolCover(false);
                        if (
                          e.dataTransfer.files &&
                          e.dataTransfer.files.length > 0
                        ) {
                          handleToolCoverImageUpload({
                            target: { files: e.dataTransfer.files },
                          } as React.ChangeEvent<HTMLInputElement>);
                          e.dataTransfer.clearData();
                        }
                      }}
                      onClick={() =>
                        toolCoverImageFileInputRef.current?.click()
                      }
                    >
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg"
                        className="hidden"
                        ref={toolCoverImageFileInputRef}
                        onChange={handleToolCoverImageUpload}
                        disabled={isSubmitting || isUploading}
                      />

                      {isUploading ? (
                        <p className="text-gray-500">Uploading...</p>
                      ) : toolCoverImage ? (
                        <div className="relative w-full">
                          <img
                            src={toolCoverImage}
                            alt="Tool Cover Preview"
                            className="h-full w-full object-cover rounded-md border"
                          />
                          <button
                            type="button"
                            className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (toolCoverImage) {
                                try {
                                  await deleteImage(toolCoverImage);
                                } catch (err) {
                                  console.error("Failed to delete image:", err);
                                }
                              }
                              form.setValue("tool_cover_image", "", {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                              if (toolCoverImageFileInputRef.current)
                                toolCoverImageFileInputRef.current.value = "";
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                          <UploadCloud className="h-8 w-8 mb-2" />
                          <p className="text-sm text-center">
                            Drag & drop a tool cover image here <br /> or click
                            to upload
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
          <div className="w-full lg:w-[300px] space-y-6 mt-8 lg:mt-0">
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
                        "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
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
                        <div className="relative w-full">
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
                                  console.error("Failed to delete image:", err);
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
          </div>

          {/* ✅ Add Tab Active Icon Image Field */}
          <div className="w-full lg:w-[300px] space-y-6 mt-8 lg:mt-0">
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
                        "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
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
                        <div className="relative w-full">
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
                                  console.error("Failed to delete image:", err);
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
          </div>

          <div className="w-full lg:w-[300px] space-y-6 mt-8 lg:mt-0">
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
                        isDraggingTabActiveIcon
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-300 dark:border-gray-600",
                        "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
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
                          handleTabIconUpload({
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
                        onChange={handleTabIconUpload}
                        disabled={isSubmitting || isUploading}
                      />

                      {isUploading ? (
                        <p className="text-gray-500">Uploading...</p>
                      ) : field.value ? (
                        <div className="relative w-full">
                          <img
                            src={field.value}
                            alt="Tab Active Icon Preview"
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
                                  console.error("Failed to delete image:", err);
                                }
                              }
                              form.setValue("tab_image", "", {
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
          </div>
        </div>
        <div className="w-full space-y-6 mt-8 lg:mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2    gap-4 items-start">
            <FormField
              control={form.control}
              name="categories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-dark dark:text-gray-200">
                    Home Tool Categories
                  </FormLabel>

                  <FormControl>
                    <div className="grid grid-cols-2 gap-3 border rounded p-3 bg-white dark:bg-gray-900 h-[350px] overflow-y-auto">
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

        <div className="space-y-6 border-t pt-6">
          <div className="grid grid-cols-1   gap-6">
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
                  whatCanDoItems.map((item, index) => (
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
