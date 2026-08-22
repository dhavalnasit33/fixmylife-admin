"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import CodingPromptTopicForm from "@/components/dashboard/coding-prompt-topics/CodingPromptTopicForm";
import apiService from "@/lib/apiService";
import { SingleResponse, CodingPromptTopic, CodingPromptTopicFormValues } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ProtectedPage from "@/components/shared/ProtectedPage";

export default function CreateCodingTopicPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (values: CodingPromptTopicFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<CodingPromptTopic>>("/coding-prompt-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.success) {
        toast({ title: "Success", description: "Coding Topic created." });
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

  return (
    <ProtectedPage requiredPermission="createPromptData">
      <div className="container">
        <Card>
          <CardHeader>
            <CardTitle>Create Coding Prompt Topic</CardTitle>
          </CardHeader>
          <CardContent>
            <CodingPromptTopicForm
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