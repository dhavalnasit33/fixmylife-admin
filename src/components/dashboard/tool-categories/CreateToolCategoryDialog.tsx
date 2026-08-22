
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import ToolCategoryForm, { type ToolCategoryFormValues } from './ToolCategoryForm';
import apiService from '@/lib/apiService';
import type { SingleResponse, ToolCategory } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface CreateToolCategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  categories?: ToolCategory[]
}

export default function CreateToolCategoryDialog({ isOpen, onOpenChange, onSuccess, categories }: CreateToolCategoryDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: ToolCategoryFormValues) => {
    setIsSubmitting(true);
    try {
      // The 'is_active' is handled by the server default or toggle endpoint,
      // but if ToolCategoryFormValues includes it, it will be sent.
      // The API spec for POST /tool-categories includes is_active.
      const payload = {
        ...values,
        // is_active can be explicitly set if needed, otherwise rely on form default/server default
      };

      const response = await apiService<SingleResponse<ToolCategory>>('/tool-categories', {
        method: 'POST',
         body: JSON.stringify(payload),
      });

      if (response.success) {
        toast({ title: 'Success', description: response.message || 'Tool category created successfully.' });
        onSuccess();
        onOpenChange(false); // Close dialog on success
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to create tool category.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Tool Category</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new tool category.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ToolCategoryForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
             categories={categories ?? []}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

    