"use client";

import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";
import AIProviderComparisonForm from "./AIProviderComparisonForm"; // updated form path
import apiService from "@/lib/apiService";
import type { AIProviderComparisonFormValues, SingleResponse } from "@/types";

interface CreateAIProviderComparisonDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
}

export default function CreateAIProviderComparisonDialog({
  isOpen,
  onOpenChange,
  onSuccess,
}: CreateAIProviderComparisonDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: AIProviderComparisonFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<any>>("/ai-comparison", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (
        response.success ||
        response.message?.toLowerCase().includes("success")
      ) {
        toast({
          title: "Success",
          description: response.message || "Comparison created successfully.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create comparison.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create AI Provider Comparison</DialogTitle>
          <DialogDescription>
            Create a direct comparison between two AI providers to analyze their
            responses side-by-side.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 pr-2 overflow-y-auto max-h-[70vh]">
          <AIProviderComparisonForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
