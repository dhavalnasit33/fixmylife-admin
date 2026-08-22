"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import PromptDataForm from "@/components/dashboard/prompt-data/PromptDataForm";
import apiService from "@/lib/apiService";
import type { SingleResponse, PromptData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ProtectedPage from "@/components/shared/ProtectedPage";

export default function EditPromptDataPage() {
  const router = useRouter();
  const { id } = useParams();
  const [data, setData] = useState<PromptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await apiService<SingleResponse<PromptData>>(`/prompt-data/${id}`, { method: "GET" });
        setData(res.data);
      } catch (e) {
        toast({ title: "Error", description: "Failed to load data.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    if (id) fetchData();
  }, [id, toast]);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<PromptData>>(`/prompt-data/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.success) {
        toast({ title: "Success", description: "Prompt data updated successfully." });
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

  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>Not found</div>;

  return (
    <ProtectedPage requiredPermission="editPromptData">
      <div className="container">
        <Card>
          <CardHeader><CardTitle>Edit Prompt Data</CardTitle></CardHeader>
          <CardContent>
            <PromptDataForm
              initialData={{
                ...data,
                // Ensure categories are mapped to just IDs for the form
                category: data.category.map((c: any) => c._id || c),
              }}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => router.push("/dashboard/prompt-data")}
            />
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}