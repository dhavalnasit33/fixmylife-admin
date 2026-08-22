"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ImagePromptForm from "@/components/dashboard/image-prompts/ImagePromptForm";
import apiService from "@/lib/apiService";
import { SingleResponse, ImagePrompt, ImagePromptFormValues } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ProtectedPage from "@/components/shared/ProtectedPage";

export default function CreateImagePromptPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (values: ImagePromptFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<ImagePrompt>>("/image-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.success) {
        toast({ title: "Success", description: "Image prompt created successfully." });
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

  return (
    <ProtectedPage requiredPermission="createImagePromptMenu">
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader><CardTitle>Create Image Prompt</CardTitle></CardHeader>
          <CardContent>
            <ImagePromptForm onSubmit={handleSubmit} isSubmitting={isSubmitting} onCancel={() => router.push("/dashboard/image-prompts")} />
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}