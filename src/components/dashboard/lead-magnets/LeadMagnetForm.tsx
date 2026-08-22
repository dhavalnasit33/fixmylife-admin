"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PlusCircle,
  Trash2,
  UploadCloud,
  Loader2,
  Search,
  Check,
  X,
  Magnet,
} from "lucide-react";
import {
  leadMagnetSchema,
  type LeadMagnet,
  type LeadMagnetFormValues,
} from "@/types";
import { useToast } from "@/hooks/use-toast";
import { deleteImage, uploadFileToServer } from "@/lib/utils";
import apiService from "@/lib/apiService";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TiptapEditorNoSSR } from "@/components/shared/TiptapEditor";
import { Switch } from "@/components/ui/switch";
import { APP_URL } from "@/config";

interface LeadMagnetFormProps {
  initialData?: LeadMagnet;
  onSubmit: (values: LeadMagnetFormValues) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
  type?: "standard" | "alternative";
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-");
}

export default function LeadMagnetForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
  type = "standard",
}: LeadMagnetFormProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});
  const [toolSearch, setToolSearch] = useState("");
  const [availableTools, setAvailableTools] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingTools, setIsLoadingTools] = useState(false);

  const fileInputRefs = {
    featured_image: useRef<HTMLInputElement>(null),
    tab_normal_icon: useRef<HTMLInputElement>(null),
    tab_active_icon: useRef<HTMLInputElement>(null),
    tab_image: useRef<HTMLInputElement>(null),
  };

  const form = useForm<LeadMagnetFormValues>({
    resolver: zodResolver(leadMagnetSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          slug: initialData.slug,
          description: initialData.description || "",
          short_description: initialData.short_description || "",
          mini_description: initialData.mini_description || "",
          meta_title: initialData.meta_title || "",
          meta_description: initialData.meta_description || "",
          keyphrase: initialData.keyphrase || "",
          featured_image: initialData.featured_image || "",
          tab_normal_icon: initialData.tab_normal_icon || "",
          tab_active_icon: initialData.tab_active_icon || "",
          tab_image: initialData.tab_image || "",
          industry: initialData.industry || "General",
          cta_title:
            initialData.cta_title || "Access 100+ AI tools with OneChat AI",
          cta_description: initialData.cta_description || "",
          cta_button_text: initialData.cta_button_text || "Try Free",
          cta_button_link: initialData.cta_button_link || "/register",
          is_indexed: initialData.is_indexed ?? true,
          assigned_tools: initialData.assigned_tools.map((t: any) => ({
            itemId: t.itemId || t._id,
            modelName: t.modelName,
            sort_order: t.sort_order || 0,
          })),
          status: initialData.status,
          category_id:
            typeof initialData.category_id === "object"
              ? initialData.category_id?._id
              : initialData.category_id || "",
          type: initialData.type || type,
        }
      : {
          title: "",
          slug: "",
          description: "",
          short_description: "",
          mini_description: "",
          meta_title: "",
          meta_description: "",
          keyphrase: "",
          featured_image: "",
          tab_normal_icon: "",
          tab_active_icon: "",
          tab_image: "",
          industry: "General",
          cta_title: "Access 100+ AI tools with OneChat AI",
          cta_description: "",
          cta_button_text: "Try Free",
          cta_button_link: "/register",
          is_indexed: true,
          assigned_tools: [],
          status: "published",
          category_id: "",
          type: type,
        },
  });

  const { watch, setValue, control } = form;
  const assignedTools = watch("assigned_tools") || [];

  // Watch values for character counters
  const titleValue = watch("title") || "";
  const shortDescValue = watch("short_description") || "";
  const miniDescValue = watch("mini_description") || "";
  const metaTitleValue = watch("meta_title") || "";
  const metaDescValue = watch("meta_description") || "";
  const keyphraseValue = watch("keyphrase") || "";

  const fetchAllTools = useCallback(async () => {
    setIsLoadingTools(true);
    try {
      const response = await apiService<any>("/discover-tool");
      if (response.success) {
        setAvailableTools(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch tools", error);
    } finally {
      setIsLoadingTools(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiService<any>(
        `/lead-magnet-categories/all/active?type=${type}`,
      );
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  }, [type]);

  useEffect(() => {
    fetchAllTools();
    fetchCategories();
  }, [fetchAllTools, fetchCategories]);

  const categoryMapping: Record<string, string[]> = {
    writing: [
      "Email",
      "Paraphrase",
      "CheckGrammar",
      "SocialMedia",
      "ContentTranslator ",
      "BlogPost",
    ],
    career: [
      "CoverLetterGenerator",
      "ResumeGenerator",
      "InterviewPrep",
      "AiJobAutomationChecker",
    ],
    business: [
      "Marketing",
      "Research",
      "BusinessNameGenerator",
      "",
    ],
    finance: ["Investing", "FinancialAdvisor", "RetirementCalculator"],
    pages: ["Page"],
    marketing: ["MarketingTool"],
    otherTool: ["OtherTool"],
    // ai_providers: ["AIProviderComparison"],
    lead_magnets: ["LeadMagnet"],
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldName: keyof LeadMagnetFormValues,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading((prev) => ({ ...prev, [fieldName]: true }));
    try {
      const uploadedUrl = await uploadFileToServer(file, "lead-magnet");
      setValue(fieldName, uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast({
        title: "Upload Successful",
        description: `${fieldName} uploaded.`,
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload image.",
        variant: "destructive",
      });
    } finally {
      setIsUploading((prev) => ({ ...prev, [fieldName]: false }));
      if (fileInputRefs[fieldName as keyof typeof fileInputRefs]?.current) {
        fileInputRefs[fieldName as keyof typeof fileInputRefs]!.current!.value =
          "";
      }
    }
  };

  const handleRemoveImage = async (fieldName: keyof LeadMagnetFormValues) => {
    const url = watch(fieldName) as string;
    if (!url) return;

    try {
      await deleteImage(url);
      setValue(fieldName, "", { shouldDirty: true, shouldValidate: true });
    } catch (error) {
      console.error("Failed to delete image", error);
    }
  };

  const toggleToolSelection = (tool: any) => {
    const exists = assignedTools.find((t) => t.itemId === tool._id);
    if (exists) {
      setValue(
        "assigned_tools",
        assignedTools.filter((t) => t.itemId !== tool._id),
        { shouldDirty: true },
      );
    } else {
      setValue(
        "assigned_tools",
        [
          ...assignedTools,
          { itemId: tool._id, modelName: tool.model_name, sort_order: 0 },
        ],
        { shouldDirty: true },
      );
    }
  };

  const updateToolSortOrder = (itemId: string, sortOrder: number) => {
    setValue(
      "assigned_tools",
      assignedTools.map((t) =>
        t.itemId === itemId ? { ...t, sort_order: sortOrder } : t,
      ),
      { shouldDirty: true },
    );
  };

  const removeAssignedTool = (itemId: string) => {
    setValue(
      "assigned_tools",
      assignedTools.filter((t) => t.itemId !== itemId),
      { shouldDirty: true },
    );
  };

  const handleFormSubmit = (values: LeadMagnetFormValues) => {
    const rawSlug = slugify(values.slug || values.title || "");
    const finalSlug = rawSlug
      ? (type === "alternative"
        ? (rawSlug.endsWith("-alternatives") ? rawSlug : `${rawSlug}-alternatives`)
        : (rawSlug.startsWith("free-") ? rawSlug : `free-${rawSlug}`))
      : "";
    onSubmit({
      ...values,
      slug: finalSlug,
    });
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Basic Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={control}
                  name="mini_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Free AI Tools for Solopreneurs | OneChat AI"
                          {...field}
                          maxLength={200}
                        />
                      </FormControl>
                      <div className="text-right text-[10px] text-muted-foreground mt-1">
                        {miniDescValue.length} / 200
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tool Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Lead Magnet Title"
                          {...field}
                          maxLength={200}
                        />
                      </FormControl>
                      <div className="text-right text-[10px] text-muted-foreground mt-1">
                        {titleValue.length} / 200
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="slug"
                  render={({ field }) => {
                    const slugValue = watch("slug");
                    const titleValue = watch("title");
                    const rawSlug = slugify(slugValue || titleValue || "");
                    const finalSlug = rawSlug
                      ? (type === "alternative"
                        ? (rawSlug.endsWith("-alternatives") ? rawSlug : `${rawSlug}-alternatives`)
                        : (rawSlug.startsWith("free-") ? rawSlug : `free-${rawSlug}`))
                      : "";
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
                                // Automatically slugify as user types
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
                                  className="text-blue-600 hover:underline break-all"
                                  target="_blank"
                                >
                                  {permalink}
                                </a>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Leave empty to auto-generate from title.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={control}
                  name="short_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Brief catchphrase"
                          {...field}
                          maxLength={200}
                        />
                      </FormControl>
                      <div className="text-right text-[10px] text-muted-foreground mt-1">
                        {shortDescValue.length} / 200
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Description</FormLabel>
                      <FormControl>
                        <div className="border rounded-md p-2">
                          <TiptapEditorNoSSR
                            value={field.value || ""}
                            onChange={(value) => {
                              field.onChange(value);
                              setValue("description", value, {
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[
                              "Shopify",
                              "YouTube",
                              "Blogging",
                              "Marketing",
                              "Finance",
                              "Real Estate",
                              "General",
                            ].map((ind) => (
                              <SelectItem key={ind} value={ind}>
                                {ind}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat._id} value={cat._id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Call to Action Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={control}
                  name="cta_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CTA Title</FormLabel>
                      <FormControl>
                        <Input placeholder="CTA Title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="cta_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CTA Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="CTA Description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="cta_button_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Button Text</FormLabel>
                        <FormControl>
                          <Input placeholder="Button Text" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="cta_button_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Button Link</FormLabel>
                        <FormControl>
                          <Input placeholder="Button Link" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assigned Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {assignedTools.map((t) => {
                    const toolInfo = availableTools.find(
                      (at) => at._id === t.itemId,
                    );
                    const displayName =
                      toolInfo?.title ||
                      toolInfo?.name ||
                      toolInfo?.page_title ||
                      t.itemId?.substring(0, 8) ||
                      "Unknown Tool";
                    return (
                      <div
                        key={t.itemId || Math.random().toString()}
                        className="flex items-center gap-2 bg-secondary p-1 pl-3 rounded-md border shadow-sm"
                      >
                        <span className="text-sm font-medium">
                          {displayName}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase">
                          ({t.modelName})
                        </span>
                        <div className="flex items-center gap-1 border-l pl-2 ml-1">
                          <span className="text-[10px] text-muted-foreground">
                            Order:
                          </span>
                          <Input
                            type="number"
                            className="h-6 w-12 text-[10px] p-1"
                            value={t.sort_order}
                            onChange={(e) =>
                              updateToolSortOrder(
                                t.itemId,
                                parseInt(e.target.value) || 0,
                              )
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => removeAssignedTool(t.itemId)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {assignedTools.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">
                      No tools assigned yet.
                    </p>
                  )}
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tools to assign..."
                    className="pl-8"
                    value={toolSearch}
                    onChange={(e) => setToolSearch(e.target.value)}
                  />
                </div>

                {isLoadingTools ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <ScrollArea className="h-96 border rounded-md p-4">
                    <div className="space-y-6">
                      {Object.entries(categoryMapping).map(
                        ([category, models]) => {
                          const filteredTools = availableTools.filter(
                            (tool) => {
                              if (!models.includes(tool.model_name))
                                return false;
                              if (!toolSearch) return true;
                              const search = toolSearch.toLowerCase();
                              return (
                                tool.title?.toLowerCase().includes(search) ||
                                tool.name?.toLowerCase().includes(search) ||
                                tool.page_title?.toLowerCase().includes(search)
                              );
                            },
                          );

                          if (filteredTools.length === 0) return null;

                          return (
                            <div key={category} className="space-y-2">
                              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
                                {category.replace("_", " ")}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {filteredTools.map((tool) => {
                                  const isSelected = assignedTools.some(
                                    (t) => t.itemId === tool._id,
                                  );
                                  return (
                                    <div
                                      key={tool._id}
                                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer border transition-colors ${
                                        isSelected
                                          ? "bg-primary/10 border-primary"
                                          : "hover:bg-muted border-transparent"
                                      }`}
                                      onClick={() => toggleToolSelection(tool)}
                                    >
                                      <div className="flex flex-col overflow-hidden">
                                        <span className="text-sm font-medium truncate">
                                          {tool.title ||
                                            tool.name ||
                                            tool.page_title}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground uppercase">
                                          {tool.model_name}
                                        </span>
                                      </div>
                                      {isSelected ? (
                                        <Check className="h-4 w-4 text-primary shrink-0" />
                                      ) : (
                                        <PlusCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={control}
                  name="meta_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="SEO Title"
                          {...field}
                          maxLength={200}
                        />
                      </FormControl>
                      <div className="text-right text-[10px] text-muted-foreground mt-1">
                        {metaTitleValue.length} / 200
                      </div>
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
                        <Textarea
                          placeholder="SEO Description"
                          {...field}
                          maxLength={500}
                        />
                      </FormControl>
                      <div className="text-right text-[10px] text-muted-foreground mt-1">
                        {metaDescValue.length} / 500
                      </div>
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
                        <Input
                          placeholder="Main keyword"
                          {...field}
                          maxLength={200}
                        />
                      </FormControl>
                      <div className="text-right text-[10px] text-muted-foreground mt-1">
                        {keyphraseValue.length} / 200
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="is_indexed"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Search Indexing</FormLabel>
                        <FormDescription>
                          Allow search engines to index this page.
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
              </CardContent>
            </Card>

            {/* Action Buttons below main content */}
            <div className="flex justify-end  gap-3 pt-4">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  // className="flex-1"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                //  className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : initialData ? (
                  "Update Lead Magnet"
                ) : (
                  "Create Lead Magnet"
                )}
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[350px] space-y-6 mt-8 lg:mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Status & Publishing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Visual Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Featured Image */}
                <ImageField
                  label="Featured Image"
                  value={watch("featured_image")}
                  isUploading={isUploading.featured_image}
                  onUpload={(e) => handleFileUpload(e, "featured_image")}
                  onRemove={() => handleRemoveImage("featured_image")}
                  fileInputRef={fileInputRefs.featured_image}
                />

                {/* Tab Images */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-sm font-medium">Tab Customization</h4>
                  <ImageField
                    label="Tab Normal Icon"
                    value={watch("tab_normal_icon")}
                    isUploading={isUploading.tab_normal_icon}
                    onUpload={(e) => handleFileUpload(e, "tab_normal_icon")}
                    onRemove={() => handleRemoveImage("tab_normal_icon")}
                    fileInputRef={fileInputRefs.tab_normal_icon}
                  />
                  <ImageField
                    label="Tab Active Icon"
                    value={watch("tab_active_icon")}
                    isUploading={isUploading.tab_active_icon}
                    onUpload={(e) => handleFileUpload(e, "tab_active_icon")}
                    onRemove={() => handleRemoveImage("tab_active_icon")}
                    fileInputRef={fileInputRefs.tab_active_icon}
                  />
                  <ImageField
                    label="Tab Image (Featured)"
                    value={watch("tab_image")}
                    isUploading={isUploading.tab_image}
                    onUpload={(e) => handleFileUpload(e, "tab_image")}
                    onRemove={() => handleRemoveImage("tab_image")}
                    fileInputRef={fileInputRefs.tab_image}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

interface ImageFieldProps {
  label: string;
  value: string | undefined;
  isUploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

function ImageField({
  label,
  value,
  isUploading,
  onUpload,
  onRemove,
  fileInputRef,
}: ImageFieldProps) {
  return (
    <div className="space-y-2">
      <FormLabel>{label}</FormLabel>
      <div className="relative">
        {value ? (
          <div className="relative rounded-md overflow-hidden border">
            <img src={value} alt={label} className="w-full h-32 object-cover" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 rounded-full"
              onClick={onRemove}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <>
                <UploadCloud className="h-6 w-6 text-muted-foreground mb-2" />
                <span className="text-xs text-muted-foreground">
                  Click to upload
                </span>
              </>
            )}
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={onUpload}
              accept="image/*"
            />
          </div>
        )}
      </div>
    </div>
  );
}
