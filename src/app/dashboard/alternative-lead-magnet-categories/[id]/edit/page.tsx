"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import ProtectedPage from "@/components/shared/ProtectedPage";
import LeadMagnetCategoryForm from "@/components/dashboard/lead-magnet-categories/LeadMagnetCategoryForm";
import apiService from "@/lib/apiService";
import type { LeadMagnetCategoryFormValues, SingleResponse, LeadMagnetCategory } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function EditAlternativeCategoryPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<LeadMagnetCategory | null>(null);

  const fetchCategory = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiService<SingleResponse<LeadMagnetCategory>>(
        `/lead-magnet-categories/${id}`,
      );
      if (response.success) {
        setCategory(response.data);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch category details.",
          variant: "destructive",
        });
        router.push("/dashboard/alternative-lead-magnet-categories");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      router.push("/dashboard/alternative-lead-magnet-categories");
    } finally {
      setIsLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    if (id) {
      fetchCategory();
    }
  }, [id, fetchCategory]);

  const onSubmit = async (values: LeadMagnetCategoryFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<LeadMagnetCategory>>(
        `/lead-magnet-categories/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Category updated successfully.",
        });
        router.push("/dashboard/alternative-lead-magnet-categories");
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update category.",
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

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!category) return null;

  return (
    <ProtectedPage requiredPermission="editLeadMagnetCategories">
      <Card>
        <CardContent className="p-6">
          <PageHeader
            title={`Edit Alternative Category: ${category.name}`}
            description="Modify the details of this category page."
          />
          <div className="mt-6">
            <LeadMagnetCategoryForm
              type="alternative"
              initialData={category}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => router.push("/dashboard/alternative-lead-magnet-categories")}
            />
          </div>
        </CardContent>
      </Card>
    </ProtectedPage>
  );
}
