"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import ProtectedPage from "@/components/shared/ProtectedPage";
import LeadMagnetCategoryForm from "@/components/dashboard/lead-magnet-categories/LeadMagnetCategoryForm";
import apiService from "@/lib/apiService";
import type { LeadMagnetCategoryFormValues, SingleResponse, LeadMagnetCategory } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export default function CreateAlternativeCategoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: LeadMagnetCategoryFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<LeadMagnetCategory>>(
        "/lead-magnet-categories",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Alternative Category created successfully.",
        });
        router.push("/dashboard/alternative-lead-magnet-categories");
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create category.",
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
    <ProtectedPage requiredPermission="createLeadMagnetCategories">
      <Card>
        <CardContent className="p-6">
          <PageHeader
            title="Create Alternative Category"
            description="Create a category to group your alternative lead magnets."
          />
          <div className="mt-6">
            <LeadMagnetCategoryForm
              type="alternative"
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
