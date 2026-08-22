'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import apiService from '@/lib/apiService';
import type { MarketingCategory, SingleResponse } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface DeleteMarketingCategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  category: MarketingCategory | null;
  onSuccess: () => void;
}

export default function DeleteMarketingCategoryDialog({
  isOpen,
  onOpenChange,
  category,
  onSuccess,
}: DeleteMarketingCategoryDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!category?._id) return;
    setIsDeleting(true);
    try {
      const response = await apiService<SingleResponse<null>>(
        `/marketing-categories/${category._id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.success) {
        toast({
          title: 'Success',
          description:
            response.message || 'Marketing category deleted successfully.',
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: 'Error',
          description:
            response.message ||
            'Failed to delete marketing category. It might have associated tools.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.message || 'An unexpected error occurred while deleting.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!category) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the marketing category{' '}
            &quot;<strong>{category.name}</strong>&quot;. If this category has associated tools, deletion might be prevented by the server.
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
            {isDeleting ? 'Deleting...' : 'Yes, delete category'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
