'use client';

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
import { useState } from "react";

interface MultipleDeleteMarketingCategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categories: { id: string; name: string }[] | any;
  onSuccess: () => void;
}

export default function MultipleDeleteMarketingCategoryDialog({
  isOpen,
  onOpenChange,
  categories,
  onSuccess,
}: MultipleDeleteMarketingCategoryDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!categories || categories.length === 0) return;

    setIsDeleting(true);
    try {
      const response = await apiService<SingleResponse<null>>(
        "/marketing-categories",
        {
          method: "DELETE",
          body: categories, // array of { id, name }
        }
      );

      if (response.success) {
        toast({
          title: "Success",
          description:
            response.message || "Marketing categories deleted successfully.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description:
            response.message || "Failed to delete marketing categories.",
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

  if (!categories) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            <span>
              This action cannot be undone. This will permanently delete the following marketing categories:{" "}
              {Array.isArray(categories) &&
                categories.map((item, index) => (
                  <span key={item.id}>
                    &quot;<strong>{item?.name}</strong>&quot;
                    {index !== categories.length - 1 ? ", " : ""}
                  </span>
                ))}
            </span>
            <span>
              {" "}Note: If a category is associated with tools, the server will handle their removal.
            </span>
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
            {isDeleting ? "Deleting..." : "Yes, delete categories"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
