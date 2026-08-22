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
  DiscoverRecipeCollection,
  DiscoverRecipeCollectionFormValues,
  DiscoverRecipe,
  SingleResponse,
} from "@/types";
import DiscoverRecipeCollectionForm from "./DiscoverRecipeCollectionForm";

interface EditDiscoverRecipeCollectionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  id: string | null;
  onSuccess: () => void;
  recipes: DiscoverRecipe[];
}

export default function EditDiscoverRecipeCollectionDialog({
  isOpen,
  onOpenChange,
  id,
  onSuccess,
  recipes,
}: EditDiscoverRecipeCollectionDialogProps) {
  const { toast } = useToast();
  const [initialData, setInitialData] =
    useState<DiscoverRecipeCollectionFormValues | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && id) {
      // Reset before fetching new data
      setInitialData(null);

      apiService<SingleResponse<DiscoverRecipeCollection>>(
        `/discover-recipe-collections/${id}`
      )
        .then((res) => {
          if (res.success) {
            // Map backend data to form values if needed
            setInitialData({
              title: res.data.title,
              description: res.data.description || "",
               max_tokens: res.data.max_tokens || 4000,
                system_prompt: res.data.system_prompt || "",
              image: res.data.image,
              discover_recipes: (res.data.discover_recipes || []).map(
                (r: any) => (typeof r === "string" ? r : r._id)
              ),
              is_active: res.data.is_active,
            });
          } else {
            toast({
              title: "Error",
              description: "Failed to load collection.",
              variant: "destructive",
            });
          }
        })
        .catch(() =>
          toast({
            title: "Error",
            description: "Failed to load collection.",
            variant: "destructive",
          })
        );
    }
  }, [id, isOpen, toast]);

  const handleSubmit = async (values: DiscoverRecipeCollectionFormValues) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      const response = await apiService<
        SingleResponse<DiscoverRecipeCollection>
      >(`/discover-recipe-collections/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Collection updated.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update collection.",
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
          <DialogTitle>Edit Discover Recipe Collection</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Update the details of this discover recipe collection.
        </DialogDescription>
        {initialData ? (
          <DiscoverRecipeCollectionForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
            recipes={recipes}
          />
        ) : (
          <p className="text-center text-muted-foreground">Loading...</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
