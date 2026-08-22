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
import { AlternativeTool, AlternativeToolFormValues, SingleResponse } from "@/types";
import AlternativeToolForm from "./AlternativeToolForm";

interface EditAlternativeToolDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  toolId: string | null;
  onSuccess: () => void;
}

export default function EditAlternativeToolDialog({
  isOpen,
  onOpenChange,
  toolId,
  onSuccess,
}: EditAlternativeToolDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<AlternativeToolFormValues | null>(null);

  useEffect(() => {
    if (isOpen && toolId) {
      setIsLoading(true);
      apiService<SingleResponse<any>>(`/alternative-tools/${toolId}`)
        .then((res) => {
          if (res.success && res.data) {
            setInitialData({
              name: res.data.name,
              description: res.data.description || "",
              image: res.data.image || "",
              price: res.data.price,
              is_active: res.data.is_active,
            });
          }
        })
        .catch(() => {
          toast({
            title: "Error",
            description: "Failed to fetch tool details.",
            variant: "destructive",
          });
          onOpenChange(false);
        })
        .finally(() => setIsLoading(false));
    } else {
      setInitialData(null);
    }
  }, [isOpen, toolId, toast, onOpenChange]);

  const handleSubmit = async (values: AlternativeToolFormValues) => {
    if (!toolId) return;
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<AlternativeTool>>(
        `/alternative-tools/${toolId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );

      if (response.success) {
        toast({
          title: "Success",
          description: "Alternative tool updated successfully.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update tool.",
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
          <DialogTitle>Edit Alternative Tool</DialogTitle>
          <DialogDescription>Modify existing tool details.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          initialData && (
            <AlternativeToolForm
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
