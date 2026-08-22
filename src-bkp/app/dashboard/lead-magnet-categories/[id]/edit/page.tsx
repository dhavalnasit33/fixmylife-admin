"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import ProtectedPage from "@/components/shared/ProtectedPage";
import LeadMagnetCategoryForm from "@/components/dashboard/lead-magnet-categories/LeadMagnetCategoryForm";
import apiService from "@/lib/apiService";
import type { LeadMagnetCategoryFormValues, SingleResponse, LeadMagnetCategory } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditLeadMagnetCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<LeadMagnetCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategory = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiService<SingleResponse<LeadMagnetCategory>>(
        `/lead-magnet-categories/${id}`,
      );
      if (response.success) {
        setInitialData(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch category details.",
          variant: "destructive",
        });
        router.push("/dashboard/lead-magnet-categories");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while fetching details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    if (id) fetchCategory();
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
        router.push("/dashboard/lead-magnet-categories");
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

  return (
    <ProtectedPage requiredPermission="createLeadMagnets">
      <Card>
        <CardContent className="p-6">
          <PageHeader
            title="Edit Lead Magnet Category"
            description="Modify the category details."
          />
          <div className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : initialData ? (
              <LeadMagnetCategoryForm
                initialData={initialData}
                onSubmit={onSubmit}
                isSubmitting={isSubmitting}
                onCancel={() => router.push("/dashboard/lead-magnet-categories")}
              />
            ) : (
              <div className="text-center py-10">Category not found.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </ProtectedPage>
  );
}
