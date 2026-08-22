
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
import type { AIProviderConfig, SingleResponse } from '@/types'; // Updated to AIProviderConfig
import { useToast } from '@/hooks/use-toast';

interface DeleteAIProviderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  provider: AIProviderConfig | null; // Updated to AIProviderConfig
  onSuccess: () => void;
}

export default function DeleteAIProviderDialog({ isOpen, onOpenChange, provider, onSuccess }: DeleteAIProviderDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!provider?._id) return;
    setIsDeleting(true);
    try {
      const response = await apiService<SingleResponse<null>>(`/ai-providers/${provider._id}`, {
        method: 'DELETE',
      });

      if (response.success) {
        toast({ title: 'Success', description: response.message || 'AI Provider Configuration deleted successfully.' });
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

  if (!provider) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the AI provider configuration
            &quot;<strong>{provider.display_name} ({provider.name})</strong>&quot;. 
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
