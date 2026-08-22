"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import VideoPromptForm from "@/components/dashboard/video-prompts/VideoPromptForm";
import apiService from "@/lib/apiService";
import type { SingleResponse, VideoPrompt, VideoPromptFormValues } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ProtectedPage from "@/components/shared/ProtectedPage";

export default function EditVideoPromptPage() {
  const router = useRouter();
  const { id } = useParams();
  const [data, setData] = useState<VideoPrompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await apiService<SingleResponse<VideoPrompt>>(`/video-prompts/${id}`, { method: "GET" });
        setData(res.data);
      } catch (e) {
        toast({ title: "Error", description: "Failed to load data.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    if (id) fetchData();
  }, [id, toast]);

  const handleSubmit = async (values: VideoPromptFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<VideoPrompt>>(`/video-prompts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.success) {
        toast({ title: "Success", description: "Video prompt updated successfully." });
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

  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>Not found</div>;

  return (
    <ProtectedPage requiredPermission="editVideoPromptMenu">
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader><CardTitle>Edit Video Prompt</CardTitle></CardHeader>
          <CardContent>
            <VideoPromptForm
              initialData={{
                image: data.image,
                video: data.video,
                style: typeof data.style === 'object' ? data.style._id : data.style,
                video_prompt: data.video_prompt,
                short_video_prompt: data.short_video_prompt,
                is_active: data.is_active,
              }}
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
