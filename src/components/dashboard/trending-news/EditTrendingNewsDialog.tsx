"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import apiService from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";
import type {
  NewsCategory,
  SingleResponse,
  TrendingNews,
  TrendingNewsFormValues,
} from "@/types";
import TrendingNewsForm from "./TrendingNewsForm";

interface EditTrendingNewsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  id: string | null;
  onSuccess: () => void;
  toolCategories: NewsCategory[];
}

export default function EditTrendingNewsDialog({
  isOpen,
  onOpenChange,
  id,
  onSuccess,
  toolCategories,
}: EditTrendingNewsDialogProps) {
  const { toast } = useToast();
  const [initialData, setInitialData] = useState<TrendingNews | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && id) {
      // Reset before fetching new data
      setInitialData(null);

      apiService<SingleResponse<TrendingNews>>(`/trending-news/${id}`)
        .then((res) => {
          if (res.success) {
            setInitialData(res.data);
          } else {
            toast({
              title: "Error",
              description: "Failed to load news.",
              variant: "destructive",
            });
          }
        })
        .catch(() =>
          toast({
            title: "Error",
            description: "Failed to load news.",
            variant: "destructive",
          })
        );
    }
  }, [id, isOpen, toast]);

  const handleSubmit = async (values: TrendingNewsFormValues) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<TrendingNews>>(
        `/trending-news/${id}`,
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
          description: response.message || "News updated.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update news.",
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
          <DialogTitle>Edit Trending News</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Update the details of this trending news item.
        </DialogDescription>
        {initialData ? (
          <TrendingNewsForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
            toolCategories={toolCategories}
          />
        ) : (
          <p className="text-center text-muted-foreground">Loading...</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
