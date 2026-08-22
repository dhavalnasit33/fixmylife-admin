import React, { useEffect, useRef, useState } from "react";
import {
  useForm,
  useFieldArray,
  Controller,
  useWatch,
  UseFormReturn,
} from "react-hook-form";

import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Loader2,
  PlusCircle,
  Trash,
  Trash2,
  UploadCloud,
  Trash as TrashIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FieldType,
  ResumeGeneratorFormValues,
  ResumeGeneratorSchema,
} from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Switch } from "@/components/ui/switch";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "@/config";
import { useToast } from "@/hooks/use-toast";
import YoastSeoForm from "../yoast-seo/YoastSeoForm";
import { cn, deleteImage, uploadFileToServer } from "@/lib/utils";
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

interface ResumeGeneratorFormProps {
  form: UseFormReturn<ResumeGeneratorFormValues>;
  isSubmitting: boolean;
  onCancel?: () => void;
  initialData?: ResumeGeneratorFormValues;
}

export default function ResumeGeneratorForm({
  form,
  isSubmitting,
}: ResumeGeneratorFormProps) {
  const {
    control,
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const toolCoverImage = form.watch("tool_cover_image"); // ✅ Add this line
  const tabNormalIconImage = form.watch("tab_normal_icon_image"); // ✅ Add this line
  const tabActiveIconImage = form.watch("tab_active_icon_image"); // ✅ Add this line
  const tabIconImage = form.watch("tab_image");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toolCoverImageFileInputRef = useRef<HTMLInputElement | null>(null); // ✅ Add this line
  const tabNormalIconFileInputRef = useRef<HTMLInputElement | null>(null); // ✅ Add this line
  const tabActiveIconFileInputRef = useRef<HTMLInputElement | null>(null); // ✅ Add this line
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const tabIconInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadings, setIsUploadings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingToolCover, setIsDraggingToolCover] = useState(false); // ✅ Add this line
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

  const { toast } = useToast();

  const [openFieldIndex, setOpenFieldIndex] = useState<{
    tabIndex: number;
    fieldIndex: number;
  } | null>(null);
  const [isDraggingField, setIsDraggingField] = useState(false);
  // Function to toggle field open/close
  const toggleField = (tabIndex: number, fieldIndex: number) => {
    setOpenFieldIndex(
      openFieldIndex?.tabIndex === tabIndex &&
        openFieldIndex?.fieldIndex === fieldIndex
        ? null
        : { tabIndex, fieldIndex },
    );
  };

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  // Drag start handler
  const handleDragStart = (event: any) => {
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

  // Drag end handler for fields within a tab
  // Final optimized version
  const handleDragEnd = (event: DragEndEvent, tabIndex: number) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      const currentFields = getFieldsArray(tabIndex);
      const oldIndex = currentFields.findIndex(
        (field) => generateFieldId(tabIndex, field) === active.id,
      );
      const newIndex = currentFields.findIndex(
        (field) => generateFieldId(tabIndex, field) === over.id,
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        // Create new array with moved item
        const updatedFields = [...currentFields];
        const [movedField] = updatedFields.splice(oldIndex, 1);
        updatedFields.splice(newIndex, 0, movedField);

        // Update form state
        setValue(`tabs.${tabIndex}.fields`, updatedFields, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    }
    setIsDraggingField(false);
  };

  // Generate unique ID for fields (since your data doesn't have id)
  const generateFieldId = (tabIndex: number, field: any) => {
    return `field-${tabIndex}-${field.key || Math.random().toString(36).substr(2, 9)
      }`;
  };

  const {
    fields: tabs,
    append: appendTab,
    remove: removeTab,
    move: moveTab, // For tab reordering if needed
  } = useFieldArray({ control, name: "tabs" });

  const watchedTabs = useWatch({ control, name: "tabs" }) || [];

  const getFieldsArray = (tabIndex: number) => {
    return watchedTabs?.[tabIndex]?.fields || [];
  };

  // const handleFileUpload = async (
  //   tabIndex: number,
  //   index: number,
  //   e: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   setIsUploadings(true);
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
  //       setValue(
  //         `tabs.${tabIndex}.fields.${index}.default_value` as any,
  //         data.secure_url,
  //         {
  //           shouldDirty: true,
  //           shouldValidate: true,
  //         }
  //       );
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
  //     setIsUploadings(false);
  //     if (fileInputRefs.current[index]) fileInputRefs.current[index].value = "";
  //   }
  // };
  // const coverImage = form.watch("cover_image");

  // const handleCoverImageUpload = async (file: File) => {
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

  // For cover image
  const handleCoverImageUpload = async (file: File) => {
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
      setIsUploading(true);
      // Upload via your internal API
      const url = await uploadFileToServer(file, "common");

      // Set form value
      form.setValue("cover_image", url, {
        shouldDirty: true,
        shouldValidate: true,
      });

      toast({ title: "Cover image uploaded" });
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ✅ Add this function for tool cover image upload
  const handleToolCoverImageUpload = async (file: File) => {
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
      setIsUploading(true);
      // Upload via your internal API
      const url = await uploadFileToServer(file, "common");

      // Set form value
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

  const handleToolCoverFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) handleToolCoverImageUpload(file);
  };

  const handleToolCoverDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingToolCover(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleToolCoverImageUpload(file);
  };

  // ✅ Add this function for tab normal icon image upload
  const handleTabNormalIconUpload = async (file: File) => {
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
      setIsUploading(true);
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
  const handleTabActiveIconUpload = async (file: File) => {
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
      setIsUploading(true);
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

  const handleTabNormalIconFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) handleTabNormalIconUpload(file);
  };

  const handleTabActiveIconFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) handleTabActiveIconUpload(file);
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

  const handleTabNormalIconDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingTabNormalIcon(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleTabNormalIconUpload(file);
  };

  const handleTabActiveIconDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingTabActiveIcon(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleTabActiveIconUpload(file);
  };

  // For tab fields / other file uploads
  const handleFileUpload = async (
    tabIndex: number,
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadings(true);
      // Upload via internal API
      const url = await uploadFileToServer(file, "common");

      setValue(`tabs.${tabIndex}.fields.${index}.default_value` as any, url, {
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleCoverImageUpload(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleCoverImageUpload(file);
  };

  useEffect(() => {
    if (!watchedTabs || watchedTabs.length === 0) {
      appendTab({
        title: "",
        description: "",
        prompt_template: "",
        fields: [
          {
            key: "",
            label: "",
            prompt: "",
            description: "",
            type: "textbox",
            required: true,
            placeholder: "",
            options: [],
            default_value: "",
          },
        ],
      });
    }
  }, [watchedTabs, appendTab]);

  // Track previous template per tab to avoid unnecessary setValue calls that cause re-renders
  const prevTemplatesRef = useRef<Record<number, string>>({});

  useEffect(() => {
    const timeout = setTimeout(() => {
      watchedTabs?.forEach((tab, tabIndex) => {
        const generatedTemplate = tab.fields
          .map((field) => {
            if (!field.label && !field.prompt) return "";
            return `${field.prompt} = {{${field.key}}}`;
          })
          .filter(Boolean)
          .join("\n");

        // Only call setValue if the template actually changed — prevents focus loss on every keystroke
        if (
          generatedTemplate !== tab.prompt_template &&
          prevTemplatesRef.current[tabIndex] !== generatedTemplate
        ) {
          prevTemplatesRef.current[tabIndex] = generatedTemplate;
          setValue(`tabs.${tabIndex}.prompt_template`, generatedTemplate, {
            shouldDirty: true,
            shouldValidate: false, // don't trigger validation on every keystroke
          });
        }
      });
    }, 800); // increased debounce so typing feels uninterrupted

    return () => clearTimeout(timeout);
  }, [watchedTabs, setValue]);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-8">
        {tabs.map((tab, tabIndex) => {
          const currentFields = getFieldsArray(tabIndex);

          return (
            <Card key={tab.id}>
              <CardHeader>
                <div className="flex justify-between items-center w-full">
                  <CardTitle>Tab {tabIndex + 1}</CardTitle>
                  {tabs.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeTab(tabIndex)}
                    >
                      Remove Tab
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <FormField
                  control={control}
                  name={`tabs.${tabIndex}.title`}
                  render={({ field }) => (
                    <div>
                      <label className="block mb-1 font-medium">Title</label>
                      <Input {...field} value={field.value ?? ""} />
                    </div>
                  )}
                />
                {errors.tabs?.[tabIndex]?.title && (
                  <p className="text-red-500">
                    {errors.tabs[tabIndex].title?.message}
                  </p>
                )}
                {/* Description */}
                <FormField
                  control={control}
                  name={`tabs.${tabIndex}.description`}
                  render={({ field }) => (
                    <div>
                      <label className="block mb-1 font-medium">
                        Description
                      </label>
                      <Textarea {...field} value={field.value ?? ""} />
                    </div>
                  )}
                />
                {errors.tabs?.[tabIndex]?.description && (
                  <p className="text-red-500">
                    {errors.tabs[tabIndex].description?.message}
                  </p>
                )}

                <FormField
                  control={control}
                  name={`tabs.${tabIndex}.prompt_template` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt Template</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          readOnly
                          rows={10}
                          className="w-full border rounded p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 cursor-not-allowed"
                        />
                      </FormControl>
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
                    onDragEnd={(event) => handleDragEnd(event, tabIndex)}
                  >
                    <SortableContext
                      items={currentFields.map((_, fieldIndex) =>
                        `field-${tabIndex}-${fieldIndex}`,
                      )}
                      strategy={verticalListSortingStrategy}
                    >
                      {currentFields.map((field, fieldIndex) => {
                        const currentType = field.type;
                        const isFieldOpen =
                          openFieldIndex?.tabIndex === tabIndex &&
                          openFieldIndex?.fieldIndex === fieldIndex;
                        // Use stable index-based key so React doesn't remount on field.key change
                        const stableId = `field-${tabIndex}-${fieldIndex}`;

                        return (
                          <SortableFieldItem
                            key={stableId}
                            id={stableId}
                          >
                            {({ attributes, listeners, isDragging }) => (
                              <div
                                className={`border p-4 rounded !my-12 mx-4 ${isFieldOpen ? " " : " bg-gray-100"
                                  } border-sidebar-primary`}
                              >
                                {/* Header */}
                                <div
                                  className={`flex justify-between ${isFieldOpen ? " mb-2" : " "
                                    } items-center`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      {...listeners}
                                      {...attributes}
                                      className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                                    >
                                      <GripVertical
                                        className={`h-6 ${isFieldOpen ? " " : " "
                                          } w-6`}
                                      />
                                    </div>
                                    <span className="font-medium">
                                      {field.label || `Field ${fieldIndex + 1}`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isFieldOpen && (
                                      <Button
                                        type="button"
                                        onClick={() => {
                                          const updatedFields = [
                                            ...currentFields,
                                          ];
                                          updatedFields.splice(fieldIndex, 1);
                                          setValue(
                                            `tabs.${tabIndex}.fields`,
                                            updatedFields,
                                          );
                                        }}
                                        size="icon"
                                        className="h-8 w-8 rounded-full border border-red-500 text-red-500 bg-white hover:bg-red-500 hover:text-white"
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        toggleField(tabIndex, fieldIndex)
                                      }
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
                                      control={control}
                                      name={`tabs.${tabIndex}.fields.${fieldIndex}.label`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Label</FormLabel>
                                          <FormControl>
                                            <Input
                                              {...field}
                                              value={field.value ?? ""}
                                              onBlur={() => {
                                                const slug = (field.value ?? "")
                                                  .toLowerCase()
                                                  .replace(/\s+/g, "_")
                                                  .replace(/[^a-z0-9_]/g, "");
                                                setValue(
                                                  `tabs.${tabIndex}.fields.${fieldIndex}.key`,
                                                  slug,
                                                );
                                              }}
                                            />
                                          </FormControl>
                                          {field.value && (
                                            <p className="text-sm mt-1">
                                              Key:{" "}
                                              <span className="font-mono">
                                                {watchedTabs?.[tabIndex]
                                                  ?.fields?.[fieldIndex]?.key ||
                                                  "generating..."}
                                              </span>
                                            </p>
                                          )}
                                        </FormItem>
                                      )}
                                    />

                                    {/* Prompt */}
                                    <FormField
                                      control={control}
                                      name={
                                        `tabs.${tabIndex}.fields.${fieldIndex}.prompt` as const
                                      }
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-dark dark:text-gray-200">
                                            Prompt
                                          </FormLabel>
                                          <FormControl>
                                            <Input
                                              {...field}
                                              value={field.value ?? ""}
                                              placeholder="e.g. Generate recipes, with this..."
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    {/* Description */}
                                    <FormField
                                      control={control}
                                      name={
                                        `tabs.${tabIndex}.fields.${fieldIndex}.description` as const
                                      }
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-dark dark:text-gray-200">
                                            Description
                                          </FormLabel>
                                          <FormControl>
                                            <Input
                                              {...field}
                                              value={field.value ?? ""}
                                              placeholder="Field description"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    {/* Type */}
                                    <FormField
                                      control={control}
                                      name={
                                        `tabs.${tabIndex}.fields.${fieldIndex}.type` as const
                                      }
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-dark dark:text-gray-200">
                                            Type
                                          </FormLabel>
                                          <FormControl>
                                            <Select
                                              value={field.value ?? ""}
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
                                    {[
                                      "textbox",
                                      "textarea",
                                      "number",
                                      "date",
                                    ].includes(currentType) && (
                                        <FormField
                                          control={control}
                                          name={
                                            `tabs.${tabIndex}.fields.${fieldIndex}.placeholder` as const
                                          }
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel className="text-dark dark:text-gray-200">
                                                Placeholder
                                              </FormLabel>
                                              <FormControl>
                                                <Input
                                                  {...field}
                                                  value={field.value ?? ""}
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
                                          control={control}
                                          name={
                                            `tabs.${tabIndex}.fields.${fieldIndex}.options` as const
                                          }
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel className="text-dark dark:text-gray-200">
                                                Options (comma separated)
                                              </FormLabel>
                                              <FormControl>
                                                <Input
                                                  value={
                                                    Array.isArray(field.value)
                                                      ? field.value.join(", ")
                                                      : typeof field.value === "string"
                                                        ? field.value
                                                        : ""
                                                  }
                                                  placeholder="Option1, Option2"
                                                  onChange={(e) => {
                                                    // Store raw string while typing so cursor doesn't jump
                                                    field.onChange(e.target.value);
                                                  }}
                                                  onBlur={(e) => {
                                                    const raw = e.target.value;
                                                    const options = raw
                                                      .split(",")
                                                      .map((opt) => opt.trim())
                                                      .filter((opt) => opt);
                                                    // Save parsed array back to form
                                                    form.setValue(
                                                      `tabs.${tabIndex}.fields.${fieldIndex}.options`,
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
                                                      {field.value.length}{" "}
                                                      options:
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
                                      control={control}
                                      name={
                                        `tabs.${tabIndex}.fields.${fieldIndex}.required` as const
                                      }
                                      render={({ field }) => (
                                        <FormItem className="flex items-center justify-between border  !h-[60px]  mt-3  p-3 rounded">
                                          <FormLabel className="text-dark dark:text-gray-200">
                                            Required?
                                          </FormLabel>
                                          <FormControl>
                                            <Switch
                                              checked={field.value ?? true}
                                              onCheckedChange={field.onChange}
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />

                                    {/* File Upload */}
                                    {["imageupload", "fileupload"].includes(
                                      currentType,
                                    ) &&
                                      (() => {
                                        const uploadedFile =
                                          watch(
                                            `tabs.${tabIndex}.fields.${fieldIndex}.default_value`,
                                          ) ?? "";
                                        return (
                                          <FormItem>
                                            <FormLabel className="text-dark dark:text-gray-200">
                                              Upload File
                                            </FormLabel>
                                            <div className="flex items-center gap-4">
                                              <Input
                                                id={`fileInput-${tabIndex}-${fieldIndex}`}
                                                type="file"
                                                className="hidden"
                                                ref={(el) =>
                                                  void (fileInputRefs.current[
                                                    fieldIndex
                                                  ] = el)
                                                }
                                                onChange={(e) =>
                                                  handleFileUpload(
                                                    tabIndex,
                                                    fieldIndex,
                                                    e,
                                                  )
                                                }
                                                disabled={isUploadings}
                                              />
                                              <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                  fileInputRefs.current[
                                                    fieldIndex
                                                  ]?.click()
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
                                                (currentType ===
                                                  "imageupload" ? (
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

                  <Button
                    type="button"
                    className="
                       hover:bg-green-700 hover:text-white bg-white text-black border"
                    onClick={() => {
                      setValue(`tabs.${tabIndex}.fields`, [
                        ...(getFieldsArray(tabIndex) || []),
                        {
                          key: "",
                          label: "",
                          prompt: "",
                          description: "",
                          type: "textbox" as FieldType,
                          required: true,
                          placeholder: "",
                          options: [],
                          default_value: "",
                        },
                      ]);
                    }}
                  >
                    <PlusCircle className="mr-2 h-5 w-5" /> Add Field
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Button
          type="button"
          className="
                       hover:bg-green-700 hover:text-white bg-white text-black border"
          onClick={() =>
            appendTab({
              title: "",
              description: "",
              prompt_template: "",
              fields: [
                {
                  key: "",
                  label: "",
                  prompt: "",
                  description: "",
                  type: "textbox",
                  required: true,
                  placeholder: "",
                  options: [],
                  default_value: "",
                },
              ],
            })
          }
        >
          <PlusCircle className="mr-2 h-5 w-5" /> Add Tab
        </Button>

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
                  placeholder="e.g., Creates professional resumes in minutes"
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
          name="long_description"
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
                      form.setValue("long_description", value, {
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
          name="display_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">
                Display Name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Resume Builder"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
        {/* SEO Fields */}
        <div className="pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4">Yoast SEO Settings</h3>
          <YoastSeoForm
            isSubmitting={isSubmitting}
            hideCoverImage
            hidePageDescription
          />
        </div>
      </div>
      <div className="w-full lg:w-[300px] space-y-6 mt-8 lg:mt-0">
        <FormField
          control={control}
          name="cover_image"
          render={({ field }) => {
            const coverImage = field.value;

            return (
              <FormItem>
                <FormLabel>Featured Image</FormLabel>
                <FormControl>
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 cursor-pointer transition",
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
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />

                    {isUploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
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
                                // Call your delete API
                                await deleteImage(coverImage);
                              } catch (err) {
                                console.error("Failed to delete image", err);
                              }
                            }

                            // Clear the form value
                            form.setValue("cover_image", "", {
                              shouldDirty: true,
                              shouldValidate: true,
                            });

                            // Clear file input
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                        <UploadCloud className="h-8 w-8 mb-2" />
                        <p className="text-sm text-center">
                          Drag & drop a cover image <br /> or click to upload
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
        {/* ✅ Add Tool Cover Image Field */}
        <FormField
          control={control}
          name="tool_cover_image"
          render={({ field }) => {
            const toolCoverImage = field.value;

            return (
              <FormItem>
                <FormLabel>Tool Cover Image</FormLabel>
                <FormControl>
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 cursor-pointer transition",
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
                    onDrop={handleToolCoverDrop}
                    onClick={() => toolCoverImageFileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg"
                      className="hidden"
                      ref={toolCoverImageFileInputRef}
                      onChange={handleToolCoverFileChange}
                    />

                    {isUploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
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
                                // Call your delete API
                                await deleteImage(toolCoverImage);
                              } catch (err) {
                                console.error("Failed to delete image", err);
                              }
                            }

                            // Clear the form value
                            form.setValue("tool_cover_image", "", {
                              shouldDirty: true,
                              shouldValidate: true,
                            });

                            // Clear file input
                            if (toolCoverImageFileInputRef.current) {
                              toolCoverImageFileInputRef.current.value = "";
                            }
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                        <UploadCloud className="h-8 w-8 mb-2" />
                        <p className="text-sm text-center">
                          Drag & drop a tool cover image <br /> or click to
                          upload
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
        {/* ✅ Add Tab Normal Icon Image Field */}
        <FormField
          control={control}
          name="tab_normal_icon_image"
          render={({ field }) => {
            const tabNormalIconImage = field.value;

            return (
              <FormItem>
                <FormLabel>Tab Normal Icon Image</FormLabel>
                <FormControl>
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center w-48 border-2 border-dashed rounded-lg p-6 cursor-pointer transition",
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
                    onDrop={handleTabNormalIconDrop}
                    onClick={() => tabNormalIconFileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg"
                      className="hidden"
                      ref={tabNormalIconFileInputRef}
                      onChange={handleTabNormalIconFileChange}
                    />

                    {isUploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
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
                                console.error("Failed to delete image", err);
                              }
                            }

                            form.setValue("tab_normal_icon_image", "", {
                              shouldDirty: true,
                              shouldValidate: true,
                            });

                            if (tabNormalIconFileInputRef.current) {
                              tabNormalIconFileInputRef.current.value = "";
                            }
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                        <UploadCloud className="h-8 w-8 mb-2" />
                        <p className="text-sm text-center">
                          Drag & drop tab normal icon <br /> or click to upload
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

        {/* ✅ Add Tab Active Icon Image Field */}
        <FormField
          control={control}
          name="tab_active_icon_image"
          render={({ field }) => {
            const tabActiveIconImage = field.value;

            return (
              <FormItem>
                <FormLabel>Tab Active Icon Image</FormLabel>
                <FormControl>
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center w-48 border-2 border-dashed rounded-lg p-6 cursor-pointer transition",
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
                    onDrop={handleTabActiveIconDrop}
                    onClick={() => tabActiveIconFileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg"
                      className="hidden"
                      ref={tabActiveIconFileInputRef}
                      onChange={handleTabActiveIconFileChange}
                    />

                    {isUploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
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
                                console.error("Failed to delete image", err);
                              }
                            }

                            form.setValue("tab_active_icon_image", "", {
                              shouldDirty: true,
                              shouldValidate: true,
                            });

                            if (tabActiveIconFileInputRef.current) {
                              tabActiveIconFileInputRef.current.value = "";
                            }
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                        <UploadCloud className="h-8 w-8 mb-2" />
                        <p className="text-sm text-center">
                          Drag & drop tab active icon <br /> or click to upload
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