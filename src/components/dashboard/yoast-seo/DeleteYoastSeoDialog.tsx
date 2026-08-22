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
import { SingleResponse, YoastSeo } from '@/types';
import { useState } from 'react';

interface DeleteYoastSeoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
   item: YoastSeo; 
  onSuccess: () => void;
}

export default function DeleteYoastSeoDialog({
  isOpen,
  onOpenChange,
  item,
  onSuccess,
}: DeleteYoastSeoDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!item?._id) return;
    setIsDeleting(true);
    try {
      const response = await apiService<SingleResponse<null>>(`/yoast-seo/${item._id}`, {
        method: 'DELETE',
      });
      if (response.success) {
        toast({ title: 'Success', description: response.message || 'SEO item deleted successfully.' });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to delete SEO item.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete SEO item.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!item) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will delete <strong>{item.seo_title}</strong> permanently.
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
