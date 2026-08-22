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
import apiService from "@/lib/apiService";
import type { HomeToolTag, SingleResponse } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface DeleteHomeToolTagDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  tag: HomeToolTag | null;
  onSuccess: () => void;
}

export default function DeleteHomeToolTagDialog({
  isOpen,
  onOpenChange,
  tag,
  onSuccess,
}: DeleteHomeToolTagDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!tag?._id) return;
    setIsDeleting(true);

    try {
      const response = await apiService<SingleResponse<null>>(
        `/home-tool-tags/${tag._id}`,
        { method: "DELETE" }
      );

      if (response.success) {
        toast({
          title: "Success",
          description:
            response.message || "Home tool tag deleted successfully.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description:
            response.message ||
            "Failed to delete tag. It may be associated with tools.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "An unexpected error occurred while deleting.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!tag) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this home tool tag?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Yes, delete tag"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
