"use client";

import { useEffect, useRef, useState } from "react";
import { UseFormReturn, useFieldArray, useWatch } from "react-hook-form";
import {
  UploadCloud,
  Loader2,
  PlusCircle,
  Trash2,
  Trash,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn, deleteImage, uploadFileToServer } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import YoastSeoForm from "@/components/dashboard/yoast-seo/YoastSeoForm";
import { DynamicFormValues } from "@/types";
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
import apiService from "@/lib/apiService";

interface DynamicFormProps {
  form: UseFormReturn<DynamicFormValues>;
  isSubmitting: boolean;
  showExtraFields?: boolean;
}

export default function DynamicForm({
  form,
  isSubmitting,
  showExtraFields = true,
}: DynamicFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const tabNormalIconFileInputRef = useRef<HTMLInputElement | null>(null); // ✅ Add this line
  const tabActiveIconFileInputRef = useRef<HTMLInputElement | null>(null); // ✅ Add this line

  const toolCoverImageFileInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const tabIconInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadings, setIsUploadings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [openFieldIndex, setOpenFieldIndex] = useState<number | null>(null);
  const [alternativeTools, setAlternativeTools] = useState<
    { _id: string; name: string }[]
  >([]);
  const [isDraggingField, setIsDraggingField] = useState(false); // Add this state
  const [isDraggingToolCover, setIsDraggingToolCover] = useState(false);
  const [isDraggingTabNormalIcon, setIsDraggingTabNormalIcon] = useState(false); // ✅ Add this line
  const [isDraggingTabActiveIcon, setIsDraggingTabActiveIcon] = useState(false); // ✅ Add this line
  const [isDraggingTabImage, setIsDraggingTabImage] = useState(false);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    [],
  );
  const [tags, setTags] = useState<{ _id: string; name: string }[]>([]);

  // Function to toggle field open/close
  const toggleField = (index: number) => {
    setOpenFieldIndex(openFieldIndex === index ? null : index);
  };

  const {
    fields: fieldArray,
    append,
    remove,
    move, // ✅ ADD THIS for drag and drop
  } = useFieldArray({
    control: form.control,
    name: "fields",
  });

  // ✅ ADD DnD SENSORS
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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

    fetchCategories();
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

    fetchAlternativeTools();
    fetchTags();
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

  const watchedFields = useWatch({ control: form.control, name: "fields" });
  const coverImage = form.watch("cover_image");
  const toolCoverImage = form.watch("tool_cover_image");
  const tabNormalIconImage = form.watch("tab_normal_icon_image"); // ✅ Add this line
  const tabActiveIconImage = form.watch("tab_active_icon_image"); // ✅ Add this line
  const tabIconImage = form.watch("tab_image");
  // Auto-generate prompt template based on fields
  useEffect(() => {
    if (!watchedFields) return;
    const currentTemplate = form.getValues("prompt_template") || "";
    const lines = currentTemplate
      .split("\n")
      .filter((line) => !/\{\{.*?\}\}/.test(line));
    const fieldLines = watchedFields
      .map((f) => (f?.key && f?.prompt ? `${f.prompt} = {{${f.key}}}` : null))
      .filter(Boolean);
    form.setValue("prompt_template", [...lines, ...fieldLines].join("\n"), {
      shouldDirty: true,
    });
  }, [watchedFields]);

  // Upload helpers
  const handleFileUpload = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadings(true);
    try {
      const url = await uploadFileToServer(file, "common");
      form.setValue(`fields.${index}.default_value` as any, url, {
        shouldDirty: true,
      });
      toast({ title: "File uploaded successfully." });
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsUploadings(false);
      if (fileInputRefs.current[index]) fileInputRefs.current[index].value = "";
    }
  };

  const handleCoverImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadFileToServer(file, "common");
      form.setValue("cover_image", url, { shouldDirty: true });
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
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadFileToServer(file, "common");
      form.setValue("tool_cover_image", url, { shouldDirty: true });
      toast({ title: "Tool cover image uploaded" });
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (toolCoverImageFileInputRef.current)
        toolCoverImageFileInputRef.current.value = "";
    }
  };

  const handleTabNormalIconUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadFileToServer(file, "common");
      form.setValue("tab_normal_icon_image", url, { shouldDirty: true });
      toast({ title: "Tab normal icon uploaded" });
    } catch (err: any) {
      toast({
        title: "Upload failed",
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
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadFileToServer(file, "common");
      form.setValue("tab_active_icon_image", url, { shouldDirty: true });
      toast({ title: "Tab active icon uploaded" });
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message,
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
      {/* Main Form */}
      <div className="flex-1 space-y-8">
        {/* Prompt Template */}
        <FormField
          control={form.control}
          name="prompt_template"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prompt Template</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  readOnly
                  rows={8}
                  placeholder="Auto-generated prompt template"
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
              items={fieldArray.map((field) => field.id)}
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
                        className={`border p-4 rounded !my-12 mx-4 ${
                          isFieldOpen ? " " : " bg-secondary "
                        }  border-sidebar-primary`}
                      >
                        <div
                          className={`flex justify-between ${
                            isFieldOpen ? " mb-2" : " "
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
                            {/* Label */}
                            <FormField
                              control={form.control}
                              name={`fields.${index}.label`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Label</FormLabel>
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
                                        form.setValue(
                                          `fields.${index}.key`,
                                          slug,
                                          {
                                            shouldDirty: true,
                                          },
                                        );
                                      }}
                                    />
                                  </FormControl>
                                  {watchedFields[index]?.key && (
                                    <p className="text-sm text-muted-foreground">
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

                            {/* Prompt */}
                            <FormField
                              control={form.control}
                              name={`fields.${index}.prompt`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Prompt</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="e.g., Generate recipes..."
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Description */}
                            <FormField
                              control={form.control}
                              name={`fields.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
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

                            {/* Type */}
                            <FormField
                              control={form.control}
                              name={`fields.${index}.type`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Type</FormLabel>
                                  <FormControl>
                                    <Select
                                      value={field.value}
                                      onValueChange={field.onChange}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {[
                                          "textbox",
                                          "textarea",
                                          "dropdown",
                                          "radio",
                                          "checkbox",
                                          "imageupload",
                                          "fileupload",
                                          "number",
                                          "date",
                                        ].map((t) => (
                                          <SelectItem key={t} value={t}>
                                            {t.charAt(0).toUpperCase() +
                                              t.slice(1)}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Placeholder */}
                            {["textbox", "textarea", "number", "date"].includes(
                              currentType,
                            ) && (
                              <FormField
                                control={form.control}
                                name={`fields.${index}.placeholder`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Placeholder</FormLabel>
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
                              currentType,
                            ) && (
                              <FormField
                                control={form.control}
                                name={`fields.${index}.options`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      Options (comma separated)
                                    </FormLabel>
                                    {/* <FormControl>
                            <Input
                              value={
                                Array.isArray(field.value)
                                  ? field.value.join(", ")
                                  : ""
                              }
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value.split(",").map((o) => o.trim())
                                )
                              }
                              placeholder="Option1, Option2"
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
                                            },
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
                                              ),
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
                              name={`fields.${index}.required`}
                              render={({ field }) => (
                                <FormItem className="flex items-center !h-[60px] mt-3  justify-between border p-2 rounded">
                                  <FormLabel>Required?</FormLabel>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            {/* File/Image Upload */}
                            {["imageupload", "fileupload"].includes(
                              currentType,
                            ) && (
                              <FormItem>
                                <FormLabel>Upload File</FormLabel>
                                <div className="flex items-center gap-4">
                                  <Input
                                    type="file"
                                    className="hidden"
                                    ref={(el) => {
                                      fileInputRefs.current[index] = el;
                                    }}
                                    onChange={(e) => handleFileUpload(index, e)}
                                    disabled={isUploadings}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                      fileInputRefs.current[index]?.click()
                                    }
                                    disabled={isUploadings}
                                  >
                                    {isUploadings ? (
                                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                    ) : (
                                      <UploadCloud className="mr-2 h-4 w-4" />
                                    )}
                                    Upload
                                  </Button>
                                  {form.watch(
                                    `fields.${index}.default_value`,
                                  ) && (
                                    <span className="text-sm text-muted-foreground">
                                      Uploaded
                                    </span>
                                  )}
                                </div>
                              </FormItem>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </SortableFieldItem>
                );
              })}
            </SortableContext>
          </DndContext>

          <Button
            type="button"
            onClick={() => {
              const newIndex = fieldArray.length;
              append({
                key: "",
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
            className="border hover:bg-green-700  m-4 !mb-2  hover:text-white"
          >
            <PlusCircle className="mr-2 h-5 w-5" /> Add Field
          </Button>
        </div>

        {/* Suggested Topics */}
        <Card>
          <CardHeader>
            <CardTitle>Suggested Topics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestedTopicFields.map((item, index) => (
              <Card key={item.id} className="p-4 bg-muted/30 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Topic {index + 1}</p>
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

                {/* Title */}
                <FormField
                  control={form.control}
                  name={`suggested_topics.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Write a newsletter about..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Has Input */}
                <FormField
                  control={form.control}
                  name={`suggested_topics.${index}.has_input`}
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Has Input?</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Sticky */}
                <FormField
                  control={form.control}
                  name={`suggested_topics.${index}.sticky`}
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Sticky?</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Image Upload */}
                <FormField
                  control={form.control}
                  name={`suggested_topics.${index}.image`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic Image</FormLabel>
                      <FormControl>
                        <div
                          className={cn(
                            "relative flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-4 cursor-pointer transition",
                            isDragging
                              ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
                              : "border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10",
                          )}
                          onClick={() =>
                            document
                              .getElementById(`topic-image-${index}`)
                              ?.click()
                          }
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                          }}
                          onDrop={async (e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            const file = e.dataTransfer.files?.[0];
                            if (file) {
                              const allowedTypes = [
                                "image/png",
                                "image/jpeg",
                                "image/jpg",
                                "image/svg+xml",
                              ];
                              if (!allowedTypes.includes(file.type)) {
                                toast({
                                  title: "Invalid file type",
                                  description:
                                    "Only PNG, JPG, and SVG images are allowed.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              try {
                                const uploadedUrl = await uploadFileToServer(
                                  file,
                                  "common",
                                );
                                form.setValue(
                                  `suggested_topics.${index}.image`,
                                  uploadedUrl,
                                  {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  },
                                );
                                toast({ title: "Topic image uploaded" });
                              } catch (error: any) {
                                toast({
                                  title: "Upload Failed",
                                  description:
                                    error.message || "Something went wrong",
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                        >
                          <input
                            id={`topic-image-${index}`}
                            type="file"
                            accept=".png,.jpg,.jpeg,.svg"
                            className="hidden"
                            onChange={(e) => handleTopicImageUpload(e, index)}
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
                  )}
                />
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendSuggestedTopic({
                  title: "",
                  has_input: true,
                  sticky: false,
                  image: "",
                })
              }
              disabled={isSubmitting}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Topic
            </Button>
          </CardContent>
        </Card>

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
                    <Input placeholder="e.g., A quick 1-sentence summary" {...field} value={field.value || ""} />
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

        {/* System Prompts */}
        <FormField
          control={form.control}
          name="system_prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>System Prompt</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={4}
                  placeholder="Enter system prompt"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="improvement_system_prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Improvement System Prompt</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={4}
                  placeholder="Enter improvement system prompt"
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Max Tokens */}
          <FormField
            control={form.control}
            name="display_name"
            render={({ field }) => (
              <FormItem className="mb-4">
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
            name="max_tokens"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Tokens</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  value={field.value?.toString() || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    field.onChange(val === "" ? "" : Number(val));
                  }}
                  placeholder="Enter max tokens"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 👇 ADD STICKY TOGGLE HERE 👇 */}
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
        {/* 👆 END STICKY TOGGLE 👆 */}

        {/* SEO */}
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

      {/* Sidebar for Cover Image */}
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
                    "relative flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-4 cursor-pointer",
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 dark:border-gray-600",
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files.length)
                      handleCoverImageUpload({
                        target: { files: e.dataTransfer.files },
                      } as any);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleCoverImageUpload}
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <p>Uploading...</p>
                  ) : coverImage ? (
                    <div className="relative w-full">
                      <img
                        src={coverImage}
                        alt="Preview"
                        className="h-full w-full object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border hover:bg-red-500 hover:text-white text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          form.setValue("cover_image", "");
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-500">
                      <UploadCloud className="h-8 w-8 mb-2" />
                      <p className="text-sm text-center">
                        Drag & drop an image here or click to upload
                      </p>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* ✅ Add Tool Cover Image Field */}
        <FormField
          control={form.control}
          name="tool_cover_image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tool Cover Image</FormLabel>
              <FormControl>
                <div
                  className={cn(
                    "relative flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-4 cursor-pointer",
                    isDraggingToolCover
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 dark:border-gray-600",
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingToolCover(true);
                  }}
                  onDragLeave={() => setIsDraggingToolCover(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingToolCover(false);
                    if (e.dataTransfer.files.length)
                      handleToolCoverImageUpload({
                        target: { files: e.dataTransfer.files },
                      } as any);
                  }}
                  onClick={() => toolCoverImageFileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg"
                    className="hidden"
                    ref={toolCoverImageFileInputRef}
                    onChange={handleToolCoverImageUpload}
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <p>Uploading...</p>
                  ) : toolCoverImage ? (
                    <div className="relative w-full">
                      <img
                        src={toolCoverImage}
                        alt="Tool Cover Preview"
                        className="h-full w-full object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border hover:bg-red-500 hover:text-white text-sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (toolCoverImage) {
                            try {
                              await deleteImage(toolCoverImage);
                            } catch (err) {
                              console.error("Error deleting image:", err);
                            }
                          }
                          form.setValue("tool_cover_image", "", {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-500">
                      <UploadCloud className="h-8 w-8 mb-2" />
                      <p className="text-sm text-center">
                        Drag & drop a tool cover image here or click to upload
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
                    "relative flex flex-col items-center justify-center w-48 border-2 border-dashed rounded-lg p-4 cursor-pointer",
                    isDraggingTabNormalIcon
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 dark:border-gray-600",
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingTabNormalIcon(true);
                  }}
                  onDragLeave={() => setIsDraggingTabNormalIcon(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingTabNormalIcon(false);
                    if (e.dataTransfer.files.length)
                      handleTabNormalIconUpload({
                        target: { files: e.dataTransfer.files },
                      } as any);
                  }}
                  onClick={() => tabNormalIconFileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg"
                    className="hidden"
                    ref={tabNormalIconFileInputRef}
                    onChange={handleTabNormalIconUpload}
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <p>Uploading...</p>
                  ) : tabNormalIconImage ? (
                    <div className="relative w-full">
                      <img
                        src={tabNormalIconImage}
                        alt="Tab Normal Icon Preview"
                        className="h-full w-full object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border hover:bg-red-500 hover:text-white text-sm"
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
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-500">
                      <UploadCloud className="h-8 w-8 mb-2" />
                      <p className="text-sm text-center">
                        Drag & drop tab normal icon here or click to upload
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
                    "relative flex flex-col items-center justify-center w-48 border-2 border-dashed rounded-lg p-4 cursor-pointer",
                    isDraggingTabActiveIcon
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 dark:border-gray-600",
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingTabActiveIcon(true);
                  }}
                  onDragLeave={() => setIsDraggingTabActiveIcon(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingTabActiveIcon(false);
                    if (e.dataTransfer.files.length)
                      handleTabActiveIconUpload({
                        target: { files: e.dataTransfer.files },
                      } as any);
                  }}
                  onClick={() => tabActiveIconFileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg"
                    className="hidden"
                    ref={tabActiveIconFileInputRef}
                    onChange={handleTabActiveIconUpload}
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <p>Uploading...</p>
                  ) : tabActiveIconImage ? (
                    <div className="relative w-full">
                      <img
                        src={tabActiveIconImage}
                        alt="Tab Active Icon Preview"
                        className="h-full w-full object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border hover:bg-red-500 hover:text-white text-sm"
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
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-500">
                      <UploadCloud className="h-8 w-8 mb-2" />
                      <p className="text-sm text-center">
                        Drag & drop tab active icon here or click to upload
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
