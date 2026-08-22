"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

import HomeToolTagForm from "@/components/dashboard/home-tool-tags/HomeToolTagForm";
import apiService from "@/lib/apiService";

import type {
  SingleResponse,
  HomeToolTag,
  HomeToolTagFormValues,
} from "@/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function EditHomeToolTagPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [tag, setTag] = useState<HomeToolTag | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch single tag
  useEffect(() => {
    async function fetchTag() {
      setIsLoading(true);
      try {
        const res = await apiService<SingleResponse<HomeToolTag>>(
          `/home-tool-tags/${id}`,
          { method: "GET" }
        );
        setTag(res.data || null);
      } catch (e) {
        setError("Failed to load tag.");
      } finally {
        setIsLoading(false);
      }
    }

    if (id) fetchTag();
  }, [id]);

  // On submit update tag
  const handleSubmit = async (values: HomeToolTagFormValues) => {
    setIsSubmitting(true);

    try {
      const response = await apiService<SingleResponse<HomeToolTag>>(
        `/home-tool-tags/${tag?._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values, (key, value) =>
            value === undefined ? null : value
          ),
        }
      );

      if (response.success) {
        toast({
          title: "Success",
          description:
            response.message || "Home Tool Tag updated successfully.",
        });
        router.push("/dashboard/home-tool-tags");
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update tag.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      setError("Failed to update tag.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // UI states
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!tag) return <div>Tag not found.</div>;

  return (
    <div className="container">
      <Card>
        <CardHeader>
          <CardTitle>Edit Home Tool Tag</CardTitle>
        </CardHeader>

        <CardContent>
          <HomeToolTagForm
            initialData={{
              name: tag?.name,
              description: tag?.description,
              is_active: tag?.is_active,
            }}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => router.push("/dashboard/home-tool-tags")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
