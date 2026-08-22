"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useState } from "react";
import apiService from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";
import type {
  NewsCategory,
  SingleResponse,
  TrendingNews,
  TrendingNewsFormValues,
} from "@/types";
import TrendingNewsForm from "./TrendingNewsForm";

interface CreateTrendingNewsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  toolCategories: NewsCategory[];
}

export default function CreateTrendingNewsDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  toolCategories,
}: CreateTrendingNewsDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: TrendingNewsFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<TrendingNews>>(
        "/trending-news",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      );

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Trending News created.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create news.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Trending News</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Fill in the details to create a new trending news
        </DialogDescription>
        <TrendingNewsForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => onOpenChange(false)}
          toolCategories={toolCategories}
        />
      </DialogContent>
    </Dialog>
  );
}
