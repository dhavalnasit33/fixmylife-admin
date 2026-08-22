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
import type { CodingPromptTopic, SingleResponse } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface DeleteCodingPromptTopicDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  topic: CodingPromptTopic | null;
  onSuccess: () => void;
}

export default function DeleteCodingPromptTopicDialog({
  isOpen,
  onOpenChange,
  topic,
  onSuccess,
}: DeleteCodingPromptTopicDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!topic?._id) return;
    setIsDeleting(true);
    try {
      const response = await apiService<SingleResponse<null>>(
        `/coding-prompt-topics/${topic._id}`,
        { method: "DELETE" }
      );

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Topic deleted successfully.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete topic.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred while deleting.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!topic) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the topic "{topic.title}"? This action cannot be undone and will remove all its subtopics.
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
            {isDeleting ? "Deleting..." : "Yes, delete topic"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}