"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ToolCategoryForm, {
  ToolCategoryFormValues,
} from "@/components/dashboard/tool-categories/ToolCategoryForm";
import apiService from "@/lib/apiService";
import { SingleResponse, ToolCategory } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';

export default function CreateToolCategoryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
   const { toast } = useToast();

   const handleSubmit = async (values: ToolCategoryFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<ToolCategory>>(
        '/tool-categories',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        }
      );

      if (response.success) {
        toast({
          title: 'Success',
          description:
            response.message || 'Tool category created successfully.',
        });
        router.push('/dashboard/tool-categories');
      } else {
        toast({
          title: 'Error',
          description:
            response.message || 'Failed to create tool category.',
          variant: 'destructive',
        });
      }
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      setError('Failed to create category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <Card>
        <CardHeader>
          <CardTitle>Create Tool Category</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <ToolCategoryForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => router.push("/dashboard/tool-categories")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
