"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import MarketingCategoryForm, {
  MarketingCategoryFormValues,
} from "@/components/dashboard/marketing-categories/MarketingCategoryForm";
import apiService from "@/lib/apiService";
import { SingleResponse, MarketingCategory } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function CreateMarketingCategoryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (values: MarketingCategoryFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<MarketingCategory>>(
        "/marketing-categories",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      );

      if (response.success) {
        toast({
          title: "Success",
          description:
            response.message || "Marketing category created successfully.",
        });
        router.push("/dashboard/marketing-categories");
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create marketing category.",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      setError("Failed to create marketing category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <Card>
        <CardHeader>
          <CardTitle>Create Marketing Category</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <MarketingCategoryForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => router.push("/dashboard/marketing-categories")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
