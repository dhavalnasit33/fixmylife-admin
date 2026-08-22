"use client";

import { useEffect, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";

interface EditNewsCategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  category: NewsCategory | null;
  onSuccess: () => void;
  categories?: NewsCategory[];
}

export default function EditNewsCategoryDialog({
  isOpen,
  onOpenChange,
  category,
  onSuccess,
  categories = [],
}: EditNewsCategoryDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<NewsCategoryFormValues | null>(null);

  useEffect(() => {
    if (isOpen && category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        slug: category.slug || "",
        icon: category.icon || "",
        is_active: category.is_active,
         is_popular: category.is_popular|| false,
        parent:
          typeof category.parent === "string"
            ? category.parent
            : category.parent?._id || "none",
      });
    } else if (!isOpen) {
      setFormData(null);
    }
  }, [isOpen, category]);

  const handleSubmit = async (values: NewsCategoryFormValues) => {
    if (!category?._id) return;
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<NewsCategory>>(
        `/news-categories/${category._id}`,
        {
          method: "PUT",
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
            response.message || "News category updated successfully.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update news category.",
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
          <DialogTitle>Edit News Category</DialogTitle>
          <DialogDescription>
            Update the details for &quot;{category?.name || "this category"}
            &quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {!category ? (
            <p>No category selected.</p>
          ) : !formData ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <NewsCategoryForm
              initialData={formData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => onOpenChange(false)}
              categories={categories}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
