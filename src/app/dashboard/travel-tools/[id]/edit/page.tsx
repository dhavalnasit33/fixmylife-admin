"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService";
import OtherToolsForm from "@/components/dashboard/other-tools/OtherToolsForm";
import { prepareOtherToolFormValues } from "@/lib/utils";

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "_");

export default function EditTravelToolPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [tool, setTool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch ONLY the tool data (Removed categories call)
      const toolRes = await apiService<{ success: boolean; data: any }>(`/travel-tools/${id}`);

      if (!toolRes.success) throw new Error("Failed to fetch tool data");
      const toolData = toolRes.data;

      // ---------------------------------------------------------
      // 🧩 PROMPT DECONSTRUCTION LOGIC
      // ---------------------------------------------------------
      // const formReadyTabs = (toolData.tabs || []).map((tab: any) => {
      //   const deconstructedPrompts = new Map<string, string>();
      //   let lastPlaceholderEndIndex = 0;

      //   (tab.fields || []).forEach((field: any) => {
      //     const placeholder = `{{${field.key}}}`;
      //     const placeholderStartIndex = tab.prompt_template.indexOf(
      //       placeholder,
      //       lastPlaceholderEndIndex
      //     );

      //     if (placeholderStartIndex === -1) {
      //       deconstructedPrompts.set(field.key, "");
      //       return;
      //     }

      //     let promptText = tab.prompt_template.substring(
      //       lastPlaceholderEndIndex,
      //       placeholderStartIndex
      //     );
      //     promptText = promptText.trim();
      //     if (promptText.startsWith(".")) {
      //       promptText = promptText.substring(1).trim();
      //     }

      //     deconstructedPrompts.set(field.key, promptText);
      //     lastPlaceholderEndIndex = placeholderStartIndex + placeholder.length;
      //   });

      //   const processedFields = (tab.fields || []).map((field: any) => ({
      //     key: field.key || slugify(field.label || ""),
      //     label: field.label || "",
      //     description: field.description || "",
      //     type: field.type || "textbox",
      //     required: field.required || false,
      //     placeholder: field.placeholder || "",
      //     options: Array.isArray(field.options)
      //       ? field.options
      //       : typeof field.options === "string"
      //       ? (field.options as string).split(",").map((o: string) => o.trim())
      //       : [],
      //     field_prompt_template: deconstructedPrompts.get(field.key) || "",
      //   }));

      //   return {
      //     title: tab.title || "",
      //     description: tab.description || "",
      //     prompt_template: tab.prompt_template || "",
      //     fields: processedFields,
      //   };
      // });

      // ---------------------------------------------------------
      // 📝 PREPARE FORM VALUES
      // ---------------------------------------------------------
      // const formValues = {
      //   _id: toolData._id,
      //   name: toolData.name || "",
      //   short_description: toolData.short_description || "",
      //   description: toolData.description || "",
      //   icon: toolData.icon || "",
      //   user_plan: toolData.user_plan || "free",
      //   is_popular: toolData.is_popular ?? false,
        
      //   // Removed category_id logic as we are using global 'categories' now
        
      //   system_prompt_template: toolData.system_prompt_template || "",
      //   is_active: toolData.is_active ?? true,
        
      //   // SEO Fields
      //   seo_keyphrase: toolData.seo_keyphrase || "",
      //   seo_title: toolData.seo_title || "",
      //   meta_description: toolData.meta_description || "",
      //   cover_image: toolData.cover_image || "",
      //   tool_cover_image: toolData.tool_cover_image || "",
      //   tab_normal_icon_image: toolData.tab_normal_icon_image || "",
      //   tab_active_icon_image: toolData.tab_active_icon_image || "",
      //   tab_image: toolData.tab_image || "",
        
      //   // Advanced Config
      //   tabs: formReadyTabs,
      //   max_tokens: toolData.max_tokens || 4000,
      //   suggested_topics: (toolData.suggested_topics || []).map((t: any) => ({
      //     title: t.title || "",
      //     has_input: t.has_input ?? true,
      //     input_placeholder: t.input_placeholder || "",
      //     sticky: t.sticky ?? false,
      //   })),
      //   display_wordcount: toolData.display_wordcount ?? true,
      //   show_text_editor: toolData.show_text_editor ?? true,
      //   has_brand_voice: toolData.has_brand_voice ?? false,
      //   improvement_system_prompt: toolData.improvement_system_prompt || "",
      //   custom_url: toolData.custom_url || "",
      //   tooltips: toolData.tooltips || "",
        
      //   // Home Categories & Tags
      //   categories: toolData.categories || [],
      //   tags: toolData.tags || [],
      // };
      const formValues = prepareOtherToolFormValues(toolRes.data);
      setTool(formValues);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    if (id) fetchAllData();
  }, [id, fetchAllData]);

  const handleSubmit = async (values: any) => {
    if (!tool?._id) return;
    setSubmitting(true);
    try {
      // Process data for submission
      const processed = {
        ...values,
        tool_type: "travel", // Explicitly ensure type matches
        tabs: values.tabs.map((tab: any) => ({
          ...tab,
          fields: tab.fields.map((field: any) => ({
            ...field,
            key: field.key || slugify(field.label),
          })),
        })),
        suggested_topics:
          values.suggested_topics?.map((topic: any) => {
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

      // Submit to Travel Tools endpoint
      // FIX: Removed JSON.stringify() and headers, passing object directly
      const res = await apiService<{ success: boolean; message: string }>(
        `/travel-tools/${tool._id}`,
        {
          method: "PUT",
          body: processed, 
        }
      );

      if (res.success) {
        toast({ title: "Success", description: res.message || "Tool updated successfully" });
        router.push("/dashboard/travel-tools");
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
        Travel Tool not found or could not be loaded.
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
          <OtherToolsForm
            toolTypeLabel="Travel Tool"
            initialData={tool}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/dashboard/travel-tools")}
            isSubmitting={submitting}
            // Removed toolCategories prop
          />
        </CardContent>
      </Card>
    </div>
  );
}