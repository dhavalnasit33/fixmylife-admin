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
    DiscoverRecipe,
  DiscoverRecipeCollection,
  DiscoverRecipeCollectionFormValues,
  SingleResponse,
} from "@/types";
import DiscoverRecipeCollectionForm from "./DiscoverRecipeCollectionForm";

interface CreateDiscoverRecipeCollectionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  recipes: DiscoverRecipe[];
}

export default function CreateDiscoverRecipeCollectionDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  recipes,
}: CreateDiscoverRecipeCollectionDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: DiscoverRecipeCollectionFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<DiscoverRecipeCollection>>(
        "/discover-recipe-collections",
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
            response.message || "Discover Recipe Collection created.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description:
            response.message || "Failed to create recipe collection.",
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
          <DialogTitle>Create Discover Recipe Collection</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Fill in the details to create a new discover recipe collection.
        </DialogDescription>
        <DiscoverRecipeCollectionForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => onOpenChange(false)}
          recipes={recipes}
        />
      </DialogContent>
    </Dialog>
  );
}
