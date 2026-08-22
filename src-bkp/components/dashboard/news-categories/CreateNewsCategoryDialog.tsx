"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import NewsCategoryForm from "./NewsCategoryForm";
import apiService from "@/lib/apiService";
import type {
  NewsCategory,
  NewsCategoryFormValues,
  SingleResponse,
} from "@/types";
import { useToast } from "@/hooks/use-toast";

interface CreateNewsCategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  categories?: NewsCategory[];
}

export default function CreateNewsCategoryDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  categories = [],
}: CreateNewsCategoryDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: NewsCategoryFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<NewsCategory>>(
        "/news-categories",
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
          description:
            response.message || "News category created successfully.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create news category.",
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
       <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create News Category</DialogTitle>
          <DialogDescription>
            Fill out the form to add a new news category.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <NewsCategoryForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
            categories={categories}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
