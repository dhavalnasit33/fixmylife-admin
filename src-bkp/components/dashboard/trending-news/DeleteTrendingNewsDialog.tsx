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
import { SingleResponse, TrendingNews } from '@/types';
import { useState } from 'react';

interface DeleteTrendingNewsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  id: string | null;
  onSuccess: () => void;
}

export default function DeleteTrendingNewsDialog({
  isOpen,
  onOpenChange,
  id,
  onSuccess,
}: DeleteTrendingNewsDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      const response = await apiService<SingleResponse<TrendingNews>>(`/trending-news/${id}`, {
        method: 'DELETE',
      });

      if (response.success) {
        toast({
          title: 'Deleted',
          description: response.message || 'Trending news deleted successfully.',
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Delete failed.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!id) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this news article?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the selected trending news.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Yes, delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
