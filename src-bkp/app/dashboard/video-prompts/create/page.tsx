"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import VideoPromptForm from "@/components/dashboard/video-prompts/VideoPromptForm";
import apiService from "@/lib/apiService";
import { SingleResponse, VideoPrompt, VideoPromptFormValues } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ProtectedPage from "@/components/shared/ProtectedPage";

export default function CreateVideoPromptPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (values: VideoPromptFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<VideoPrompt>>("/video-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.success) {
        toast({ title: "Success", description: "Video prompt created successfully." });
        router.push("/dashboard/video-prompts");
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
    <ProtectedPage requiredPermission="createVideoPromptMenu">
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader><CardTitle>Create Video Prompt</CardTitle></CardHeader>
          <CardContent>
            <VideoPromptForm 
                onSubmit={handleSubmit} 
                isSubmitting={isSubmitting} 
                onCancel={() => router.push("/dashboard/video-prompts")} 
            />
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}
