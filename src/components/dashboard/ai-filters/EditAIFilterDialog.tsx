"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService";
import { AIFilter, AIFilterFormValues, SingleResponse } from "@/types";
import AIFilterForm from "./AIFilterForm";
import { Loader2 } from "lucide-react";

interface EditAIFilterDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  filterId: string | null;
}

export default function EditAIFilterDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  filterId,
}: EditAIFilterDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<AIFilterFormValues | null>(null);

  useEffect(() => {
    async function fetchFilter() {
      if (!filterId || !isOpen) return;
      setIsLoading(true);
      try {
        const res = await apiService<SingleResponse<AIFilter>>(`/ai-filters/${filterId}`);
        if (res.success && res.data) {
          setInitialData({
            name: res.data.name,
            image: res.data.image,
            original_image: res.data.original_image || "",
            description: res.data.description || "",
            strength: res.data.strength ?? 0.85,
            is_active: res.data.is_active,
          });
        } else {
          toast({
            title: "Error",
            description: res.message || "Failed to fetch AI Filter.",
            variant: "destructive",
          });
          onOpenChange(false);
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "An unexpected error occurred.",
          variant: "destructive",
        });
        onOpenChange(false);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFilter();
  }, [filterId, isOpen, toast, onOpenChange]);

  const handleSubmit = async (values: AIFilterFormValues) => {
    if (!filterId) return;
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<AIFilter>>(
        `/ai-filters/${filterId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );

      if (response.success) {
        toast({
          title: "Success",
          description: "AI Filter updated successfully.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update filter.",
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
          <DialogTitle>Edit AI Filter</DialogTitle>
          <DialogDescription>
            Update the AI filter details.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          initialData && (
            <AIFilterForm
              initialData={initialData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => onOpenChange(false)}
              submitLabel="Update Filter"
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
