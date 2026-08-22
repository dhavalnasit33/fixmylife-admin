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

interface RecipePreview {
  _id: string;
  title: string;
}

interface MultipleDeleteRecipeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recipes: RecipePreview[];
  onSuccess: () => void;
}

export default function MultipleDeleteRecipeDialog({
  isOpen,
  onOpenChange,
  recipes,
  onSuccess
}: MultipleDeleteRecipeDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!recipes.length) return;
    setIsDeleting(true);
    try {
      const res = await apiService<SingleResponse<null>>('/discover-recipes/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: recipes.map(r => r._id) }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.success) {
        toast({ title: 'Success', description: res.message || 'Recipes deleted successfully.' });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({ title: 'Error', description: res.message || 'Failed to delete recipes.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Unexpected error.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!recipes || recipes.length === 0) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete the following recipes:&nbsp;
            {recipes.map((r, i) => (
              <span key={r._id}>
                &quot;<strong>{r.title}</strong>&quot;{i < recipes.length - 1 ? ', ' : ''}
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
