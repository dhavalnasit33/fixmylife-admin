"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService"; 
import { ImageStyle, ImageStyleFormValues, SingleResponse } from "@/types";
import ImageStyleForm from "./ImageStyleForm";

interface EditImageStyleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  styleId: string | null;
  onSuccess: () => void;
}

export default function EditImageStyleDialog({
  isOpen,
  onOpenChange,
  styleId,
  onSuccess,
}: EditImageStyleDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<ImageStyleFormValues | null>(null);

  useEffect(() => {
    if (isOpen && styleId) {
      setIsLoading(true);
      apiService<SingleResponse<any>>(`/image-styles/${styleId}`)
        .then((res) => {
          if (res.success && res.data) {
            setInitialData({
              name: res.data.name,
              image: res.data.image,
              type: res.data.type || "image",
              is_active: res.data.is_active,
            });
          }
        })
        .catch(() => {
          toast({
            title: "Error",
            description: "Failed to fetch style details.",
            variant: "destructive",
          });
          onOpenChange(false);
        })
        .finally(() => setIsLoading(false));
    } else {
      setInitialData(null);
    }
  }, [isOpen, styleId, toast, onOpenChange]);

  const handleSubmit = async (values: ImageStyleFormValues) => {
    if (!styleId) return;
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<ImageStyle>>(
        `/image-styles/${styleId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );

      if (response.success) {
        toast({
          title: "Success",
          description: "Image style updated successfully.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update style.",
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
          <DialogTitle>Edit Style</DialogTitle>
          <DialogDescription>Modify existing style details.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          initialData && (
            <ImageStyleForm
              initialData={initialData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => onOpenChange(false)}
              submitLabel="Save Changes"
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
}