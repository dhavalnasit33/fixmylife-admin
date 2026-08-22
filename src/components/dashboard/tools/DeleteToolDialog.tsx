
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
import type { Tool, SingleResponse } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface DeleteToolDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  tool: Tool | null;
  onSuccess: () => void;
}

export default function DeleteToolDialog({ isOpen, onOpenChange, tool, onSuccess }: DeleteToolDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!tool?._id) return;
    setIsDeleting(true);
    try {
      const response = await apiService<SingleResponse<null>>(`/tools/${tool._id}`, {
        method: 'DELETE',
      });

      if (response.success) {
        toast({ title: 'Success', description: response.message || 'Tool deleted successfully.' });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to delete tool.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!tool) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the tool
            &quot;<strong>{tool.name}</strong>&quot;.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} onClick={() => onOpenChange(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Yes, delete tool'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
