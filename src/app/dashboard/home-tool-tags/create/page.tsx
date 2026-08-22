"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import HomeToolTagForm from "@/components/dashboard/home-tool-tags/HomeToolTagForm";
import apiService from "@/lib/apiService";
import { SingleResponse, HomeToolTag, HomeToolTagFormValues } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function CreateHomeToolTagPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (values: HomeToolTagFormValues) => {
    setIsSubmitting(true);

    try {
      const response = await apiService<SingleResponse<HomeToolTag>>(
        "/home-tool-tags",
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
            response.message || "Home Tool Tag created successfully.",
        });
        router.push("/dashboard/home-tool-tags");
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create home tool tag.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      setError("Failed to create home tool tag.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <Card>
        <CardHeader>
          <CardTitle>Create Home Tool Tag</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500 mb-2">{error}</p>}

          <HomeToolTagForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => router.push("/dashboard/home-tool-tags")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
