
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ToolCategoryForm, { type ToolCategoryFormValues } from './ToolCategoryForm';
import apiService from '@/lib/apiService';
import type { ToolCategory, SingleResponse } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface EditToolCategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  category: ToolCategory | null;
  onSuccess: () => void;
}

export default function EditToolCategoryDialog({ isOpen, onOpenChange, category, onSuccess }: EditToolCategoryDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  // Use ToolCategoryFormValues for currentCategoryData to ensure it matches the form's expected shape
  const [currentCategoryData, setCurrentCategoryData] = useState<ToolCategoryFormValues | null>(null); 
  console.log("currentCategoryData",currentCategoryData)
  
 useEffect(() => {
  if (isOpen && category) {
    setCurrentCategoryData({
      name: category.name,
      description: category.description,
      system_prompt: category.system_prompt,
       category: (category?.category as ToolCategoryFormValues['category']) || 'content',
      icon: category.icon || '',
      is_active: category.is_active,
     parent:
  typeof category.parent === 'string'
    ? category.parent
    : category.parent?._id || 'none',

    });
  } else if (!isOpen) {
    setCurrentCategoryData(null);
  }
}, [isOpen, category]);


  const handleSubmit = async (values: ToolCategoryFormValues) => {
    if (!category?._id) return; // Use original category prop for ID
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<ToolCategory>>(`/tool-categories/${category._id}`, {
        method: 'PUT',
        body:values,
      });

      if (response.success) {
        toast({ title: 'Success', description: response.message || 'Tool category updated successfully.' });
        onSuccess();
        onOpenChange(false); 
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to update tool category.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!category && isOpen) { 
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent><DialogHeader><DialogTitle>Error</DialogTitle></DialogHeader>Category data missing.</DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">

        <DialogHeader>
          <DialogTitle>Edit Tool Category</DialogTitle>
          <DialogDescription>
            Update the details for &quot;{category?.name || 'this category'}&quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoadingCategory ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : currentCategoryData ? ( // Check currentCategoryData which is of type ToolCategoryFormValues
            <ToolCategoryForm
              initialData={currentCategoryData} // Pass the correctly typed data
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => onOpenChange(false)}
            />
          ) : (
             <p>Loading category data or category not found...</p> 
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
