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
import ImageStyleForm  from "./ImageStyleForm";
import { ImageStyle, ImageStyleFormValues, SingleResponse } from "@/types";

interface CreateImageStyleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateImageStyleDialog({
  isOpen,
  onOpenChange,
  onSuccess,
}: CreateImageStyleDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: ImageStyleFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<ImageStyle>>("/image-styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Image style created successfully.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create style.",
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
          <DialogTitle>Create Style</DialogTitle>
          <DialogDescription>
            Add a new visual style for content generation.
          </DialogDescription>
        </DialogHeader>
        <ImageStyleForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => onOpenChange(false)}
          submitLabel="Create Style"
        />
      </DialogContent>
    </Dialog>
  );
}