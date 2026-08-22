"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PromptDataForm from "@/components/dashboard/prompt-data/PromptDataForm";
import apiService from "@/lib/apiService";
import { SingleResponse, PromptData, PromptDataFormValues } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ProtectedPage from "@/components/shared/ProtectedPage";

export default function CreatePromptDataPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (values: PromptDataFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<PromptData>>("/prompt-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.success) {
        toast({ title: "Success", description: "Prompt data created successfully." });
        router.push("/dashboard/prompt-data");
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
          <CardHeader><CardTitle>Create Prompt Data</CardTitle></CardHeader>
          <CardContent>
            <PromptDataForm onSubmit={handleSubmit} isSubmitting={isSubmitting} onCancel={() => router.push("/dashboard/prompt-data")} />
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}