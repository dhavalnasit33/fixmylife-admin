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
import type { ImagePrompt, SingleResponse } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface DeleteImagePromptDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: ImagePrompt | null;
  onSuccess: () => void;
}

export default function DeleteImagePromptDialog({
  isOpen,
  onOpenChange,
  prompt,
  onSuccess,
}: DeleteImagePromptDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!prompt?._id) return;
    setIsDeleting(true);
    try {
      const response = await apiService<SingleResponse<null>>(
        `/image-prompts/${prompt._id}`,
        { method: "DELETE" }
      );

      if (response.success) {
        toast({ title: "Success", description: "Image prompt deleted successfully." });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({ title: "Error", description: response.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} onClick={() => onOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isDeleting ? "Deleting..." : "Yes, delete prompt"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}