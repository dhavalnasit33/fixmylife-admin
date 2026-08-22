"use client";

import type { SubmitHandler } from "react-hook-form";
import { useForm, useFieldArray } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, PlusCircle, UploadCloud, Loader2 } from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { TiptapEditorNoSSR } from "@/components/shared/TiptapEditor";
// ✅ Added cn and deleteImage imports
import { uploadFileToServer, cn, deleteImage } from "@/lib/utils";
import apiService from "@/lib/apiService";
import { z } from "zod";

// --- TYPES & SCHEMA ---

const fieldSchema = z.object({
  key: z.string(),
  label: z.string().min(1, "Label is required"),
  description: z.string().optional(),
  type: z.enum([
    "textbox",
    "textarea",
    "dropdown",
    "radio",
    "checkbox",
    "imageupload",
    "fileupload",
    "number",
    "date",
  ]),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  default_value: z.any().optional(),
  options: z.any().optional(),
  field_prompt_template: z.string().optional(),
});

const tabSchema = z.object({
  title: z.string().min(1, "Tab title is required"),
  fields: z.array(fieldSchema).optional(),
  prompt_template: z.string().max(2000).optional(),
  description: z.string().max(500).optional(),
});

const suggestedTopicSchema = z.object({
  title: z.string(),
  has_input: z.boolean(),
  input_placeholder: z.string().optional(),
  image: z.string().optional(),
  sticky: z.boolean().default(false),
});

const otherToolSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  icon: z.string().optional(),
  short_description: z.string().max(200).optional(),
  mini_description: z
    .string()
    .max(200, "Mini description cannot exceed 200 characters")
    .optional(),
  description: z.string().max(50000).optional(),
  system_prompt_template: z
    .string()
    .min(1, "System prompt is required")
    .max(3000),
  max_tokens: z.number().default(4000),
  is_active: z.boolean().default(true),
  sticky: z.boolean().default(false),
  is_popular: z.boolean().default(false),
  user_plan: z.enum(["free", "basic", "pro_max", "guest"]).default("free"),
  display_wordcount: z.boolean().default(true),
  improvement_system_prompt: z.string().optional(),
  custom_url: z.string().optional(),
  tooltips: z.string().optional(),
  tabs: z.array(tabSchema).optional(),
  suggested_topics: z.array(suggestedTopicSchema).optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  seo_keyphrase: z.string().optional(),
  seo_title: z.string().optional(),
  meta_description: z.string().optional(),
  cover_image: z.string().optional(),
  show_text_editor: z.boolean().default(true),
  has_brand_voice: z.boolean().default(false),
  tool_cover_image: z.string().optional(),
  tab_normal_icon_image: z.string().optional(),
  tab_active_icon_image: z.string().optional(),
  display_name: z.string().optional().default(""),
  allternativeTools: z.array(z.string()).optional().default([]),
  whatCanDO: z.array(z.string()).optional().default([]),
});

type OtherToolFormValues = z.infer<typeof otherToolSchema>;

// Helper for slugs
const slugify = (text: string): string => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "_");
};

const fieldTypes = [
  "textbox",
  "textarea",
  "dropdown",
  "radio",
  "checkbox",
  "number",
  "date",
  "fileupload",
];

// --- COMPONENT ---

interface OtherToolsFormProps {
  initialData?: any;
  onSubmit: (values: OtherToolFormValues) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
  toolTypeLabel: string;
}

