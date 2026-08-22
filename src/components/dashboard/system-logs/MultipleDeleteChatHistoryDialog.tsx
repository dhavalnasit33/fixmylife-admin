"use client";

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

interface MultipleDeleteChatHistoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  chats: { id: string; title?: string }[];
  onSuccess: () => void;
}

export default function MultipleDeleteChatHistoryDialog({
  isOpen,
  onOpenChange,
  chats,
  onSuccess,
}: MultipleDeleteChatHistoryDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (chats.length === 0) return;

    setIsDeleting(true);
    try {
      const response = await apiService<SingleResponse<null>>("/chat-history", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chats),
      });

      if (response.success) {
        toast({
          title: "Success",
          description:
            response.message || "Chat histories deleted successfully.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete chat histories.",
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

  if (!chats || chats.length === 0) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            <p>
              This action cannot be undone. The following chat histories will be
              permanently deleted:{" "}
              {chats.map((chat, index) => (
                <span key={chat.id}>
                  &quot;<strong>{`Chat ${chat.id}`}</strong>&quot;
                  {index !== chats.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
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
            {isDeleting ? "Deleting..." : "Yes, delete chats"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
