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
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/lib/apiService';
import { SingleResponse } from '@/types';

interface DestinationPreview {
  _id: string;
  title: string;
}

interface MultipleDeleteDestinationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  destinations: DestinationPreview[];
  onSuccess: () => void;
}

export default function MultipleDeleteDestinationDialog({
  isOpen,
  onOpenChange,
  destinations,
  onSuccess
}: MultipleDeleteDestinationDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!destinations.length) return;
    setIsDeleting(true);
    try {
      const res = await apiService<SingleResponse<null>>('/discover-destinations/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: destinations.map(d => d._id) }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.success) {
        toast({ title: 'Success', description: res.message || 'Destinations deleted successfully.' });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({ title: 'Error', description: res.message || 'Failed to delete destinations.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Unexpected error.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!destinations || destinations.length === 0) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete the following destinations:&nbsp;
            {destinations.map((d, i) => (
              <span key={d._id}>
                &quot;<strong>{d.title}</strong>&quot;{i < destinations.length - 1 ? ', ' : ''}
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
