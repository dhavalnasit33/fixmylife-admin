"use client";

import type { SubmitHandler } from "react-hook-form";
import { useForm, useFieldArray, Controller } from "react-hook-form";
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
import {
  Trash2,
  PlusCircle,
  UploadCloud,
  Loader2,
  Quote,
  Code2,
  Minus,
  Link2,
  Undo,
  Redo,
} from "lucide-react";
import type {
  ToolFormValues,
  ToolCategory,
  SuggestedTopicFormValues,
  ToolFieldFormValues,
  AIProviderConfig,
  AIModel,
} from "@/types";
import { toolSchema } from "@/types";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { TiptapEditorNoSSR } from "@/components/shared/TiptapEditor";
import { deleteImage, uploadFileToServer } from "@/lib/utils";

const fieldTypes: ToolFieldFormValues["type"][] = [
  "textbox",
  "textarea",
  "dropdown",
  "radio",
  "checkbox",
  "number",
  "date",
  "fileupload",
];

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

const CLOUDINARY_CLOUD_NAME = "dyk7nqgkv";
const CLOUDINARY_UPLOAD_PRESET = "openchatAI";

interface ToolFormProps {
  initialData?: ToolFormValues & { _id?: string };
  toolCategories: ToolCategory[];
  aiProviderConfigs: AIProviderConfig[];
  aiModels: AIModel[];
  onSubmit: (values: ToolFormValues) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
}

