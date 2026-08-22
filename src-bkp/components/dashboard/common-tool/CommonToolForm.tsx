"use client";

import { useEffect, useRef, useState } from "react";
import { useFieldArray, useWatch, UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import YoastSeoForm from "@/components/dashboard/yoast-seo/YoastSeoForm";

import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "@/config";
import { useToast } from "@/hooks/use-toast";
import {
  GripVertical,
  Loader2,
  PlusCircle,
  Trash,
  UploadCloud,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Select } from "@radix-ui/react-select";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CommonToolFormValues } from "@/types";
import { cn, deleteImage, uploadFileToServer } from "@/lib/utils";
import apiService from "@/lib/apiService";
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

interface CommonToolFormProps {
  form: UseFormReturn<CommonToolFormValues>;
  isSubmitting: boolean;
  onCancel?: () => void;
  showExtraFields?: boolean;
}

export default function CommonToolForm({
  form,
  isSubmitting,
  showExtraFields,
}: CommonToolFormProps) {
  const {
    fields: fieldArray,
    append,
    remove,
    move,
  } = useFieldArray({
    control: form.control,
    name: "fields",
  });

  const { control, setValue } = form;

  const { toast } = useToast();
  const coverImage = form.watch("cover_image");
  const toolCoverImage = form.watch("tool_cover_image");
  const tabNormalIconImage = form.watch("tab_normal_icon_image"); // ✅ Add this line
  const tabActiveIconImage = form.watch("tab_active_icon_image"); // ✅ Add this line
  const tabIconImage = form.watch("tab_image");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toolCoverImageFileInputRef = useRef<HTMLInputElement | null>(null); // ✅ Add this line
  const tabNormalIconFileInputRef = useRef<HTMLInputElement | null>(null); // ✅ Add this line
  const tabActiveIconFileInputRef = useRef<HTMLInputElement | null>(null); // ✅ Add this line
  const tabIconInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadings, setIsUploadings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingToolCover, setIsDraggingToolCover] = useState(false); // ✅ Add this line
  const [isDraggingTabNormalIcon, setIsDraggingTabNormalIcon] = useState(false); // ✅ Add this line
  const [isDraggingTabActiveIcon, setIsDraggingTabActiveIcon] = useState(false); // ✅ Add this line
  const [isDraggingTabImage, setIsDraggingTabImage] = useState(false);
  const [openFieldIndex, setOpenFieldIndex] = useState<number | null>(0); // Default first field open
  const [isDraggingField, setIsDraggingField] = useState(false); // Add this state
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    [],
  );
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
      whatCanDoItems.filter((_, itemIndex) => itemIndex !== index),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

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

  // For dynamic fields
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
      setIsUploadings(false);
      if (fileInputRefs.current[index]) fileInputRefs.current[index].value = "";
    }
  };

  // For cover image
  const handleCoverImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadFileToServer(file, "common");
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
              <FormDescription>
                This is the user-facing name shown in the UI.
              </FormDescription>
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
          control={control}
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

        {/* Dynamic Fields */}
        <div className="space-y-2 border p-2  rounded">
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
                        className={`border p-4 rounded !my-12 mx-4 ${isFieldOpen ? " " : " bg-gray-100   "
                          }  border-sidebar-primary`}
                        key={fieldItem.id}
                      >
                        {/* Header */}
                        <div
                          className={`flex justify-between ${isFieldOpen ? " mb-2" : " "
                            } items-center`}
                        >
                          <div className="flex items-center gap-2">
                            {/* Drag handle moved here */}
                            <div
                              {...listeners}
                              {...attributes}
                              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                            >
                              <GripVertical
                                className={`h-6 ${isFieldOpen ? " " : "  "
                                  }  w-6`}
                              />
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
                              currentType,
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
                              currentType,
                            ) && (
                                <FormField
                                  control={form.control}
                                  name={`fields.${index}.options` as const}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-dark dark:text-gray-200">
                                        Options (comma separated)
                                      </FormLabel>
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
                              name={`fields.${index}.required` as const}
                              render={({ field }) => (
                                <FormItem className="flex items-center !h-[60px] justify-between border p-3 mt-3 rounded">
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
                              currentType,
                            ) &&
                              (() => {
                                const uploadedFile = form.watch(
                                  `fields.${index}.default_value`,
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
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                          <UploadCloud className="mr-2 h-4 w-4" />
                                        )}
                                        Upload File
                                      </Button>

                                      {uploadedFile &&
                                        (["imageupload"].includes(
                                          currentType,
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
              // Auto-open the newly added field
              setOpenFieldIndex(newIndex);
            }}
            size="sm"
            className="
                       hover:bg-green-700 hover:text-white bg-white m-4 !mb-2 text-black border"
          >
            <PlusCircle className="mr-2 h-5 w-5" /> Add Field
          </Button>
        </div>

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

        <FormItem>
          <div className="flex items-center justify-between gap-3">
            <div>
              <FormLabel className="text-dark dark:text-gray-200">
                What Can Do
              </FormLabel>
              <FormDescription>
                Add short capability points that will be saved as a string array.
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

          <div className="space-y-3 border rounded p-3 bg-white dark:bg-gray-900">
            {whatCanDoItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No capability items added yet.
              </p>
            ) : (
              whatCanDoItems.map((item, index) => (
                <div key={`what-can-do-${index}`} className="flex gap-2">
                  <Input
                    value={item || ""}
                    onChange={(e) => updateWhatCanDoItem(index, e.target.value)}
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
        <FormField
          control={form.control}
          name="sticky"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm my-4">
              <div className="space-y-0.5">
                <FormLabel className="text-dark dark:text-gray-200">
                  Sticky Tool
                </FormLabel>
                <FormDescription>
                  Pin this tool to the top of the category list.
                </FormDescription>
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

        {showExtraFields && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Display Word Count */}
            <div className="md:col-span-3">
              <FormField
                control={form.control}
                name="display_wordcount"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-dark dark:text-gray-200">
                        Display Word Count
                      </FormLabel>
                      <FormDescription>
                        Show word count for this tool's outputs.
                      </FormDescription>
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
            </div>

            {/* Custom URL */}
            <div className="md:col-span-3">
              <FormField
                control={form.control}
                name="custom_url"
                render={({ field }) => (
                  <FormItem className="flex flex-col rounded-lg border p-3 shadow-sm">
                    <FormLabel className="text-dark dark:text-gray-200">
                      Custom URL
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Improvement System Prompt - full width */}
            <div className="md:col-span-6">
              <FormField
                control={form.control}
                name="improvement_system_prompt"
                render={({ field }) => (
                  <FormItem className="flex flex-col rounded-lg border p-3 shadow-sm">
                    <FormLabel className="text-dark dark:text-gray-200">
                      Improvement System Prompt
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter custom improvement prompt..."
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

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

      {/* Sidebar */}
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
                    "relative flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-4 cursor-pointer transition",
                    isDraggingToolCover
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-300 dark:border-gray-600",
                    "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10",
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
                  onClick={() => toolCoverImageFileInputRef.current?.click()}
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
                        Drag & drop a tool cover image here <br /> or click to
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
          name="allternativeTools"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">
                Alternative Tools
              </FormLabel>

              <FormControl>
                <div className="grid grid-cols-1 gap-3 border rounded p-3 bg-white dark:bg-gray-900  h-[350px] overflow-y-auto ">
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
