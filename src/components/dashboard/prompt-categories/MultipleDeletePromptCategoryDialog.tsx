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

interface MultipleDeletePromptCategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categories: { id: string; name: string }[];
  onSuccess: () => void;
}

export default function MultipleDeletePromptCategoryDialog({
  isOpen,
  onOpenChange,
  categories,
  onSuccess,
}: MultipleDeletePromptCategoryDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!categories || categories.length === 0) return;
    setIsDeleting(true);
    try {
      const response = await apiService<SingleResponse<null>>(
        "/prompt-categories/bulk-delete",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: categories.map((c) => c.id) }),
        }
      );

      if (response.success) {
        toast({ title: "Success", description: "Prompt categories deleted successfully." });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({ title: "Error", description: response.message || "Failed to delete categories.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!categories) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {categories.length} prompt categories? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} onClick={() => onOpenChange(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isDeleting ? "Deleting..." : "Yes, delete categories"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}