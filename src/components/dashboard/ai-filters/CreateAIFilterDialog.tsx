"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService";
import AIFilterForm  from "./AIFilterForm";
import { AIFilter, AIFilterFormValues, SingleResponse } from "@/types";

interface CreateAIFilterDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateAIFilterDialog({
  isOpen,
  onOpenChange,
  onSuccess,
}: CreateAIFilterDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: AIFilterFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<AIFilter>>("/ai-filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "AI Filter created successfully.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create AI filter.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New AI Filter</DialogTitle>
          <DialogDescription>
            Add a new AI filter for the image & video styling tools.
          </DialogDescription>
        </DialogHeader>
        <AIFilterForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => onOpenChange(false)}
          submitLabel="Create Filter"
        />
      </DialogContent>
    </Dialog>
  );
}
