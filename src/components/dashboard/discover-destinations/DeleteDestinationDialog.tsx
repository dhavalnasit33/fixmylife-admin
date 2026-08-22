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
import apiService from '@/lib/apiService';
import type { SingleResponse } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface Destination {
  _id: string;
  title: string;
}

interface DeleteDestinationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  destination: Destination | null;
  onSuccess: () => void;
}

export default function DeleteDestinationDialog({
  isOpen,
  onOpenChange,
  destination,
  onSuccess
}: DeleteDestinationDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!destination?._id) return;
    setIsDeleting(true);
    try {
      const res = await apiService<SingleResponse<null>>(`/discover-destinations/${destination._id}`, {
        method: 'DELETE',
      });

      if (res.success) {
        toast({ title: 'Success', description: res.message || 'Destination deleted successfully.' });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: 'Error',
          description: res.message || 'Failed to delete destination.',
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Unexpected error occurred.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!destination) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete destination <strong>{destination.title}</strong>.
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
