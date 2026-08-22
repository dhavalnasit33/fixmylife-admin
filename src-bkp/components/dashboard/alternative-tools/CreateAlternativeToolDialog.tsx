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
import AlternativeToolForm  from "./AlternativeToolForm";
import { AlternativeTool, AlternativeToolFormValues, SingleResponse } from "@/types";

interface CreateAlternativeToolDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateAlternativeToolDialog({
  isOpen,
  onOpenChange,
  onSuccess,
}: CreateAlternativeToolDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: AlternativeToolFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<AlternativeTool>>("/alternative-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Alternative tool created successfully.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create tool.",
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Alternative Tool</DialogTitle>
          <DialogDescription>
            Add a new alternative tool to the list.
          </DialogDescription>
        </DialogHeader>
        <AlternativeToolForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => onOpenChange(false)}
          submitLabel="Create Tool"
        />
      </DialogContent>
    </Dialog>
  );
}
