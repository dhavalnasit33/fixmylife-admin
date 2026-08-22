"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import CodingPromptTopicForm from "@/components/dashboard/coding-prompt-topics/CodingPromptTopicForm";
import apiService from "@/lib/apiService";
import type { SingleResponse, CodingPromptTopic, CodingPromptTopicFormValues } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ProtectedPage from "@/components/shared/ProtectedPage";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditCodingTopicPage() {
  const router = useRouter();
  const { id } = useParams();
  const [data, setData] = useState<CodingPromptTopic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await apiService<SingleResponse<CodingPromptTopic>>(`/coding-prompt-topics/${id}`, { method: "GET" });
        setData(res.data);
      } catch (e) {
        toast({ title: "Error", description: "Failed to load data.", variant: "destructive" });
        router.push("/dashboard/coding-prompt-topics");
      } finally {
        setIsLoading(false);
      }
    }
    if (id) fetchData();
  }, [id, toast, router]);

  const handleSubmit = async (values: CodingPromptTopicFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<CodingPromptTopic>>(`/coding-prompt-topics/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.success) {
        toast({ title: "Success", description: "Topic updated successfully." });
        router.push("/dashboard/coding-prompt-topics");
      } else {
        toast({ title: "Error", description: response.message, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="container py-6"><Skeleton className="h-[600px] w-full" /></div>;
  if (!data) return <div>Not found</div>;

  return (
    <ProtectedPage requiredPermission="editPromptData">
      <div className="container ">
        <Card>
          <CardHeader>
            <CardTitle>Edit Coding Prompt Topic</CardTitle>
          </CardHeader>
          <CardContent>
            <CodingPromptTopicForm
              initialData={{
                title: data.title,
                description: data.description,
                icon: data.icon,
                is_active: data.is_active,
                // Ensure subtopics map correctly, adding default empty string for optional fields if null
                subtopics: data.subtopics.map(s => ({
                    title: s.title,
                    description: s.description || "",
                    icon: s.icon || "",
                    prompt_template: s.prompt_template || ""
                }))
              }}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => router.push("/dashboard/coding-prompt-topics")}
            />
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}