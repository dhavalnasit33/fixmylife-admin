"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PromptCategoryForm from "@/components/dashboard/prompt-categories/PromptCategoryForm";
import apiService from "@/lib/apiService";
import { SingleResponse, PromptCategory, PromptCategoryFormValues } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ProtectedPage from "@/components/shared/ProtectedPage";

export default function CreatePromptCategoryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (values: PromptCategoryFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<PromptCategory>>(
        "/prompt-categories",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );

      if (response.success) {
        toast({ title: "Success", description: "Prompt category created successfully." });
        router.push("/dashboard/prompt-categories");
      } else {
        toast({ title: "Error", description: response.message || "Failed to create category.", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "An unexpected error occurred.", variant: "destructive" });
      setError("Failed to create prompt category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedPage requiredPermission="createPromptCategory">
      <div className="container">
        <Card>
          <CardHeader>
            <CardTitle>Create Prompt Category</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <div className="text-red-500 mb-2">{error}</div>}
            <PromptCategoryForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => router.push("/dashboard/prompt-categories")}
            />
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}