'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/lib/apiService';
import { SingleResponse } from '@/types';
import { useState } from 'react';

interface PagePreview {
  id: string;
  page_title: string;
}

interface MultipleDeletePageDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pages: PagePreview[];
  onSuccess: () => void;
}

export default function MultipleDeletePageDialog({
  isOpen,
  onOpenChange,
  pages,
  onSuccess,
}: MultipleDeletePageDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (pages.length === 0) return;
    setIsDeleting(true);
    try {
      const response = await apiService<SingleResponse<null>>('/pages/bulk-delete', {
        method: 'POST',
       body: JSON.stringify({ ids: pages.map((p) => p.id) }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.success) {
        toast({ title: 'Success', description: response.message || 'Pages deleted successfully.' });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to delete pages.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Unexpected error.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!pages || pages.length === 0) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. It will delete the following pages:&nbsp;
            {pages.map((page, index) => (
              <span key={page.id}>
                &quot;<strong>{page.page_title}</strong>&quot;
                {index < pages.length - 1 ? ', ' : ''}
              </span>
            ))}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} onClick={() => onOpenChange(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Yes, delete pages'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
