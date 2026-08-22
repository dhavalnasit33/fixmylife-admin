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
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/lib/apiService';
import { SingleResponse } from '@/types';
import { useState } from 'react';

interface MultiDeleteNewsCategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  ids: string[];
  onSuccess: () => void;
}

export default function MultiDeleteNewsCategoryDialog({
  isOpen,
  onOpenChange,
  ids,
  onSuccess,
}: MultiDeleteNewsCategoryDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleBulkDelete = async () => {
    if (!ids.length) return;
    setIsDeleting(true);
    try {
      const response = await apiService<SingleResponse<null>>('/news-categories/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      if (response.success) {
        toast({
          title: 'Deleted',
          description: response.message || 'News categories deleted successfully.',
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Bulk delete failed.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Something went wrong during bulk deletion.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!ids.length) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete selected categories?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. It will permanently delete{' '}
            <strong>{ids.length}</strong> selected item{ids.length > 1 ? 's' : ''}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Yes, delete all'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
