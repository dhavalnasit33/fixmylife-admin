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

interface MultipleDeleteYoastSeoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: { id: string; title: string }[];
  onSuccess: () => void;
}

export default function MultipleDeleteYoastSeoDialog({
  isOpen,
  onOpenChange,
  selectedItems,
  onSuccess,
}: MultipleDeleteYoastSeoDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!selectedItems.length) return;
    setIsDeleting(true);
    try {
      const response = await apiService<SingleResponse<null>>('/yoast-seo/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: selectedItems.map((item) => item.id) }), 
      });
      if (response.success) {
        toast({ title: 'Success', description: response.message || 'SEO items deleted.' });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to delete SEO items.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Bulk deletion failed.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!selectedItems) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete the following SEO items:
            {selectedItems.map((item, idx) => (
              <span key={item.id}>
                &nbsp;&quot;<strong>{item.title}</strong>&quot;
                {idx !== selectedItems.length - 1 && ','}
              </span>
            ))}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
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
