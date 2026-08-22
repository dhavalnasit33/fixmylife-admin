"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ImagePromptForm from "@/components/dashboard/image-prompts/ImagePromptForm";
import apiService from "@/lib/apiService";
import type { SingleResponse, ImagePrompt, ImagePromptFormValues } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ProtectedPage from "@/components/shared/ProtectedPage";

export default function EditImagePromptPage() {
  const router = useRouter();
  const { id } = useParams();
  const [data, setData] = useState<ImagePrompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await apiService<SingleResponse<ImagePrompt>>(`/image-prompts/${id}`, { method: "GET" });
        setData(res.data);
      } catch (e) {
        toast({ title: "Error", description: "Failed to load data.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    if (id) fetchData();
  }, [id, toast]);

  const handleSubmit = async (values: ImagePromptFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<ImagePrompt>>(`/image-prompts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.success) {
        toast({ title: "Success", description: "Image prompt updated successfully." });
        router.push("/dashboard/image-prompts");
      } else {
        toast({ title: "Error", description: response.message, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>Not found</div>;

  return (
    <ProtectedPage requiredPermission="editImagePromptMenu">
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader><CardTitle>Edit Image Prompt</CardTitle></CardHeader>
          <CardContent>
            <ImagePromptForm
              initialData={{
                image: data.image,
                style: typeof data.style === 'object' ? data.style._id : data.style,
                image_prompt: data.image_prompt,
                is_active: data.is_active,
              }}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => router.push("/dashboard/image-prompts")}
            />
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}