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
import type { PromptData, SingleResponse } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface DeletePromptDataDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  prompt: PromptData | null;
  onSuccess: () => void;
}

export default function DeletePromptDataDialog({
  isOpen,
  onOpenChange,
  prompt,
  onSuccess,
}: DeletePromptDataDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!prompt?._id) return;
    setIsDeleting(true);
    try {
      const response = await apiService<SingleResponse<null>>(
        `/prompt-data/${prompt._id}`,
        { method: "DELETE" }
      );

      if (response.success) {
        toast({
          title: "Success",
          description:
            response.message || "Prompt data deleted successfully.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description:
            response.message || "Failed to delete prompt data.",
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

  if (!prompt) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the prompt "{prompt.name}"? This action cannot be undone.
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
            {isDeleting ? "Deleting..." : "Yes, delete prompt"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}