export default function OtherToolsForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
  toolTypeLabel,
}: OtherToolsFormProps) {
  const { toast } = useToast();
  const [isUploadingToolIcon, setIsUploadingToolIcon] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const toolIconInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  // Refs for new fields
  const toolCoverInputRef = useRef<HTMLInputElement>(null);
  const tabNormalInputRef = useRef<HTMLInputElement>(null);
  const tabActiveInputRef = useRef<HTMLInputElement>(null);
  // const tabImageInputRef = useRef<HTMLInputElement>(null);

  const [editVersion, setEditVersion] = useState(0);

  // Generic home categories/tags (global)
  const [homeCategories, setHomeCategories] = useState<
    { _id: string; name: string }[]
  >([]);
  const [homeTags, setHomeTags] = useState<{ _id: string; name: string }[]>([]);
  const [alternativeTools, setAlternativeTools] = useState<
    { _id: string; name: string }[]
  >([]);

  const form = useForm<OtherToolFormValues>({
    resolver: zodResolver(otherToolSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "",
      mini_description: "",
      system_prompt_template: "",
      max_tokens: 4000,
      is_active: true,
      tabs: [],
      suggested_topics: [],
      user_plan: "free",
      is_popular: false,
      sticky: false,
      seo_keyphrase: "",
      seo_title: "",
      meta_description: "",
      cover_image: "",
      display_wordcount: true,
      improvement_system_prompt: "",
      custom_url: "",
      tooltips: "",
      show_text_editor: true,
      has_brand_voice: false,
      tool_cover_image: "",
      tab_normal_icon_image: "",
      tab_active_icon_image: "",
      display_name: "",
      allternativeTools: [],
      whatCanDO: [],
      // tab_image: "",
    },
  });

  const { reset, setValue, watch, control, getValues } = form;

  const {
    fields: tabFields,
    append: appendTab,
    remove: removeTab,
    update: updateTab,
  } = useFieldArray({
    control,
    name: "tabs",
  });

  const {
    fields: suggestedTopicFields,
    append: appendSuggestedTopic,
    remove: removeSuggestedTopic,
  } = useFieldArray({
    control,
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

  // Force re-render key when initial data changes
  useEffect(() => {
    setEditVersion((v) => v + 1);
  }, [initialData?._id]);

  // Load Initial Data
  useEffect(() => {
    if (initialData) {
      const formData = {
        ...initialData,
        user_plan: initialData.user_plan || "free",
        show_text_editor: initialData.show_text_editor ?? true,
        has_brand_voice: initialData.has_brand_voice ?? false,
        sticky: initialData.sticky ?? false,
      };
      reset(formData);
    }
  }, [initialData, reset]);

  // Load global home categories/tags
  useEffect(() => {
    const fetchGlobals = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          apiService<{ success: boolean; data: any[] }>(
            "/home-tool-categories",
          ),
          apiService<{ success: boolean; data: any[] }>("/home-tool-tags"),
        ]);
        if (catRes.success) setHomeCategories(catRes.data);
        if (tagRes.success) setHomeTags(tagRes.data);
      } catch (err) {
        console.error("Failed to load globals", err);
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

    fetchGlobals();
    fetchAlternativeTools();
  }, []);

  // Logic to auto-generate keys & prompt templates based on fields
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (
        (name &&
          name.startsWith("tabs.") &&
          (name.endsWith(".label") ||
            name.endsWith(".field_prompt_template"))) ||
        (type === "change" && name === "tabs")
      ) {
        const currentTabs = getValues("tabs");
        if (!Array.isArray(currentTabs)) return;

        currentTabs.forEach((tab, tabIndex) => {
          if (!tab || !Array.isArray(tab.fields)) return;

          tab.fields.forEach((field, fieldIndex) => {
            if (field && typeof field.label === "string") {
              const currentLabel = field.label;
              const currentKey = field.key;
              const newKey = slugify(currentLabel);
              if (newKey && newKey !== currentKey) {
                setValue(`tabs.${tabIndex}.fields.${fieldIndex}.key`, newKey, {
                  shouldDirty: true,
                });
              }
            }
          });

          const possiblyUpdatedFields = getValues(`tabs.${tabIndex}.fields`);
          if (Array.isArray(possiblyUpdatedFields)) {
            const fieldContributions = possiblyUpdatedFields
              .map((field) => {
                if (!field) return null;
                const userEnteredPrompt = field.field_prompt_template?.trim();
                if (!userEnteredPrompt) return null;
                const fieldKeyReference = field.key ? `{{${field.key}}}` : "";
                return `${userEnteredPrompt} ${fieldKeyReference}`.trim();
              })
              .filter(Boolean);

            const newTabPrompt = fieldContributions.join(". ");

            if (
              getValues(`tabs.${tabIndex}.prompt_template`) !== newTabPrompt
            ) {
              setValue(`tabs.${tabIndex}.prompt_template`, newTabPrompt, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }
          }
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, getValues, setValue]);

  // Handle Image Uploads
  const handleUpload = async (file: File, fieldName: string) => {
    if (!file) return;
    if (fieldName === "icon") setIsUploadingToolIcon(true);
    setUploadingField(fieldName);
    try {
      const url = await uploadFileToServer(file, "other-tool");
      // @ts-ignore
      setValue(fieldName, url, { shouldDirty: true, shouldValidate: true });
      toast({ title: "Upload Successful" });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingField(null);
      if (fieldName === "icon") setIsUploadingToolIcon(false);
      // Clear inputs
      if (fieldName === "icon" && toolIconInputRef.current)
        toolIconInputRef.current.value = "";
      if (fieldName === "cover_image" && coverImageInputRef.current)
        coverImageInputRef.current.value = "";
      if (fieldName === "tool_cover_image" && toolCoverInputRef.current)
        toolCoverInputRef.current.value = "";
      if (fieldName === "tab_normal_icon_image" && tabNormalInputRef.current)
        tabNormalInputRef.current.value = "";
      if (fieldName === "tab_active_icon_image" && tabActiveInputRef.current)
        tabActiveInputRef.current.value = "";
      // if (fieldName === "tab_image" && tabImageInputRef.current)
      //   tabImageInputRef.current.value = "";
    }
  };

  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/svg+xml",
  ];
  const handleImageUploadWrapper = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Only PNG, JPG, SVG allowed",
          variant: "destructive",
        });
        return;
      }
      handleUpload(file, fieldName);
    }
  };

  // --- Field Management Helpers ---
  const addNewField = (tabIndex: number) => {
    const currentTabs = getValues("tabs");
    if (!Array.isArray(currentTabs) || !currentTabs[tabIndex]) return;
    const newFieldLabel = `New Field ${
      (currentTabs[tabIndex].fields?.length || 0) + 1
    }`;
    const newFieldKey = slugify(newFieldLabel);

    // @ts-ignore
    const newField = {
      key: newFieldKey,
      label: newFieldLabel,
      type: "textarea" as any,
      required: false,
      placeholder: "",
      description: "",
      options: [],
      field_prompt_template: "",
    };

    const updatedFields = [...(currentTabs[tabIndex].fields || []), newField];
    updateTab(tabIndex, { ...currentTabs[tabIndex], fields: updatedFields });
  };

  const removeField = (tabIndex: number, fieldIndex: number) => {
    const currentTabs = getValues("tabs");
    if (!Array.isArray(currentTabs) || !currentTabs[tabIndex]?.fields) return;
    const updatedFields = [...(currentTabs[tabIndex].fields || [])];
    updatedFields.splice(fieldIndex, 1);
    updateTab(tabIndex, { ...currentTabs[tabIndex], fields: updatedFields });
  };

  const addDefaultTab = () => {
    const newTabIndex = Array.isArray(tabFields) ? tabFields.length : 0;
    const defaultFieldLabel = "My Example Input";
    const defaultFieldKey = slugify(defaultFieldLabel);
    appendTab({
      title: `Tab ${newTabIndex + 1}`,
      description: "",
      prompt_template: `{{${defaultFieldKey}}}`,
      fields: [
        {
          key: defaultFieldKey,
          label: defaultFieldLabel,
          description: "",
          type: "textarea",
          required: true,
          placeholder: "Enter details here...",
          options: [],
          field_prompt_template: "",
        },
      ],
    });
  };

  // Submit Handler
  const onFormSubmit: SubmitHandler<OtherToolFormValues> = async (data) => {
    const processedData = {
      ...data,
      tabs: data.tabs?.map((tab) => ({
        ...tab,
        fields: tab.fields?.map((f) => ({
          ...f,
          key: f.key || slugify(f.label),
        })),
      })),
      suggested_topics:
        data.suggested_topics?.map((topic) => {
          if (
            topic.has_input &&
            topic.title &&
            !topic.title.includes("{{user_input}}")
          ) {
            return { ...topic, title: `${topic.title.trim()} {{user_input}}` };
          }
          return topic;
        }) || [],
    };
    await onSubmit(processedData);
  };

  const isButtonDisabled = isSubmitting || isUploadingToolIcon;

  return (
    <Form {...form} key={editVersion}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information ({toolTypeLabel})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tool Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., PDF Converter" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex-1">
                <FormField
                  control={control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
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
              </div>

              <div className="flex-1">
                <FormField
                  control={control}
                  name="short_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tool Description</FormLabel>
                  <FormControl>
                    <div className="border rounded-md">
                      <TiptapEditorNoSSR
                        value={field.value || ""}
                        onChange={(val) => {
                          field.onChange(val);
                          setValue("description", val, {
                            shouldDirty: true,
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

            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
              <div className="md:col-span-3 flex flex-col gap-4 h-full">
                <FormField
                  control={control}
                  name="system_prompt_template"
                  render={({ field }) => (
                    <FormItem className="flex flex-col h-full">
                      <FormLabel>Overall System Prompt Template</FormLabel>
                      <FormControl className="flex-1">
                        <Textarea
                          className="h-full min-h-[180px]"
                          placeholder="You are a helpful assistant..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="improvement_system_prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Improvement System Prompt (optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[80px]" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="tooltips"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tooltips</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[80px]" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="custom_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom URL (optional)</FormLabel>
                      <FormControl>
                        <Input type="url" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="md:col-span-3 flex flex-col gap-4 h-full">
                <div className="flex flex-col gap-4">
                  <FormField
                    control={control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between border p-3 rounded shadow-sm">
                        <div>
                          <FormLabel>Active Status</FormLabel>
                        </div>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="is_popular"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between border p-3 rounded shadow-sm">
                        <div>
                          <FormLabel>Popular Tool</FormLabel>
                        </div>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="sticky"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between border p-3 rounded shadow-sm">
                        <div>
                          <FormLabel>Sticky Tool</FormLabel>
                        </div>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="display_wordcount"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between border p-3 rounded shadow-sm">
                        <div>
                          <FormLabel>Display Word Count</FormLabel>
                        </div>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="show_text_editor"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between border p-3 rounded shadow-sm">
                        <div>
                          <FormLabel>Show Text Editor</FormLabel>
                        </div>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="has_brand_voice"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between border p-3 rounded shadow-sm">
                        <div>
                          <FormLabel>Brand Voice</FormLabel>
                        </div>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col gap-4 mt-5">
                  <FormField
                    control={control}
                    name="user_plan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Plan</FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap gap-4 mt-2">
                            {["free", "basic", "pro_max", "guest"].map(
                              (plan) => (
                                <label
                                  key={plan}
                                  className="inline-flex items-center space-x-2 cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    value={plan}
                                    checked={field.value === plan}
                                    onChange={() => field.onChange(plan)}
                                    className="accent-primary"
                                  />
                                  <span className="capitalize">{plan}</span>
                                </label>
                              ),
                            )}
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="max_tokens"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Tokens</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

              <div className="space-y-6 border-t pt-6 bg-slate-50 dark:bg-slate-900/10 p-4 rounded-lg">
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
                        disabled={isButtonDisabled}
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
                          <div
                            key={`what-can-do-${index}`}
                            className="flex gap-2"
                          >
                            <Input
                              value={item || ""}
                              onChange={(e) =>
                                updateWhatCanDoItem(index, e.target.value)
                              }
                              placeholder="e.g., Generate SEO-friendly blog outlines"
                              disabled={isButtonDisabled}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeWhatCanDoItem(index)}
                              disabled={isButtonDisabled}
                            >
                            <Trash2 className="h-4 w-4 text-destructive" />
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
                                      const newSelected = new Set(
                                        field.value || [],
                                      );
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
            </CardContent>
          </Card>

          {/* --- TABS & FIELDS SECTION --- */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                Tool Tabs & Fields (Optional)
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDefaultTab}
                disabled={isButtonDisabled}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Tab
              </Button>
            </div>

          {tabFields.length === 0 && (
            <Card className="p-6 text-center text-muted-foreground">
              Optionally, click "Add Tab" to configure input fields for this
              tool.
            </Card>
          )}

          {tabFields.map((tabItem, tabIndex) => (
            <Card key={tabItem.id} className="border-l-4 border-primary/50">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <FormField
                    control={control}
                    name={`tabs.${tabIndex}.title`}
                    render={({ field }) => (
                      <FormItem className="flex-grow mr-4">
                        <FormControl>
                          <Input
                            placeholder={`Tab ${tabIndex + 1} Title`}
                            {...field}
                            className="text-lg font-semibold"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTab(tabIndex)}
                    className="text-red-500 hover:bg-red-500 hover:text-white rounded-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <FormField
                  control={control}
                  name={`tabs.${tabIndex}.description`}
                  render={({ field }) => (
                    <FormItem className="mt-2">
                      <FormLabel>Tab Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={2}
                          placeholder="Briefly describe this tab..."
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`tabs.${tabIndex}.prompt_template`}
                  render={({ field }) => (
                    <FormItem className="mt-2">
                      <FormLabel>
                        Tab Prompt Template (Auto-Generated)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          {...field}
                          readOnly
                          className="bg-muted/50 cursor-not-allowed"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="text-md font-semibold text-muted-foreground mb-2">
                  Fields for Tab: {watch(`tabs.${tabIndex}.title`)}
                </h4>
                {watch(`tabs.${tabIndex}.fields`)?.map(
                  (fieldData, fieldIndex) => (
                    <Card
                      key={`${tabItem.id}-field-${fieldIndex}`}
                      className="p-4 bg-muted/30 space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-primary">
                          Field {fieldIndex + 1} (Key:{" "}
                          {watch(`tabs.${tabIndex}.fields.${fieldIndex}.key`)})
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeField(tabIndex, fieldIndex)}
                          className="text-red-500 hover:bg-red-500 hover:text-white rounded-full h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={control}
                          name={`tabs.${tabIndex}.fields.${fieldIndex}.label`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Field Label</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Topic" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name={`tabs.${tabIndex}.fields.${fieldIndex}.type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Field Type</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {fieldTypes.map((t) => (
                                    <SelectItem key={t} value={t}>
                                      {t}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={control}
                        name={`tabs.${tabIndex}.fields.${fieldIndex}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field Question</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Explain to user..."
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name={`tabs.${tabIndex}.fields.${fieldIndex}.placeholder`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Placeholder</FormLabel>
                            <FormControl>
                              <Input placeholder="Placeholder..." {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {(watch(`tabs.${tabIndex}.fields.${fieldIndex}.type`) ===
                        "dropdown" ||
                        watch(`tabs.${tabIndex}.fields.${fieldIndex}.type`) ===
                          "radio" ||
                        watch(`tabs.${tabIndex}.fields.${fieldIndex}.type`) ===
                          "checkbox") && (
                        <FormField
                          control={control}
                          name={`tabs.${tabIndex}.fields.${fieldIndex}.options`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Options (comma separated)</FormLabel>
                              <FormControl>
                                <Input
                                  // Handle display: if it's already an array, join it; otherwise show string or empty
                                  defaultValue={
                                    Array.isArray(field.value)
                                      ? field.value.join(", ")
                                      : typeof field.value === "string"
                                        ? field.value
                                        : ""
                                  }
                                  placeholder="Option1, Option2, Option3"
                                  // Update internal state as string while typing
                                  onChange={(e) =>
                                    field.onChange(e.target.value)
                                  }
                                  // On blur, split string into Array and save back to form
                                  onBlur={(e) => {
                                    const raw = e.target.value;
                                    const options = raw
                                      .split(",")
                                      .map((opt) => opt.trim())
                                      .filter((opt) => opt);

                                    // Explicitly set the value as an array
                                    form.setValue(
                                      `tabs.${tabIndex}.fields.${fieldIndex}.options`,
                                      options,
                                      { shouldDirty: true },
                                    );
                                  }}
                                />
                              </FormControl>

                              {/* Visual Preview of Options */}
                              <div className="text-sm text-muted-foreground mt-1">
                                {Array.isArray(field.value) &&
                                field.value.length > 0 ? (
                                  <div>
                                    <span className="font-medium">
                                      {field.value.length} options:
                                    </span>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {field.value.map(
                                        (option: string, optIndex: number) => (
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
                                  "Type options separated by commas, e.g. Red, Green, Blue"
                                )}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <FormField
                        control={control}
                        name={`tabs.${tabIndex}.fields.${fieldIndex}.field_prompt_template`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prompt for this Field</FormLabel>
                            <FormControl>
                              <Textarea
                                rows={2}
                                placeholder="e.g., The topic is"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name={`tabs.${tabIndex}.fields.${fieldIndex}.required`}
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between border p-2 rounded shadow-sm bg-white">
                            <FormLabel>Required?</FormLabel>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormItem>
                        )}
                      />
                    </Card>
                  ),
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addNewField(tabIndex)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Field
                </Button>
              </CardContent>
            </Card>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDefaultTab}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Tab
          </Button>
        </div>

        {/* 🆕 SUGGESTED TOPICS - MATCHING GENERIC CONTENT FORM DESIGN */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Suggested Topics</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestedTopicFields.map((item, index) => (
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
                  >
                    <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                  </Button>
                </div>

                {/* 1. Title & Input Config */}
                <div className="space-y-3">
                  <FormField
                    control={control}
                    name={`suggested_topics.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Write a newsletter about..."
                            {...field}
                            value={
                              field.value
                                ?.replace(/{{\s*user_input\s*}}/g, "")
                                .trim() || ""
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(`${val.trim()} {{user_input}}`);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Optional: Has Input & Placeholder (kept from original OtherTools logic, but styled cleanly) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={control}
                      name={`suggested_topics.${index}.has_input`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-white">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm">
                              Requires Input?
                            </FormLabel>
                          </div>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormItem>
                      )}
                    />
                    {watch(`suggested_topics.${index}.has_input`) && (
                      <FormField
                        control={control}
                        name={`suggested_topics.${index}.input_placeholder`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Input placeholder text..."
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                {/* 2. Sticky Switch */}
                <FormField
                  control={control}
                  name={`suggested_topics.${index}.sticky`}
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between border rounded-md px-3 py-2 bg-white">
                      <FormLabel className="m-0">Sticky</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* 3. Image Upload (Drag & Drop style from GenericContentForm) */}
                <FormField
                  control={control}
                  name={`suggested_topics.${index}.image`}
                  render={({ field }) => {
                    // Local state for this specific field render
                    const [isDragging, setIsDragging] = React.useState(false);
                    const currentFieldName = `suggested_topics.${index}.image`;
                    const isUploadingThis = uploadingField === currentFieldName;
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

                    const handleDrop = async (
                      event: React.DragEvent<HTMLDivElement>,
                    ) => {
                      event.preventDefault();
                      setIsDragging(false);
                      const file = event.dataTransfer.files?.[0];
                      if (file) {
                        handleUpload(file, `suggested_topics.${index}.image`);
                      }
                    };

                    return (
                      <FormItem>
                        <FormLabel>Topic Image</FormLabel>
                        <FormControl>
                          <div
                            className={cn(
                              "relative flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-4 cursor-pointer transition bg-white",
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
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file)
                                  handleUpload(
                                    file,
                                    `suggested_topics.${index}.image`,
                                  );
                              }}
                            />

                            {isUploadingThis ? (
                              <div className="flex flex-col items-center justify-center">
                                <Loader2 className="animate-spin text-primary h-8 w-8 mb-2" />
                                <p className="text-xs text-muted-foreground">
                                  Uploading...
                                </p>
                              </div>
                            ) : field.value ? (
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
                                    setValue(
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
                    input_placeholder: "",
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

        {/* HOME CATEGORIES & TAGS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <FormField
            control={control}
            name="categories"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Home Tool Categories</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-2 gap-3 border  rounded p-3 bg-white dark:bg-gray-900 h-[300px] overflow-y-auto">
                    {homeCategories.map((cat) => (
                      <label
                        key={cat._id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={field.value?.includes(cat._id)}
                          onChange={(e) => {
                            const val = cat._id;
                            const set = new Set(field.value || []);
                            if (set.has(val)) set.delete(val);
                            else set.add(val);
                            field.onChange(Array.from(set));
                          }}
                        />
                        <span>{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Home Tool Tags</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-1 gap-3 border rounded  p-3 h-[300px] bg-white dark:bg-gray-900 overflow-y-auto">
                    {homeTags.map((tag) => (
                      <label
                        key={tag._id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={field.value?.includes(tag._id)}
                          onChange={(e) => {
                            const val = tag._id;
                            const set = new Set(field.value || []);
                            if (set.has(val)) set.delete(val);
                            else set.add(val);
                            field.onChange(Array.from(set));
                          }}
                        />
                        <span>{tag.name}</span>
                      </label>
                    ))}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* YOAST SEO SECTION & NEW IMAGE FIELDS */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Yoast SEO & Visual Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              {/* SEO Text Fields */}
              <div className="flex-1 space-y-4">
                <FormField
                  control={control}
                  name="seo_keyphrase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Focus Keyphrase</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="seo_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SEO Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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
                        <Textarea maxLength={160} rows={3} {...field} />
                      </FormControl>
                      <FormDescription className="text-right">
                        {field.value?.length || 0} / 160
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>

              {/* IMAGES GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 justify-center justify-items-center gap-6">
                <div className="space-y-2">
                  <FormItem>
                    <FormLabel>Tool Icon</FormLabel>
                    <div
                      className="flex flex-col items-center justify-center gap-2 w-[250px] h-[250px]  rounded-md border-2 border-dashed border-gray-300 hover:border-primary text-gray-500 transition-colors cursor-pointer relative"
                      onClick={() => toolIconInputRef.current?.click()}
                    >
                      <Input
                        type="file"
                        ref={toolIconInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handleUpload(e.target.files[0], "icon")
                        }
                      />

                      {watch("icon") ? (
                        <div className="relative">
                          <img
                            src={watch("icon")}
                            alt="icon"
                            // className="h-16 w-16 rounded-md border object-cover"
                            className="w-[200px] h-[200px] object-cover border"
                          />
                          <button
                            type="button"
                            className="absolute -top-2 -right-2 py-0.5 px-1.5 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setValue("icon", "", { shouldDirty: true });
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        // <>
                        //   {isUploadingToolIcon ? (
                        //     <Loader2 className="animate-spin" />
                        //   ) : (
                        //     <UploadCloud />
                        //   )}
                        //   <p className="text-xs">Click to upload icon</p>
                        // </>
                        <div className="flex flex-col items-center justify-center h-full w-full">
                          {uploadingField === "icon" ? (
                            <Loader2 className="animate-spin text-primary h-8 w-8" />
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <UploadCloud className="h-8 w-8" />
                              <p className="text-xs text-center">
                                Click to upload icon
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </FormItem>
                </div>
                {/* 1. Main Cover Image */}
                <div className="space-y-2">
                  <FormItem>
                    <FormLabel>Cover Image</FormLabel>
                    <div
                      className="flex flex-col items-center justify-center gap-2 w-[250px] h-[250px]  rounded-md border-2 border-dashed border-gray-300 hover:border-primary text-gray-500 transition-colors cursor-pointer relative"
                      onClick={() => coverImageInputRef.current?.click()}
                    >
                      <Input
                        id="cover_image"
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg"
                        className="hidden"
                        ref={coverImageInputRef}
                        onChange={(e) =>
                          handleImageUploadWrapper(e, "cover_image")
                        }
                      />
                      {watch("cover_image") ? (
                        <div
                          // className="relative w-[300px] h-[300px]  mt-2 rounded-md overflow-hidden cursor-pointer"
                          className="relative "
                          // onClick={() => coverImageInputRef.current?.click()}
                        >
                          <img
                            src={watch("cover_image")}
                            alt="Cover"
                            className="w-[200px] h-[200px] object-cover border"
                          />
                          <button
                            type="button"
                            // className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border shadow text-sm hover:bg-red-500 hover:text-white"
                            className="absolute -top-2 -right-2 py-0.5 px-1.5 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setValue("cover_image", "", {
                                shouldDirty: true,
                              });
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        // <div
                        //   className="flex items-center justify-center h-32 w-full mt-2 rounded-md border-2 border-dashed hover:border-primary cursor-pointer"
                        //   onClick={() => coverImageInputRef.current?.click()}
                        // >
                        //   <p className="text-center text-sm text-gray-500">
                        //     Upload Cover
                        //   </p>
                        // </div>
                        <div className="flex flex-col items-center justify-center h-full w-full">
                          {uploadingField === "cover_image" ? (
                            <Loader2 className="animate-spin text-primary h-8 w-8" />
                          ) : (
                            // <>
                            //   {/* I added flex-col to center the icon above the text */}
                            //   <div className="flex flex-col items-center gap-2">
                            //     <UploadCloud className="h-8 w-8" />
                            //     <p className="text-center text-sm text-gray-500">
                            //       Click to Upload Cover
                            //     </p>
                            //   </div>
                            // </>
                            <div className="flex flex-col items-center justify-center h-full w-full">
                              {uploadingField === "cover_image" ? (
                                <Loader2 className="animate-spin text-primary h-8 w-8" />
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <UploadCloud className="h-8 w-8" />
                                  <p className="text-xs text-center">
                                    Click to upload icon
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </FormItem>
                </div>

                {/* 2. Tool Cover Image */}
                <div className="space-y-2">
                  <FormItem>
                    <FormLabel>Tool Cover Image</FormLabel>
                    <div
                      className="flex flex-col items-center justify-center gap-2 w-[250px] h-[250px]  rounded-md border-2 border-dashed border-gray-300 hover:border-primary text-gray-500 transition-colors cursor-pointer relative"
                      onClick={() => toolCoverInputRef.current?.click()}
                    >
                      <Input
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg"
                        className="hidden"
                        ref={toolCoverInputRef}
                        onChange={(e) =>
                          handleImageUploadWrapper(e, "tool_cover_image")
                        }
                      />
                      {watch("tool_cover_image") ? (
                        <div
                          className="relative  "
                          // className="relative w-[250px] h-[250px]  mt-2 rounded-md overflow-hidden cursor-pointer"
                          // onClick={() => toolCoverInputRef.current?.click()}
                        >
                          <img
                            src={watch("tool_cover_image")}
                            alt="Tool Cover"
                            className="w-[200px] h-[200px] object-cover border"
                          />
                          <button
                            type="button"
                            // className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border shadow text-sm hover:bg-red-500 hover:text-white"
                            className="absolute -top-2 -right-2 py-0.5 px-1.5 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setValue("tool_cover_image", "", {
                                shouldDirty: true,
                              });
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        // <div
                        //   className="flex items-center justify-center h-32 w-full mt-2 rounded-md border-2 border-dashed hover:border-primary cursor-pointer"
                        //   onClick={() => toolCoverInputRef.current?.click()}
                        // >
                        //   <p className="text-center text-sm text-gray-500">
                        //     Tool Cover
                        //   </p>
                        // </div>
                        <div className="flex flex-col items-center justify-center h-full w-full">
                          {uploadingField === "tool_cover_image" ? (
                            <Loader2 className="animate-spin text-primary h-8 w-8" />
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <UploadCloud className="h-8 w-8" />
                              <p className="text-center text-sm text-gray-500">
                                Click to Upload Tool Cover
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </FormItem>
                </div>

                {/* 3. Tab Normal Icon */}
                <div className="space-y-2">
                  <FormItem>
                    <FormLabel>Tab Normal Icon</FormLabel>
                    <div
                      className="flex flex-col items-center justify-center gap-2 w-[250px] h-[250px]  rounded-md border-2 border-dashed bg-gray-100  border-gray-300 hover:border-primary text-gray-500 transition-colors cursor-pointer relative"
                      onClick={() => tabNormalInputRef.current?.click()}
                    >
                      <Input
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg"
                        className="hidden"
                        ref={tabNormalInputRef}
                        onChange={(e) =>
                          handleImageUploadWrapper(e, "tab_normal_icon_image")
                        }
                      />
                      {watch("tab_normal_icon_image") ? (
                        <div
                          // className="relative w-[250px] h-[250px]  mt-2 rounded-md overflow-hidden cursor-pointer flex items-center justify-center bg-gray-100"
                          className="relative "
                          // onClick={() => tabNormalInputRef.current?.click()}
                        >
                          <img
                            src={watch("tab_normal_icon_image")}
                            alt="Normal Icon"
                            // className="h-16 w-16 object-contain"
                            className="w-[200px] h-[200px] object-cover border"
                          />
                          <button
                            type="button"
                            // className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border shadow text-sm hover:bg-red-500 hover:text-white"
                            className="absolute -top-2 -right-2 py-0.5 px-1.5 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setValue("tab_normal_icon_image", "", {
                                shouldDirty: true,
                              });
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        // <div
                        //   className="flex items-center justify-center h-32 w-full mt-2 rounded-md border-2 border-dashed hover:border-primary cursor-pointer"
                        //   onClick={() => tabNormalInputRef.current?.click()}
                        // >
                        //   <p className="text-center text-sm text-gray-500">
                        //     Normal Icon
                        //   </p>
                        // </div>
                        <div className="flex flex-col items-center justify-center h-full w-full">
                          {uploadingField === "tab_normal_icon_image" ? (
                            <Loader2 className="animate-spin text-primary h-8 w-8" />
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <UploadCloud className="h-8 w-8" />
                              <p className="text-center text-sm text-gray-500">
                                Click to Upload Normal Icon
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </FormItem>
                </div>

                {/* 4. Tab Active Icon */}
                <div className="space-y-2">
                  <FormItem>
                    <FormLabel>Tab Active Icon</FormLabel>
                    <div
                      className="flex flex-col items-center justify-center gap-2 w-[250px] h-[250px]  rounded-md border-2 border-dashed bg-gray-100  border-gray-300 hover:border-primary text-gray-500 transition-colors cursor-pointer relative"
                      onClick={() => tabActiveInputRef.current?.click()}
                    >
                      <Input
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg"
                        className="hidden"
                        ref={tabActiveInputRef}
                        onChange={(e) =>
                          handleImageUploadWrapper(e, "tab_active_icon_image")
                        }
                      />
                      {watch("tab_active_icon_image") ? (
                        <div
                          // className="relative w-[250px] h-[250px]  mt-2 rounded-md overflow-hidden cursor-pointer flex items-center justify-center bg-gray-100"
                          className="relative"
                          // onClick={() => tabActiveInputRef.current?.click()}
                        >
                          <img
                            src={watch("tab_active_icon_image")}
                            alt="Active Icon"
                            // className="h-16 w-16 object-contain"
                            className="w-[200px] h-[200px] object-cover border"
                          />
                          <button
                            type="button"
                            // className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border shadow text-sm hover:bg-red-500 hover:text-white"
                            className="absolute -top-2 -right-2 py-0.5 px-1.5 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setValue("tab_active_icon_image", "", {
                                shouldDirty: true,
                              });
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        // <div
                        //   className="flex items-center justify-center h-32 w-full mt-2 rounded-md border-2 border-dashed hover:border-primary cursor-pointer"
                        //   onClick={() => tabActiveInputRef.current?.click()}
                        // >
                        //   <p className="text-center text-sm text-gray-500">
                        //     Active Icon
                        //   </p>
                        // </div>
                        <div className="flex flex-col items-center justify-center h-full w-full">
                          {uploadingField === "tab_active_icon_image" ? (
                            <Loader2 className="animate-spin text-primary h-8 w-8" />
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <UploadCloud className="h-8 w-8" />
                              <p className="text-center text-sm text-gray-500">
                                Click to Upload Active Icon
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </FormItem>
                </div>

                {/* 5. Tab Image */}
                {/* <div className="space-y-2">
                  <FormItem>
                    <FormLabel>Tab Image</FormLabel>
                    <Input
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg"
                      className="hidden"
                      ref={tabImageInputRef}
                      onChange={(e) => handleImageUploadWrapper(e, "tab_image")}
                    />
                    {watch("tab_image") ? (
                      <div
                        className="relative w-full h-32 mt-2 rounded-md overflow-hidden cursor-pointer"
                        onClick={() => tabImageInputRef.current?.click()}
                      >
                        <img
                          src={watch("tab_image")}
                          alt="Tab Img"
                          className="w-full h-full object-cover border"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border shadow text-sm hover:bg-red-500 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            setValue("tab_image", "", { shouldDirty: true });
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-center h-32 w-full mt-2 rounded-md border-2 border-dashed hover:border-primary cursor-pointer"
                        onClick={() => tabImageInputRef.current?.click()}
                      >
                        <p className="text-center text-sm text-gray-500">
                          Tab Image
                        </p>
                      </div>
                    )}
                  </FormItem>
                </div> */}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3 pt-4">
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
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
            {initialData ? "Save Changes" : "Create Tool"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
