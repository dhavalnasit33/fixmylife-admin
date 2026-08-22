"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import apiService from "@/lib/apiService";
import {
  type AIProviderConfig,
  type SingleResponse,
  type AIProviderConfigFormValues,
  AIProviderComparison,
  AIProviderComparisonFormValues,
} from "@/types"; // Updated types
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import AIProviderComparisonForm from "./AIProviderComparisonForm";

interface EditAIProviderComparisonDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  aiProviderComparisonConfig: string | null;
  onSuccess: () => void;
}

export default function EditAIProviderComparisonDialog({
  isOpen,
  onOpenChange,
  aiProviderComparisonConfig,
  onSuccess,
}: EditAIProviderComparisonDialogProps) {
  const { toast } = useToast();
  const [
    aiProviderComparisonConfigFormValues,
    setAiProviderComparisonConfigFormValues,
  ] = useState<AIProviderComparison | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    if (isOpen && aiProviderComparisonConfig) {
      setIsLoadingData(true);
      setAiProviderComparisonConfigFormValues(null);
      apiService<SingleResponse<AIProviderComparison>>(
        `/ai-comparison/${aiProviderComparisonConfig}`
      )
        .then((response) => {
          if (response.success) {
            setAiProviderComparisonConfigFormValues(response.data);
            setIsLoadingData(false);
          } else {
            toast({
              title: "Error",
              description:
                response.message ||
                "Failed to load AI provider comparison config details.",
              variant: "destructive",
            });
          }
        })
        .catch((error) => {
          toast({
            title: "Error",
            description:
              error.message ||
              "Could not load AI provider comparison config details.",
            variant: "destructive",
          });
        })
        .finally(() => setIsLoadingData(false));
    } else if (!isOpen) {
      setAiProviderComparisonConfigFormValues(null);
    }
  }, [isOpen, aiProviderComparisonConfig, toast]);

  const handleSubmit = async (values: AIProviderComparisonFormValues) => {
    console.log("🚀 ~ handleSubmit ~ values:", values);
    if (!aiProviderComparisonConfigFormValues?._id) return;
    setIsSubmitting(true);
    try {
      const responce = await apiService<SingleResponse<any>>(
        `/ai-comparison/${aiProviderComparisonConfigFormValues._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      );
      console.log("🚀 ~ handleSubmit ~ responce:", responce);

      if (responce.success) {
        toast({
          title: "Success",
          description:
            responce.message ||
            "AI provider comparison config updated successfully.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description:
            responce.message ||
            "Failed to update AI provider comparison config.",
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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setAiProviderComparisonConfigFormValues(null);
      }}
    >
      <DialogContent className="sm:max-w-lg md:max-w-4xl">
        <DialogHeader>
          <DialogTitle>AI Provider Comparison Configuration</DialogTitle>
          <DialogDescription>
            Modify the details for &quot;
            {aiProviderComparisonConfigFormValues?.firstModel?.title ||
              "this provider comparison config"}
            &quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[70vh] overflow-y-auto pr-2">
          {isLoadingData ||
          (!aiProviderComparisonConfigFormValues &&
            isOpen &&
            aiProviderComparisonConfig) ? (
            <div className="space-y-4 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-1/3 ml-auto" />
            </div>
          ) : aiProviderComparisonConfigFormValues ? (
            <AIProviderComparisonForm
              initialData={{
                modelId: aiProviderComparisonConfigFormValues.modelId._id,
                firstModel: aiProviderComparisonConfigFormValues.firstModel._id,
                secondModel:
                  aiProviderComparisonConfigFormValues.secondModel._id,
                title: aiProviderComparisonConfigFormValues.title,
                slug: aiProviderComparisonConfigFormValues.slug,
                keyPhrase: aiProviderComparisonConfigFormValues.keyPhrase,
                short_description: aiProviderComparisonConfigFormValues.short_description || "",
                description: aiProviderComparisonConfigFormValues.description,
                metaDescription:
                  aiProviderComparisonConfigFormValues.metaDescription,
                coverImage: aiProviderComparisonConfigFormValues.coverImage,
                is_active: aiProviderComparisonConfigFormValues.is_active,
                type: (aiProviderComparisonConfigFormValues as any).type,
                categories: aiProviderComparisonConfigFormValues.categories || [],
                tags: aiProviderComparisonConfigFormValues.tags || [],
              }}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => onOpenChange(false)}
            />
          ) : (
            <p className="text-center text-muted-foreground p-8">
              Select a provider comparison configuration to edit.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