export default function ToolForm({
  initialData,
  toolCategories,
  aiProviderConfigs,
  aiModels,
  onSubmit,
  isSubmitting,
  onCancel,
}: ToolFormProps) {
  const { toast } = useToast();
  const [isUploadingToolIcon, setIsUploadingToolIcon] = useState(false);
  const toolIconInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = React.useRef<HTMLInputElement>(null);
  const [editVersion, setEditVersion] = useState(0);
  const [preview, setPreview] = useState(false);
  const MAX_META_DESCRIPTION_LENGTH = 160;

  const [selectedProviderInternalName, setSelectedProviderInternalName] =
    useState<string | undefined>(undefined);

  const form = useForm<ToolFormValues>({
    resolver: zodResolver(toolSchema),
  });
  const {
    control,
    reset: formReset,
    setValue: formSetValue,
    getValues: formGetValues,
    watch: formWatch,
  } = form;

  const {
    fields: tabFields,
    append: appendTab,
    remove: removeTab,
    update: updateTab,
  } = useFieldArray({
    control: form.control,
    name: "tabs",
  });

  const {
    fields: suggestedTopicFields,
    append: appendSuggestedTopic,
    remove: removeSuggestedTopic,
  } = useFieldArray({
    control: form.control,
    name: "suggested_topics",
  });

  const activeProviderConfigs = useMemo(
    () => (aiProviderConfigs || []).filter((p) => p.is_active),
    [aiProviderConfigs]
  );

  const modelsForSelectedProvider = useMemo(() => {
    if (!selectedProviderInternalName || !aiModels || !activeProviderConfigs)
      return [];
    const providerConfig = activeProviderConfigs.find(
      (p) => p.name === selectedProviderInternalName
    );
    if (!providerConfig) return [];
    return aiModels.filter(
      (m) =>
        (typeof m.ai_provider_id === "string"
          ? m.ai_provider_id
          : m.ai_provider_id._id) === providerConfig._id && m.is_active
    );
  }, [selectedProviderInternalName, aiModels, activeProviderConfigs]);

  useEffect(() => {
    setEditVersion((v) => v + 1);
  }, [initialData?._id]);

  // The single, authoritative useEffect for form initialization.
  useEffect(() => {
    // EDIT MODE: All data must be present.
    if (
      initialData?._id &&
      aiModels.length > 0 &&
      activeProviderConfigs.length > 0
    ) {
      // Adjust initialData to replace category_id with category_id array for formReset
      const adjustedInitialData = {
        ...initialData,
        category_id: Array.isArray(initialData.category_id)
          ? initialData.category_id.map(String)
          : initialData.category_id
          ? [String(initialData.category_id)]
          : [],
      } as ToolFormValues;
      formReset(adjustedInitialData);

      const model = aiModels.find((m) => m._id === initialData.ai_model_id);
      if (model) {
        const providerId =
          typeof model.ai_provider_id === "object"
            ? model.ai_provider_id._id
            : model.ai_provider_id;
        const providerConfig = activeProviderConfigs.find(
          (p) => p._id === providerId
        );
        if (providerConfig) {
          setSelectedProviderInternalName(providerConfig.name);
        }
      }
    }
    // CREATE MODE: Set default provider and model.
    else if (
      !initialData?._id &&
      activeProviderConfigs.length > 0 &&
      aiModels.length > 0
    ) {
      let defaultModelId = "";
      let defaultProviderName: string | undefined = undefined;

      const defaultProvider = activeProviderConfigs.find(
        (p) => p.name === "openai"
      );

      if (defaultProvider) {
        defaultProviderName = defaultProvider.name;
        // Find the default model 'gpt-4.1' under the 'openai' provider.
        const defaultModel = aiModels.find((m) => {
          const providerId =
            typeof m.ai_provider_id === "object"
              ? m.ai_provider_id._id
              : m.ai_provider_id;
          return m.model === "gpt-5-mini" && providerId === defaultProvider._id;
        });

        if (defaultModel) {
          defaultModelId = defaultModel._id;
        }
      }

      formReset({
        name: "",
        description: "",
        icon: "",
        category_id: toolCategories.length > 0 ? [toolCategories[0]._id] : [],
        ai_model_id: defaultModelId,
        system_prompt_template: "",
        is_active: true,
        tabs: [],
        suggested_topics: [],
      });
      setSelectedProviderInternalName(defaultProviderName);
    }
  }, [initialData, aiModels, activeProviderConfigs, toolCategories, formReset]);

  const handleProviderChange = (newProviderName: string) => {
    setSelectedProviderInternalName(newProviderName);
    const providerConfig = activeProviderConfigs.find(
      (p) => p.name === newProviderName
    );
    if (providerConfig) {
      const modelsForNewProvider = aiModels.filter(
        (m) =>
          (typeof m.ai_provider_id === "string"
            ? m.ai_provider_id
            : m.ai_provider_id._id) === providerConfig._id && m.is_active
      );
      formSetValue("ai_model_id", modelsForNewProvider[0]?._id || "", {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else {
      formSetValue("ai_model_id", "", {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  // Auto-generate Field Keys from Labels & Tab Prompt Template from its fields
  useEffect(() => {
    const subscription = formWatch((value, { name, type }) => {
      if (
        (name &&
          name.startsWith("tabs.") &&
          (name.endsWith(".label") ||
            name.endsWith(".field_prompt_template"))) ||
        (type === "change" && name === "tabs")
      ) {
        const currentTabs = formGetValues("tabs");
        if (!Array.isArray(currentTabs)) return;

        currentTabs.forEach((tab, tabIndex) => {
          if (!tab || !Array.isArray(tab.fields)) return;

          tab.fields.forEach((field, fieldIndex) => {
            if (field && typeof field.label === "string") {
              const currentLabel = field.label;
              const currentKey = field.key;
              const newKey = slugify(currentLabel);
              if (newKey && newKey !== currentKey) {
                formSetValue(
                  `tabs.${tabIndex}.fields.${fieldIndex}.key`,
                  newKey,
                  { shouldDirty: true }
                );
              }
            }
          });

          const possiblyUpdatedFields = formGetValues(
            `tabs.${tabIndex}.fields`
          );
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
              formGetValues(`tabs.${tabIndex}.prompt_template`) !== newTabPrompt
            ) {
              formSetValue(`tabs.${tabIndex}.prompt_template`, newTabPrompt, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }
          }
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [formWatch, formGetValues, formSetValue]);

  // const handleToolIconUpload = async (
  //   event: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;
  //   setIsUploadingToolIcon(true);
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
  //       formSetValue("icon", data.secure_url, {
  //         shouldDirty: true,
  //         shouldValidate: true,
  //       });
  //       toast({ title: "Icon Uploaded" });
  //     } else {
  //       throw new Error(data.error?.message || "Cloudinary icon upload failed");
  //     }
  //   } catch (error: any) {
  //     toast({
  //       title: "Upload Failed",
  //       description: error.message,
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsUploadingToolIcon(false);
  //     if (toolIconInputRef.current) toolIconInputRef.current.value = "";
  //   }
  // };

  // const allowedTypes = [
  //   "image/png",
  //   "image/jpeg",
  //   "image/jpg",
  //   "image/svg+xml",
  // ];

  // const handleCoverImageUpload = async (
  //   event: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;

  //   if (!allowedTypes.includes(file.type)) {
  //     toast({
  //       title: "Invalid file type",
  //       description: "Only PNG, JPG, and SVG images are allowed.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   setPreview(true);
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
  //       formSetValue("cover_image", data.secure_url, {
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
  //     setPreview(false);
  //     if (coverImageInputRef.current) coverImageInputRef.current.value = "";
  //   }
  // };

  const handleToolIconUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingToolIcon(true);

    try {
      // Upload to server instead of direct Cloudinary
      const uploadedUrl = await uploadFileToServer(file, "tool");

      formSetValue("icon", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });

      toast({ title: "Icon Uploaded" });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload icon.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingToolIcon(false);
      if (toolIconInputRef.current) toolIconInputRef.current.value = "";
    }
  };

  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/svg+xml",
  ];

  const handleCoverImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only PNG, JPG, and SVG images are allowed.",
        variant: "destructive",
      });
      return;
    }

    setPreview(true);

    try {
      // Upload to server instead of direct Cloudinary
      const uploadedUrl = await uploadFileToServer(file, "tool");

      formSetValue("cover_image", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });

      toast({ title: "Cover image uploaded" });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload cover image.",
        variant: "destructive",
      });
    } finally {
      setPreview(false);
      if (coverImageInputRef.current) coverImageInputRef.current.value = "";
    }
  };

  const handleSubmitInternal: SubmitHandler<ToolFormValues> = async (data) => {
    const processedData = {
      ...data,
      tabs: Array.isArray(data.tabs)
        ? data.tabs.map((tab) => ({
            ...tab,
            fields: Array.isArray(tab.fields)
              ? tab.fields.map((field) => ({
                  ...field,
                  key: field.key || slugify(field.label),
                }))
              : [],
          }))
        : [],
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

  const addNewField = (tabIndex: number) => {
    const currentTabs = formGetValues("tabs");
    if (!Array.isArray(currentTabs) || !currentTabs[tabIndex]) return;
    const newFieldLabel = `New Field ${
      (currentTabs[tabIndex].fields?.length || 0) + 1
    }`;
    const newFieldKey = slugify(newFieldLabel);
    const newField: ToolFieldFormValues = {
      key: newFieldKey,
      label: newFieldLabel,
      type: "textarea",
      required: false,
      placeholder: "",
      description: "",
      options: [],
      field_prompt_template: "",
    };
    updateTab(tabIndex, {
      ...currentTabs[tabIndex],
      fields: [...(currentTabs[tabIndex].fields || []), newField],
    });
  };
  const removeField = (tabIndex: number, fieldIndex: number) => {
    const currentTabs = formGetValues("tabs");
    if (
      !Array.isArray(currentTabs) ||
      !currentTabs[tabIndex] ||
      !Array.isArray(currentTabs[tabIndex].fields)
    )
      return;
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

  const isButtonDisabled = isSubmitting || isUploadingToolIcon;

  return (
    <Form {...form} key={editVersion}>
      <form
        onSubmit={form.handleSubmit(handleSubmitInternal)}
        className="space-y-8"
      >
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              {/* Tool Name */}
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-dark dark:text-gray-200">
                        Tool Name
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
              </div>

              {/* Short Description */}
              <div className="flex-1">
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
                          placeholder="e.g., Creates blog posts using AI"
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-dark dark:text-gray-200">
                    Tool Description
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div className="flex flex-col gap-4">
                <FormItem>
                  <FormLabel className="text-dark dark:text-gray-200">
                    Tool Icon
                  </FormLabel>
                  <div
                    className="flex flex-col items-center justify-center gap-2 w-full h-32 rounded-md border-2 border-dashed border-gray-300 hover:border-primary text-gray-500 transition-colors cursor-pointer relative"
                    onClick={() => toolIconInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        handleToolIconUpload({
                          target: { files: [file] },
                        } as any);
                      }
                    }}
                  >
                    {/* Hidden file input */}
                    <Input
                      id="toolIconInput"
                      type="file"
                      accept="image/*,.svg"
                      className="hidden"
                      ref={toolIconInputRef}
                      onChange={handleToolIconUpload}
                      disabled={isButtonDisabled}
                    />

                    {/* If icon uploaded → preview */}
                    {formWatch("icon") ? (
                      <div className="relative">
                        <img
                          src={formWatch("icon")}
                          alt="Tool Icon Preview"
                          className="h-16 w-16 rounded-md border object-cover"
                        />
                        <button
                          type="button"
                          className="absolute -top-2 -right-2 py-0.5 px-1.5 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-xs"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const url = formWatch("icon");
                            if (url) {
                              try {
                                await deleteImage(url);
                                formSetValue("icon", "", {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                                if (toolIconInputRef.current) {
                                  toolIconInputRef.current.value = "";
                                }
                              } catch (err) {
                                console.error("Failed to delete icon:", err);
                              }
                            }
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        {isUploadingToolIcon ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <UploadCloud className="h-6 w-6" />
                        )}
                        <p className="text-xs">
                          Drag & drop an icon here or click to upload
                        </p>
                      </>
                    )}
                  </div>

                  {/* Hidden field for RHF */}
                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormControl>
                        <input
                          type="hidden"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                    )}
                  />
                  <FormMessage>
                    {form.formState.errors.icon?.message}
                  </FormMessage>
                </FormItem>

                <FormItem>
                  <FormLabel className="text-dark dark:text-gray-200">
                    AI Provider (Internal Name)
                  </FormLabel>
                  <Select
                    value={selectedProviderInternalName || ""}
                    onValueChange={handleProviderChange}
                    disabled={
                      activeProviderConfigs.length === 0 || isButtonDisabled
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            activeProviderConfigs.length === 0
                              ? "No active providers"
                              : "Select Provider Config"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeProviderConfigs.map((p) => (
                        <SelectItem key={p._id} value={p.name}>
                          {p.display_name} ({p.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
                <FormField
                  control={form.control}
                  name="ai_model_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-dark dark:text-gray-200">
                        AI Model
                      </FormLabel>
                      <Select
                        key={
                          selectedProviderInternalName || "provider_unselected"
                        }
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        disabled={
                          !selectedProviderInternalName ||
                          modelsForSelectedProvider.length === 0 ||
                          isButtonDisabled
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                !selectedProviderInternalName
                                  ? "Select provider config first"
                                  : modelsForSelectedProvider.length === 0
                                  ? "No models for provider"
                                  : "Select Model"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {modelsForSelectedProvider.map((model) => (
                            <SelectItem key={model._id} value={model._id}>
                              {model.model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Replace single select with checkbox tree for multiple  */}
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => {
                  // Build tree structure from flat categories
                  type CategoryNode = ToolCategory & {
                    children?: CategoryNode[];
                  };
                  const buildTree = (
                    categories: ToolCategory[]
                  ): CategoryNode[] => {
                    const map = new Map<string, CategoryNode>();
                    const roots: CategoryNode[] = [];

                    // Initialize map
                    categories.forEach((cat) => {
                      map.set(cat._id, { ...cat, children: [] });
                    });

                    categories.forEach((cat) => {
                      const node = map.get(cat._id);
                      const parentId =
                        typeof cat.parent === "object" && cat.parent?._id
                          ? cat.parent._id
                          : typeof cat.parent === "string"
                          ? cat.parent
                          : null;

                      if (parentId && map.has(parentId)) {
                        map.get(parentId)!.children!.push(node!);
                      } else {
                        roots.push(node!);
                      }
                    });

                    return roots;
                  };

                  const tree = buildTree(toolCategories);

                  // State for selected category ids
                  const [selectedIds, setSelectedIds] = React.useState<
                    string[]
                  >(field.value || []);

                  // Helper to get all descendant ids of a node
                  const getAllDescendantIds = (
                    node: CategoryNode
                  ): string[] => {
                    let ids: string[] = [];
                    if (node.children && node.children.length > 0) {
                      node.children.forEach((child) => {
                        ids.push(child._id);
                        ids = ids.concat(getAllDescendantIds(child));
                      });
                    }
                    return ids;
                  };
                  // Handle checkbox change
                  const onCheckboxChange = (
                    node: CategoryNode,
                    checked: boolean
                  ) => {
                    let newSelected = new Set(selectedIds);

                    const getParentId = (node: CategoryNode): string | null => {
                      if (typeof node.parent === "string") return node.parent;
                      if (typeof node.parent === "object" && node.parent?._id)
                        return node.parent._id;
                      return null;
                    };

                    const getAllAncestors = (node: CategoryNode): string[] => {
                      const ancestors: string[] = [];
                      let currentNode = node;
                      while (true) {
                        const parentId = getParentId(currentNode);
                        if (!parentId) break;
                        ancestors.push(parentId);
                        const parent = toolCategories.find(
                          (c) => c._id === parentId
                        );
                        if (!parent) break;
                        currentNode = parent as CategoryNode;
                      }
                      return ancestors;
                    };

                    const getAllDescendants = (
                      node: CategoryNode
                    ): string[] => {
                      let ids: string[] = [];
                      if (node.children && node.children.length > 0) {
                        node.children.forEach((child) => {
                          ids.push(child._id);
                          ids = ids.concat(getAllDescendants(child));
                        });
                      }
                      return ids;
                    };

                    if (checked) {
                      // Select this node
                      newSelected.add(node._id);
                      // Select all ancestors
                      getAllAncestors(node).forEach((id) =>
                        newSelected.add(id)
                      );
                      // Select all descendants
                      getAllDescendants(node).forEach((id) =>
                        newSelected.add(id)
                      );
                    } else {
                      // Unselect this node
                      newSelected.delete(node._id);
                      // Unselect all descendants
                      getAllDescendants(node).forEach((id) =>
                        newSelected.delete(id)
                      );
                      // Unselect parent if it has no other selected children
                      const ancestors = getAllAncestors(node);
                      ancestors.forEach((parentId) => {
                        const parent = toolCategories.find(
                          (c) => c._id === parentId
                        );
                        if (!parent) return;
                        const siblings = toolCategories.filter(
                          (c) => (c as any).parent === parent.name
                        );
                        const anySiblingSelected = siblings.some((sibling) =>
                          newSelected.has(sibling._id)
                        );
                        if (!anySiblingSelected) {
                          newSelected.delete(parentId);
                        }
                      });
                    }

                    const result = Array.from(newSelected);
                    setSelectedIds(result);
                    field.onChange(result);
                  };

                  // Recursive render tree
                  const renderTree = (nodes: CategoryNode[]) => {
                    return nodes.map((node) => {
                      const isChecked = selectedIds.includes(node._id);
                      return (
                        <div key={node._id} className="ml-4">
                          <label className="inline-flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) =>
                                onCheckboxChange(node, e.target.checked)
                              }
                            />
                            <span>{node.name}</span>
                          </label>
                          {node.children && node.children.length > 0 && (
                            <div className="ml-6 border-l pl-2 mt-1">
                              {renderTree(node.children)}
                            </div>
                          )}
                        </div>
                      );
                    });
                  };

                  return (
                    <FormItem>
                      <FormLabel className="text-dark dark:text-gray-200">
                        Categories
                      </FormLabel>
                      <FormControl>
                        {toolCategories.length === 0 ? (
                          <p>No categories available</p>
                        ) : (
                          <div className="max-h-60 overflow-auto border rounded p-2">
                            {renderTree(tree)}
                          </div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
            <FormField
              control={form.control}
              name="system_prompt_template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-dark dark:text-gray-200">
                    Overall System Prompt Template
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="e.g., You are a helpful AI assistant..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  {/* <FormDescription>{"Use Handlebars syntax like '{{field_key}}' from any tab if needed globally."}</FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-dark dark:text-gray-200">
                      Active Status
                    </FormLabel>
                    <FormDescription>
                      Is this tool currently usable?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isButtonDisabled}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
    

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold font-headline">
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
          {Array.isArray(tabFields) && tabFields.length === 0 && (
            <Card className="p-6 text-center text-muted-foreground">
              Optionally, click "Add Tab" to configure input fields for this
              tool.
            </Card>
          )}
          {Array.isArray(tabFields) &&
            tabFields.map((tabItem, tabIndex) => (
              <Card key={tabItem.id} className="border-l-4 border-primary/50">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <FormField
                      control={form.control}
                      name={`tabs.${tabIndex}.title`}
                      render={({ field }) => (
                        <FormItem className="flex-grow mr-4">
                          <FormLabel className="sr-only text-dark dark:text-gray-200">
                            Tab Title
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={`Tab ${tabIndex + 1} Title`}
                              {...field}
                              value={field.value || ""}
                              className="text-lg font-semibold"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTab(tabIndex)}
                      disabled={
                        !Array.isArray(tabFields) ||
                        tabFields.length === 0 ||
                        isButtonDisabled
                      }
                      className="h-8 w-8 rounded-full border border-red-500 text-red-500 bg-white
                               hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name={`tabs.${tabIndex}.description`}
                    render={({ field }) => (
                      <FormItem className="mt-2">
                        <FormLabel className="text-dark dark:text-gray-200">
                          Tab Description (Optional)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            rows={2}
                            placeholder="Briefly describe this tab's purpose..."
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
                    name={`tabs.${tabIndex}.prompt_template`}
                    render={({ field }) => (
                      <FormItem className="mt-2">
                        <FormLabel className="text-dark dark:text-gray-200">
                          Tab Prompt Template (Auto-Generated)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            {...field}
                            value={field.value || ""}
                            readOnly
                            className="bg-muted/50 cursor-not-allowed"
                          />
                        </FormControl>
                        <FormDescription>
                          This prompt is automatically generated from field
                          prompts below.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="text-md font-semibold text-muted-foreground mb-2">
                    Fields for Tab: {formWatch(`tabs.${tabIndex}.title`)}
                  </h4>
                  {Array.isArray(formWatch(`tabs.${tabIndex}.fields`)) &&
                    (formWatch(`tabs.${tabIndex}.fields`) || []).map(
                      (fieldData, fieldIndex) => (
                        <Card
                          key={`${tabItem.id}-field-${fieldIndex}`}
                          className="p-4 bg-muted/30 space-y-3"
                        >
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-medium text-primary">
                              Field {fieldIndex + 1} (Key:{" "}
                              {formWatch(
                                `tabs.${tabIndex}.fields.${fieldIndex}.key`
                              )}
                              )
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeField(tabIndex, fieldIndex)}
                              disabled={
                                !Array.isArray(
                                  formGetValues(`tabs.${tabIndex}.fields`)
                                ) ||
                                (formGetValues(`tabs.${tabIndex}.fields`) || [])
                                  .length === 0 ||
                                isButtonDisabled
                              }
                              className="h-8 w-8 rounded-full border border-red-500 text-red-500 bg-white
                               hover:bg-red-500 hover:text-white"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`tabs.${tabIndex}.fields.${fieldIndex}.label`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-dark dark:text-gray-200">
                                    Field Label
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., Blog Topic"
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Key auto-generates.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`tabs.${tabIndex}.fields.${fieldIndex}.type`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-dark dark:text-gray-200">
                                    Field Type
                                  </FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {fieldTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                          {type.charAt(0).toUpperCase() +
                                            type.slice(1)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name={`tabs.${tabIndex}.fields.${fieldIndex}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-dark dark:text-gray-200">
                                  Field Question
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., Explain to user"
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
                            name={`tabs.${tabIndex}.fields.${fieldIndex}.placeholder`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-dark dark:text-gray-200">
                                  Placeholder (Optional)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., Enter main topic..."
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {(formWatch(
                            `tabs.${tabIndex}.fields.${fieldIndex}.type`
                          ) === "dropdown" ||
                            formWatch(
                              `tabs.${tabIndex}.fields.${fieldIndex}.type`
                            ) === "radio" ||
                            formWatch(
                              `tabs.${tabIndex}.fields.${fieldIndex}.type`
                            ) === "checkbox") && (
                            <FormField
                              control={form.control}
                              name={`tabs.${tabIndex}.fields.${fieldIndex}.options`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-dark dark:text-gray-200">
                                    Options (Comma-separated)
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="e.g., Opt1, Opt2"
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                          <FormField
                            control={form.control}
                            name={`tabs.${tabIndex}.fields.${fieldIndex}.field_prompt_template`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-dark dark:text-gray-200">
                                  Prompt for this Field
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    rows={2}
                                    placeholder="e.g., The topic is"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                {/* <FormDescription>System appends <code className="bg-muted px-1 rounded text-xs">{'{{'}{formWatch(`tabs.${tabIndex}.fields.${fieldIndex}.key`,'this_field_key')}{'}}'}</code>.</FormDescription> */}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`tabs.${tabIndex}.fields.${fieldIndex}.required`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-2 md:mt-0">
                                <FormLabel className="text-dark dark:text-gray-200">
                                  Required?
                                </FormLabel>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isButtonDisabled}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </Card>
                      )
                    )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addNewField(tabIndex)}
                    disabled={isButtonDisabled}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Field to This
                    Tab
                  </Button>
                </CardContent>
              </Card>
            ))}
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
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Suggested Topics (Optional)</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendSuggestedTopic({
                    title: "",
                    has_input: true,
                    input_placeholder: "",
                  })
                }
                disabled={isButtonDisabled}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Suggested Topic
              </Button>
            </div>
            {/* <FormDescription>Predefined prompts. Use the toggle to add a dynamic input field.</FormDescription> */}
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.isArray(suggestedTopicFields) &&
              suggestedTopicFields.map((item, index) => (
                <Card key={item.id} className="p-4 bg-muted/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-primary">
                      Suggested Topic {index + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSuggestedTopic(index)}
                      disabled={isButtonDisabled}
                    >
                      <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name={`suggested_topics.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        {/* <FormLabel>Title / Prompt Template</FormLabel> */}
                        <FormControl>
                          <Input
                            placeholder="e.g., Write a newsletter about..."
                            value={
                              field.value
                                ?.replace(/{{\s*user_input\s*}}/g, "")
                                .trim() || ""
                            }
                            onChange={(e) => {
                              const displayedValue = e.target.value;
                              const hasInput = form.getValues(
                                `suggested_topics.${index}.has_input`
                              );
                              const realValue = hasInput
                                ? `${displayedValue.trim()} {{user_input}}`
                                : displayedValue.trim();
                              field.onChange(realValue);
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            disabled={field.disabled}
                          />
                        </FormControl>
                        {/* <FormDescription>
                        {`Use the "Requires User Input?" toggle to add a dynamic field.`}
                      </FormDescription> */}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <FormField
                    control={form.control}
                    name={`suggested_topics.${index}.has_input`}
                    render={({ field: switchField }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <FormLabel>Requires User Input?</FormLabel>
                        <FormControl>
                          <Switch
                            checked={switchField.value}
                            onCheckedChange={(checked) => {
                              switchField.onChange(checked);
                              const titleField = `suggested_topics.${index}.title` as const;
                              let currentTitle = form.getValues(titleField).replace(/{{\s*user_input\s*}}/g, '').trim();
                              if (checked) {
                                form.setValue(titleField, `${currentTitle} {{user_input}}`, { shouldDirty: true });
                              } else {
                                form.setValue(titleField, currentTitle, { shouldDirty: true });
                              }
                            }}
                            disabled={isButtonDisabled}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {formWatch(`suggested_topics.${index}.has_input`) && (<FormField control={form.control} name={`suggested_topics.${index}.input_placeholder`} render={({ field }) => (<FormItem><FormLabel>Input Placeholder</FormLabel><FormControl><Input placeholder="e.g., Enter the main topic..." {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} /> )}
                </div> */}
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
                  input_placeholder: "",
                })
              }
              disabled={isButtonDisabled}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Suggested Topic
            </Button>
          </CardContent>
        </Card>
            <Card className="mt-6">
          <CardHeader>
            <CardTitle>Yoast SEO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left column: text fields */}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Focus keyphrase
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AI writing tool"
                    {...form.register("seo_keyphrase")}
                    className="w-full border px-3 py-2 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Best AI Writing Tool for Blogs"
                    {...form.register("seo_title")}
                    className="w-full border px-3 py-2 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Meta Description
                  </label>
                  <textarea
                    rows={3}
                    maxLength={MAX_META_DESCRIPTION_LENGTH}
                    placeholder="Brief description of the page for search engines"
                    {...form.register("meta_description")}
                    className="w-full border px-3 py-2 rounded-md"
                  />
                  <p className="text-sm text-muted-foreground mt-1 text-right">
                    {form.watch("meta_description")?.length || 0} /{" "}
                    {MAX_META_DESCRIPTION_LENGTH}
                  </p>
                </div>
              </div>

              {/* Right column: cover image upload */}
              <div className="w-full md:w-60 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Cover Image
                  </label>

                  {/* Hidden file input */}
                  <Input
                    id="cover_image"
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg"
                    className="hidden"
                    ref={coverImageInputRef}
                    onChange={handleCoverImageUpload}
                    disabled={isButtonDisabled}
                  />
                  {/* If image exists → show preview */}
                  {formWatch("cover_image") ? (
                    <div
                      className="relative w-full h-40 mt-2 rounded-md overflow-hidden"
                      onClick={() => coverImageInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          handleCoverImageUpload({
                            target: { files: [file] },
                          } as any);
                        }
                      }}
                    >
                      <img
                        src={formWatch("cover_image")}
                        alt="Cover image Preview"
                        className="w-full h-full object-cover border p-2 cursor-pointer"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering file picker
                          formSetValue("cover_image", "", {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          if (coverImageInputRef.current) {
                            coverImageInputRef.current.value = "";
                          }
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    /* If no image → show dropzone */
                    <div
                      className="flex items-center justify-center h-40 w-full mt-2 rounded-md border-2 border-dashed border-gray-300 text-gray-500 hover:border-primary transition-colors cursor-pointer"
                      onClick={() => coverImageInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          handleCoverImageUpload({
                            target: { files: [file] },
                          } as any);
                        }
                      }}
                    >
                      <p className="text-center text-sm text-gray-600">
                        Drag & Drop an image here or Click to Upload
                      </p>
                    </div>
                  )}
                </div>
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
            {isSubmitting
              ? initialData?._id
                ? "Saving..."
                : "Creating..."
              : initialData?._id
              ? "Save Changes"
              : "Create Tool"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
