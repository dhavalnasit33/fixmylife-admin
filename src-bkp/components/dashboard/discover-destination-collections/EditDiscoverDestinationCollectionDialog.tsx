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
  DiscoverDestinationCollection,
  DiscoverDestinationCollectionFormValues,
  DiscoverDestination,
  SingleResponse,
} from "@/types";
import DiscoverDestinationCollectionForm from "./DiscoverDestinationCollectionForm";

interface EditDiscoverDestinationCollectionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  id: string | null;
  onSuccess: () => void;
  destinations: DiscoverDestination[];
}

export default function EditDiscoverDestinationCollectionDialog({
  isOpen,
  onOpenChange,
  id,
  onSuccess,
  destinations,
}: EditDiscoverDestinationCollectionDialogProps) {
  const { toast } = useToast();
  const [initialData, setInitialData] =
    useState<DiscoverDestinationCollectionFormValues | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && id) {
      // Reset before fetching new data
      setInitialData(null);

      apiService<SingleResponse<DiscoverDestinationCollection>>(
        `/discover-destination-collections/${id}`
      )
        .then((res) => {
          if (res.success) {
            setInitialData({
              title: res.data.title,
              description: res.data.description || "",
              image: res.data.image,
              max_tokens: res.data.max_tokens || 4000,
              system_prompt: res.data.system_prompt || "",
              discover_destinations: (res.data.discover_destinations || []).map(
                (d: any) => (typeof d === "string" ? d : d._id)
              ),
              is_active: res.data.is_active,
            });
          } else {
            toast({
              title: "Error",
              description: "Failed to load destination collection.",
              variant: "destructive",
            });
          }
        })
        .catch(() =>
          toast({
            title: "Error",
            description: "Failed to load destination collection.",
            variant: "destructive",
          })
        );
    }
  }, [id, isOpen, toast]);

  const handleSubmit = async (
    values: DiscoverDestinationCollectionFormValues
  ) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      const response = await apiService<
        SingleResponse<DiscoverDestinationCollection>
      >(`/discover-destination-collections/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Destination collection updated.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description:
            response.message || "Failed to update destination collection.",
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
          <DialogTitle>Edit Discover Destination Collection</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Update the details of this discover destination collection.
        </DialogDescription>
        {initialData ? (
          <DiscoverDestinationCollectionForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
            destinations={destinations}
          />
        ) : (
          <p className="text-center text-muted-foreground">Loading...</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
