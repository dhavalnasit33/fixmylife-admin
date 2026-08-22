"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ToolForm from "./ToolForm";
import apiService from "@/lib/apiService";
import type {
  Tool,
  ToolCategory,
  SingleResponse,
  ToolFormValues,
  AIProviderConfig,
  AIModel,
  PaginatedResponse,
} from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

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

interface EditToolDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  tool: Tool | null;
  toolCategories: ToolCategory[];
  onSuccess: () => void;
}

export default function EditToolDialog({
  isOpen,
  onOpenChange,
  tool: initialToolSummary,
  toolCategories,
  onSuccess,
}: EditToolDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentToolData, setCurrentToolData] = useState<
    (ToolFormValues & { _id?: string }) | null
  >(null);

  const [aiProviderConfigs, setAiProviderConfigs] = useState<
    AIProviderConfig[]
  >([]);
  const [aiModels, setAiModels] = useState<AIModel[]>([]);

  const fetchPrerequisites = useCallback(async () => {
    try {
      const [providerConfigsResponse, modelsResponse] = await Promise.all([
        apiService<PaginatedResponse<AIProviderConfig>>("/ai-providers", {
          params: { limit: 1000, is_active: true },
        }),
        apiService<PaginatedResponse<AIModel>>("/ai-models", {
          params: { limit: 1000, is_active: true },
        }),
      ]);

      if (providerConfigsResponse.success) {
        setAiProviderConfigs(providerConfigsResponse.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch AI Provider Configurations.",
          variant: "destructive",
        });
      }

      if (modelsResponse.success) {
        setAiModels(modelsResponse.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch AI Models.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error fetching prerequisites",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchToolDetails = useCallback(
    async (toolId: string) => {
      try {
        const response = await apiService<SingleResponse<Tool>>(
          `/tools/${toolId}`
        );
        if (response.success && response.data) {
          const fetchedTool = response.data;
          let modelId = "";
          if (fetchedTool.ai_model_id) {
            modelId =
              typeof fetchedTool.ai_model_id === "object" &&
              fetchedTool.ai_model_id !== null
                ? (fetchedTool.ai_model_id as AIModel)._id || ""
                : (fetchedTool.ai_model_id as string);
          }

          const formReadyTabs = (fetchedTool.tabs || []).map((tab) => {
            const deconstructedPrompts = new Map<string, string>();
            let lastPlaceholderEndIndex = 0;

            // Deconstruct the main prompt template into individual field prompts
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
              lastPlaceholderEndIndex =
                placeholderStartIndex + placeholder.length;
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
                ? (field.options as string)
                    .split(",")
                    .map((opt: string) => opt.trim())
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

          const formReadyData: ToolFormValues & { _id: string } = {
            _id: fetchedTool._id,
            name: fetchedTool.name || "",
            short_description: fetchedTool.short_description || "",
            description: fetchedTool.description || "",
            icon: fetchedTool.icon || "",
            category_id: Array.isArray(fetchedTool.category_id)
              ? fetchedTool.category_id.map((cat) =>
                  typeof cat === "object" && cat !== null
                    ? String(cat._id)
                    : String(cat)
                )
              : [
                  typeof fetchedTool.category_id === "object" &&
                  fetchedTool.category_id !== null
                    ? String(fetchedTool.category_id._id)
                    : String(fetchedTool.category_id || ""),
                ],
            ai_model_id: modelId,
            system_prompt_template: fetchedTool.system_prompt_template || "",
            is_active: fetchedTool.is_active ?? true,
            seo_keyphrase: fetchedTool.seo_keyphrase || "",
            seo_title: fetchedTool.seo_title || "",
            meta_description: fetchedTool.meta_description || "",
            cover_image: fetchedTool.cover_image || "",
            tabs: formReadyTabs,
            suggested_topics: (fetchedTool.suggested_topics || []).map(
              (topic) => ({
                title: topic.title || "",
                has_input: topic.has_input || true,
                input_placeholder: topic.input_placeholder || "",
              })
            ),
          };
          setCurrentToolData(formReadyData);
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to load tool details.",
            variant: "destructive",
          });
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Could not load tool.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  useEffect(() => {
    if (isOpen && initialToolSummary?._id) {
      setIsLoading(true);
      Promise.all([
        fetchPrerequisites(),
        fetchToolDetails(initialToolSummary._id),
      ]).finally(() => {
        setIsLoading(false);
      });
    } else if (!isOpen) {
      // Clean up state when dialog is closed
      setCurrentToolData(null);
      setAiProviderConfigs([]);
      setAiModels([]);
      setIsLoading(false);
      setIsSubmitting(false);
    }
  }, [isOpen, initialToolSummary, fetchPrerequisites, fetchToolDetails]);

  const handleSubmit = async (values: ToolFormValues) => {
    if (!currentToolData?._id) return;
    setIsSubmitting(true);
    try {
      const processedValues = {
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

      const response = await apiService<SingleResponse<Tool>>(
        `/tools/${currentToolData._id}`,
        {
          method: "PUT",
          body: processedValues,
        }
      );

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Tool updated successfully.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update tool.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canRenderForm =
    !isLoading &&
    currentToolData &&
    aiProviderConfigs.length > 0 &&
    aiModels.length > 0 &&
    toolCategories.length > 0;

  let prerequisiteMessage = "";
  if (isLoading) {
    prerequisiteMessage = "Loading data...";
  } else if (isOpen && !initialToolSummary?._id && !currentToolData) {
    prerequisiteMessage = "No tool selected or available to edit.";
  } else if (toolCategories.length === 0) {
    prerequisiteMessage = "No tool categories found. Please create one first.";
  } else if (aiProviderConfigs.length === 0) {
    prerequisiteMessage =
      "No active AI Provider Configurations found. Please create one first.";
  } else if (aiModels.length === 0) {
    prerequisiteMessage = "No active AI Models found. Please create one first.";
  } else if (!currentToolData) {
    prerequisiteMessage =
      "Tool data could not be loaded or prerequisites are missing.";
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit AI Tool</DialogTitle>
          <DialogDescription>
            Modify the details for &quot;
            {currentToolData?.name || initialToolSummary?.name || "this tool"}
            &quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ||
          (isOpen && !currentToolData && initialToolSummary?._id) ? (
            <div className="space-y-4 p-4">
              <Skeleton className="h-10 w-1/2" />{" "}
              <Skeleton className="h-20 w-full" />{" "}
              <Skeleton className="h-10 w-full" />
              <Card>
                <CardHeader>
                  <Skeleton className="h-8 w-1/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
            </div>
          ) : canRenderForm ? (
            <ToolForm
              key={currentToolData?._id}
              initialData={currentToolData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => onOpenChange(false)}
              toolCategories={toolCategories}
              aiProviderConfigs={aiProviderConfigs}
              aiModels={aiModels}
            />
          ) : (
            <p className="text-center text-muted-foreground p-8">
              {prerequisiteMessage}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
