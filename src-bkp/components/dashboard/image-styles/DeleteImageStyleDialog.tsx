"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService";
import { SingleResponse } from "@/types";

interface DeleteImageStyleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  style: { _id: string; name: string } | null;
  onSuccess: () => void;
}

export default function DeleteImageStyleDialog({
  isOpen,
  onOpenChange,
  style,
  onSuccess,
}: DeleteImageStyleDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!style) return;
    setIsDeleting(true);
    try {
      const response = await apiService<SingleResponse<null>>(
        `/image-styles/${style._id}`,
        { method: "DELETE" }
      );

      if (response.success) {
        toast({ title: "Success", description: "Style deleted successfully." });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete style.",
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
      setIsDeleting(false);
    }
  };

  if (!style) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {style.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            style.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} onClick={() => onOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}