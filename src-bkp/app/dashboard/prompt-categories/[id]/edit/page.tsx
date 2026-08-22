"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import PromptCategoryForm from "@/components/dashboard/prompt-categories/PromptCategoryForm";
import apiService from "@/lib/apiService";
import type { SingleResponse, PromptCategory, PromptCategoryFormValues } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ProtectedPage from "@/components/shared/ProtectedPage";

export default function EditPromptCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [category, setCategory] = useState<PromptCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCategory() {
      setIsLoading(true);
      try {
        const res = await apiService<SingleResponse<PromptCategory>>(
          `/prompt-categories/${id}`,
          { method: "GET" }
        );
        setCategory(res.data || null);
      } catch (e) {
        setError("Failed to load category.");
      } finally {
        setIsLoading(false);
      }
    }
    if (id) fetchCategory();
  }, [id]);

  const handleSubmit = async (values: PromptCategoryFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<PromptCategory>>(
        `/prompt-categories/${category?._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );

      if (response.success) {
        toast({ title: "Success", description: "Prompt category updated successfully." });
        router.push("/dashboard/prompt-categories");
      } else {
        toast({ title: "Error", description: response.message || "Failed to update category.", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "An unexpected error occurred.", variant: "destructive" });
      setError("Failed to update category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500 mb-2">{error}</div>;
  if (!category) return <div>Category not found.</div>;

  return (
    <ProtectedPage requiredPermission="editPromptCategory">
      <div className="container">
        <Card>
          <CardHeader>
            <CardTitle>Edit Prompt Category</CardTitle>
          </CardHeader>
          <CardContent>
            <PromptCategoryForm
              initialData={{
                name: category?.name,
                description: category?.description || "",
                is_active: category?.is_active,
                icon: category?.icon ?? "",
              }}
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