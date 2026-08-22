"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ToolForm from "@/components/dashboard/tools/ToolForm";
import apiService from "@/lib/apiService";
import type {
  Tool,
  ToolFormValues,
  ToolCategory,
  SingleResponse,
  PaginatedResponse,
  AIProviderConfig,
  AIModel,
} from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function CreateToolPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPrerequisites, setIsLoadingPrerequisites] = useState(false);
  const [toolCategories, setToolCategories] = useState<ToolCategory[]>([]);
  const [aiProviderConfigs, setAiProviderConfigs] = useState<
    AIProviderConfig[]
  >([]);
  const [aiModels, setAiModels] = useState<AIModel[]>([]);

  const fetchPrerequisites = useCallback(async () => {
    setIsLoadingPrerequisites(true);
    try {
      const [categoriesRes, providerConfigsRes, modelsRes] = await Promise.all([
        apiService<PaginatedResponse<ToolCategory>>("/tool-categories", {
          params: { limit: 1000, is_active: true },
        }),
        apiService<PaginatedResponse<AIProviderConfig>>("/ai-providers", {
          params: { limit: 1000, is_active: true },
        }),
        apiService<PaginatedResponse<AIModel>>("/ai-models", {
          params: { limit: 1000, is_active: true },
        }),
      ]);

      setToolCategories(categoriesRes.success ? categoriesRes.data : []);
      setAiProviderConfigs(
        providerConfigsRes.success ? providerConfigsRes.data : []
      );
      setAiModels(modelsRes.success ? modelsRes.data : []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load prerequisites",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPrerequisites(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPrerequisites();
  }, [fetchPrerequisites]);

  const handleSubmit = async (values: ToolFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<Tool>>("/tools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Tool created successfully.",
        });
        router.push("/dashboard/tools");
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create tool.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed =
    toolCategories.length > 0 &&
    aiProviderConfigs.length > 0 &&
    aiModels.length > 0 &&
    !isLoadingPrerequisites;

  let proceedMessage = "";
  if (!isLoadingPrerequisites) {
    if (toolCategories.length === 0)
      proceedMessage = "Create a Tool Category first.";
    else if (aiProviderConfigs.length === 0)
      proceedMessage = "Configure an AI Provider first.";
    else if (aiModels.length === 0) proceedMessage = "Add an AI Model first.";
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New AI Tool</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingPrerequisites && (
            <p className="text-muted-foreground">Loading prerequisites...</p>
          )}
          {!isLoadingPrerequisites && !canProceed && (
            <p className="text-muted-foreground">{proceedMessage}</p>
          )}
          {canProceed && (
            <ToolForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => router.push("/dashboard/tools")}
              toolCategories={toolCategories}
              aiProviderConfigs={aiProviderConfigs}
              aiModels={aiModels}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
