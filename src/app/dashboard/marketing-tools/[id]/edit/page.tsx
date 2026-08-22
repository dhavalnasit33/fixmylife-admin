"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  SingleResponse,
  PaginatedResponse,
  MarketingToolFormValues,
  MarketingCategory,
  MarketingTool,
} from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService";
import MarketingToolForm from "@/components/dashboard/marketing-tools/MarketingToolsForm";

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "_");

export default function EditToolPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [tool, setTool] = useState<
    (MarketingToolFormValues & { _id?: string }) | null
  >(null);
  const [categories, setCategories] = useState<MarketingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [toolRes, catRes] = await Promise.all([
        apiService<SingleResponse<MarketingTool>>(`/marketing-tools/${id}`),
        apiService<PaginatedResponse<MarketingCategory>>(
          `/marketing-categories`,
          {
            params: { limit: 1000 },
          }
        ),
      ]);

      if (!toolRes.success) throw new Error(toolRes.message);
      if (!catRes.success) throw new Error("Failed to fetch categories");
      const toolData = toolRes.data;

      const formReadyTabs = (toolData.tabs || []).map((tab) => {
        const deconstructedPrompts = new Map<string, string>();
        let lastPlaceholderEndIndex = 0;

        (tab.fields || []).forEach((field) => {
          const placeholder = `{{${field.key}}}`;
          const placeholderStartIndex = tab.prompt_template.indexOf(
            placeholder,
            lastPlaceholderEndIndex
          );

          if (placeholderStartIndex === -1) {
            deconstructedPrompts.set(field.key, "");
            return;
          }

          let promptText = tab.prompt_template.substring(
            lastPlaceholderEndIndex,
            placeholderStartIndex
          );
          promptText = promptText.trim();
          if (promptText.startsWith(".")) {
            promptText = promptText.substring(1).trim();
          }

          deconstructedPrompts.set(field.key, promptText);
          lastPlaceholderEndIndex = placeholderStartIndex + placeholder.length;
        });

        const processedFields = (tab.fields || []).map((field) => ({
          key: field.key || slugify(field.label || ""),
          label: field.label || "",
          description: field.description || "",
          type: field.type || "textbox",
          required: field.required || false,
          placeholder: field.placeholder || "",
          options: Array.isArray(field.options)
            ? field.options
            : typeof field.options === "string"
            ? (field.options as string).split(",").map((o: string) => o.trim())
            : [],
          field_prompt_template: deconstructedPrompts.get(field.key) || "",
        }));

        return {
          title: tab.title || "",
          description: tab.description || "",
          prompt_template: tab.prompt_template || "",
          fields: processedFields,
        };
      });

      const formValues: MarketingToolFormValues & { _id: string } = {
        _id: toolData._id,
        name: toolData.name || "",
        display_name: toolData.display_name || "",
        short_description: toolData.short_description || "",
        description: toolData.description || "",
        icon: toolData.icon || "",
        user_plan: toolData.user_plan || "free",
        is_popular: toolData.is_popular ?? false,
sticky: toolData.sticky ?? false,
categories: toolData.categories || [],
tags: toolData.tags || [],
        allternativeTools: toolData.allternativeTools || [],
        whatCanDO: toolData.whatCanDO || [],
        category_id: Array.isArray(toolData.category_id)
          ? toolData.category_id.map((cat) =>
              typeof cat === "object" && cat !== null ? cat._id : cat
            )
          : [
              typeof toolData.category_id === "object" &&
              toolData.category_id !== null
                ? toolData.category_id._id
                : toolData.category_id,
            ],
        system_prompt_template: toolData.system_prompt_template || "",
        is_active: toolData.is_active ?? true,
        seo_keyphrase: toolData.seo_keyphrase || "",
        seo_title: toolData.seo_title || "",
        meta_description: toolData.meta_description || "",
        cover_image: toolData.cover_image || "",
        tabs: formReadyTabs,
        max_tokens:toolData.max_tokens || 4000,
        suggested_topics: (toolData.suggested_topics || []).map((t) => ({
          title: t.title || "",
          has_input: t.has_input ?? true,
          input_placeholder: t.input_placeholder || "",
        })),
        display_wordcount: toolData.display_wordcount ?? true,
        improvement_system_prompt: toolData.improvement_system_prompt || "",
        custom_url: toolData.custom_url || "",
        tooltips: toolData.tooltips || "",
      };

      setTool(formValues);
      setCategories(catRes.data);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    if (id) fetchAllData();
  }, [id, fetchAllData]);

  const handleSubmit = async (values: MarketingToolFormValues) => {
    if (!tool?._id) return;
    setSubmitting(true);
    try {
      const processed = {
        ...values,
        tabs: values.tabs.map((tab) => ({
          ...tab,
          fields: tab.fields.map((field) => ({
            ...field,
            key: field.key || slugify(field.label),
          })),
        })),
        suggested_topics:
          values.suggested_topics?.map((topic) => {
            if (
              topic.has_input &&
              topic.title &&
              !topic.title.includes("{{user_input}}")
            ) {
              return {
                ...topic,
                title: `${topic.title.trim()} {{user_input}}`,
              };
            }
            return topic;
          }) || [],
      };

      const res = await apiService<SingleResponse<MarketingTool>>(
        `/marketing-tools/${tool._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(processed),
        }
      );

      if (res.success) {
        toast({ title: "Success", description: res.message });
        router.push("/dashboard/marketing-tools");
      } else {
        throw new Error(res.message || "Update failed");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Marketing Tool not found or could not be loaded.
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Tool: {tool.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <MarketingToolForm
            initialData={tool}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/dashboard/marketing-tools")}
            isSubmitting={submitting}
            toolCategories={categories}
          />
        </CardContent>
      </Card>
    </div>
  );
}
