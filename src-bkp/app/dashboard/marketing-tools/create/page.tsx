"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import apiService from "@/lib/apiService";
import type {
  SingleResponse,
  PaginatedResponse,
  MarketingCategory,
  MarketingToolFormValues,
  MarketingTool,
} from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import MarketingToolForm from "@/components/dashboard/marketing-tools/MarketingToolsForm";

export default function CreateMarketingToolPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPrerequisites, setIsLoadingPrerequisites] = useState(false);
  const [toolCategories, setToolCategories] = useState<MarketingCategory[]>([]);



  const fetchPrerequisites = useCallback(async () => {
    setIsLoadingPrerequisites(true);
    try {
      const [categoriesRes] = await Promise.all([
        apiService<PaginatedResponse<MarketingCategory>>("/marketing-categories", {
          params: { limit: 1000, is_active: true },
        }),
      ]);

      setToolCategories(categoriesRes.success ? categoriesRes.data : []);

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

  const handleSubmit = async (values: MarketingToolFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<MarketingTool>>("/marketing-tools", {
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
        router.push("/dashboard/marketing-tools");
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
    !isLoadingPrerequisites;

  let proceedMessage = "";
  if (!isLoadingPrerequisites) {
    if (toolCategories.length === 0)
      proceedMessage = "Create a Tool Category first."
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New AI Marketing Tool</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingPrerequisites && (
            <p className="text-muted-foreground">Loading prerequisites...</p>
          )}
          {!isLoadingPrerequisites && !canProceed && (
            <p className="text-muted-foreground">{proceedMessage}</p>
          )}
          {canProceed && (
            <MarketingToolForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => router.push("/dashboard/marketing-tools")}
              toolCategories={toolCategories}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
