"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import AIProviderForm from "./AIProviderForm";
import apiService from "@/lib/apiService";
import type {
  AIProviderConfig,
  SingleResponse,
  AIProviderConfigFormValues,
} from "@/types"; // Updated types
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface EditAIProviderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  providerConfigId: string | null; // ID of the AIProviderConfig
  onSuccess: () => void;
}

export default function EditAIProviderDialog({
  isOpen,
  onOpenChange,
  providerConfigId,
  onSuccess,
}: EditAIProviderDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [currentData, setCurrentData] = useState<AIProviderConfig | null>(null); // Updated type

  useEffect(() => {
    if (isOpen && providerConfigId) {
      setIsLoadingData(true);
      setCurrentData(null);
      apiService<SingleResponse<AIProviderConfig>>(
        `/ai-providers/${providerConfigId}`
      ) // Fetch AIProviderConfig
        .then((response) => {
          if (response.success && response.data) {
            setCurrentData(response.data);
          } else {
            toast({
              title: "Error",
              description:
                response.message ||
                "Failed to load AI provider config details.",
              variant: "destructive",
            });
            onOpenChange(false);
          }
        })
        .catch((err) => {
          toast({
            title: "Error",
            description: err.message || "Could not load AI provider config.",
            variant: "destructive",
          });
          onOpenChange(false);
        })
        .finally(() => setIsLoadingData(false));
    } else if (!isOpen) {
      setCurrentData(null);
    }
  }, [isOpen, providerConfigId, toast, onOpenChange]);

  const handleSubmit = async (values: AIProviderConfigFormValues) => {
    // Updated type
    if (!currentData?._id) return;
    setIsSubmitting(true);

    const payload: Partial<AIProviderConfigFormValues> = { ...values };
    if (!values.api_key || values.api_key.trim() === "") {
      delete payload.api_key;
    }
    if (!values.base_url || values.base_url.trim() === "") {
      delete payload.base_url;
    }

    try {
      const response = await apiService<SingleResponse<AIProviderConfig>>(
        `/ai-providers/${currentData._id}`,
        {
          // Updated type
          method: "PUT",
          body: payload,
        }
      );

      if (response.success) {
        toast({
          title: "Success",
          description:
            response.message ||
            "AI Provider Configuration updated successfully.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description:
            response.message || "Failed to update AI Provider Configuration.",
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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setCurrentData(null);
      }}
    >
      <DialogContent className="sm:max-w-lg md:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit AI Provider Configuration</DialogTitle>
          <DialogDescription>
            Modify the details for &quot;
            {currentData?.display_name || "this provider config"}&quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[70vh] overflow-y-auto pr-2">
          {isLoadingData || (!currentData && isOpen && providerConfigId) ? (
            <div className="space-y-4 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-1/3 ml-auto" />
            </div>
          ) : currentData ? (
            <AIProviderForm
              initialData={currentData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => {
                onOpenChange(false);
                setCurrentData(null);
              }}
            />
          ) : (
            <p className="text-center text-muted-foreground p-8">
              Select a provider configuration to edit.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
