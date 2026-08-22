
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
import type { AIProviderComparison,  SingleResponse } from '@/types'; // Updated to AIProviderConfig
import { useToast } from '@/hooks/use-toast';

interface DeleteAIProviderComparisonDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  aiProviderComparison: AIProviderComparison | null; // Updated to AIProviderConfig
  onSuccess: () => void;
}

export default function DeleteAIProviderComparisonDialog({ isOpen, onOpenChange, aiProviderComparison, onSuccess }: DeleteAIProviderComparisonDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!aiProviderComparison?._id) return;
    setIsDeleting(true);
    try {
      const response = await apiService<SingleResponse<null>>(`/ai-comparison/${aiProviderComparison._id}`, {
        method: 'DELETE',
      });

      if (response.success) {
        toast({ title: 'Success', description: response.message || 'AI Provider Comparison Configuration deleted successfully.' });
        onSuccess(); // This should also trigger a refetch of AI Models if they are dependent
        onOpenChange(false);
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to delete AI Provider Configuration. Associated models might exist.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!aiProviderComparison) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the AI provider configuration
            &quot;<strong>{aiProviderComparison.firstModel.title} ({aiProviderComparison.firstModel.name}) VS {aiProviderComparison.secondModel.title} ({aiProviderComparison.secondModel.name})</strong>&quot;. 
            Ensure all associated AI Models are handled or deleted separately if necessary.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} onClick={() => onOpenChange(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Yes, delete provider config'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
