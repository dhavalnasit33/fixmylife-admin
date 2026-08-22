"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import HomeToolCategoryForm from "@/components/dashboard/home-tool-categories/HomeToolCategoryForm";
import apiService from "@/lib/apiService";
import type { SingleResponse, HomeToolCategory } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { HomeToolCategoryFormValues } from "@/types";

export default function EditHomeToolCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [category, setCategory] = useState<HomeToolCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCategory() {
      setIsLoading(true);
      try {
        const res = await apiService<SingleResponse<HomeToolCategory>>(
          `/home-tool-categories/${id}`,
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

  const handleSubmit = async (values: HomeToolCategoryFormValues) => {
    const payload = {
      ...values,
      parent: values.parent === "none" ? null : values.parent,
    };

    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<HomeToolCategory>>(
        `/home-tool-categories/${category?._id}`,
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
            response.message || "Home Tool category updated successfully.",
        });
        router.push("/dashboard/home-tool-categories");
      } else {
        toast({
          title: "Error",
          description:
            response.message || "Failed to update home tool category.",
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
          <CardTitle>Edit Home Tool Category</CardTitle>
        </CardHeader>
        <CardContent>
          <HomeToolCategoryForm
            initialData={{
              name: category?.name,
              description: category?.description || "",
              is_active: category?.is_active,
              icon: category?.icon ?? "",
            }}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => router.push("/dashboard/home-tool-categories")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
