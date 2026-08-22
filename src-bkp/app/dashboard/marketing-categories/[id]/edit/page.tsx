"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import MarketingCategoryForm, {
  MarketingCategoryFormValues,
} from "@/components/dashboard/marketing-categories/MarketingCategoryForm";
import apiService from "@/lib/apiService";
import type { SingleResponse, MarketingCategory } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function EditMarketingCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [category, setCategory] = useState<MarketingCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCategory() {
      setIsLoading(true);
      try {
        const res = await apiService<SingleResponse<MarketingCategory>>(
          `/marketing-categories/${id}`,
          {
            method: "GET",
          }
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

  const handleSubmit = async (values: MarketingCategoryFormValues) => {
    const payload = {
      ...values,
      parent: values.parent === "none" ? null : values.parent,
    };
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<MarketingCategory>>(
        `/marketing-categories/${category?._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload, (key, value) =>
            value === undefined ? null : value
          ),
        }
      );

      if (response.success) {
        toast({
          title: "Success",
          description:
            response.message || "Marketing category updated successfully.",
        });
        router.push("/dashboard/marketing-categories");
      } else {
        toast({
          title: "Error",
          description:
            response.message || "Failed to update marketing category.",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      setError("Failed to update category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500 mb-2">{error}</div>;
  if (!category) return <div>Category not found.</div>;

  return (
    <div className="container">
      <Card>
        <CardHeader>
          <CardTitle>Edit Marketing Category</CardTitle>
        </CardHeader>
        <CardContent>
          <MarketingCategoryForm
            initialData={{
              name: category?.name,
              description: category?.description || "",
              system_prompt: category?.system_prompt,
              category:
                category?.category as MarketingCategoryFormValues["category"],
              is_active: category?.is_active,
              icon: category?.icon ?? "",
              tab_normal_icon_image: category?.tab_normal_icon_image,
              tab_active_icon_image: category?.tab_active_icon_image,
              parent: category?.parent
                ? typeof category.parent === "object"
                  ? category.parent._id
                  : category.parent
                : "none",
            }}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => router.push("/dashboard/marketing-categories")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
