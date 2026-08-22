
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import PlanForm from './PlanForm';
import apiService from '@/lib/apiService';
import type { SingleResponse, Plan, PlanFormValues } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface CreatePlanDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
}

export default function CreatePlanDialog({ isOpen, onOpenChange, onSuccess }: CreatePlanDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: PlanFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<Plan>>('/plans', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
      });

      if (response.success) {
        toast({ title: 'Success', description: response.message || 'Plan created successfully.' });
        onSuccess();
        onOpenChange(false); 
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to create plan.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Subscription Plan</DialogTitle>
          <DialogDescription>
            Define the details for the new subscription plan.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[70vh] overflow-y-auto pr-2">
          <PlanForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
