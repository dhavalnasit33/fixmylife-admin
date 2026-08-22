"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import HomeToolCategoryForm from "@/components/dashboard/home-tool-categories/HomeToolCategoryForm";
import apiService from "@/lib/apiService";
import { SingleResponse } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { HomeToolCategory } from "@/types"; // make sure this type exists
import { HomeToolCategoryFormValues } from "@/types";

export default function CreateHomeToolCategoryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (values: HomeToolCategoryFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<HomeToolCategory>>(
        "/home-tool-categories",
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
            response.message || "Home Tool category created successfully.",
        });
        router.push("/dashboard/home-tool-categories");
      } else {
        toast({
          title: "Error",
          description:
            response.message || "Failed to create home tool category.",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      setError("Failed to create home tool category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <Card>
        <CardHeader>
          <CardTitle>Create Home Tool Category</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <HomeToolCategoryForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => router.push("/dashboard/home-tool-categories")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
