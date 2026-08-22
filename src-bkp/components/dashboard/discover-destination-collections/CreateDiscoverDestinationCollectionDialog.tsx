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
  DiscoverDestination,
  DiscoverDestinationCollection,
  DiscoverDestinationCollectionFormValues,
  SingleResponse,
} from "@/types";
import DiscoverDestinationCollectionForm from "./DiscoverDestinationCollectionForm";

interface CreateDiscoverDestinationCollectionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  destinations: DiscoverDestination[];
}

export default function CreateDiscoverDestinationCollectionDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  destinations,
}: CreateDiscoverDestinationCollectionDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: DiscoverDestinationCollectionFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<
        SingleResponse<DiscoverDestinationCollection>
      >("/discover-destination-collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.success) {
        toast({
          title: "Success",
          description:
            response.message || "Discover Destination Collection created.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description:
            response.message || "Failed to create destination collection.",
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
          <DialogTitle>Create Discover Destination Collection</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Fill in the details to create a new discover destination collection.
        </DialogDescription>
        <DiscoverDestinationCollectionForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => onOpenChange(false)}
          destinations={destinations}
        />
      </DialogContent>
    </Dialog>
  );
}
