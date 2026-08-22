
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import PlanForm from './PlanForm';
import apiService from '@/lib/apiService';
import type { Plan, SingleResponse, PlanFormValues } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface EditPlanDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  plan: Plan | null;
  onSuccess: () => void;
}

export default function EditPlanDialog({ isOpen, onOpenChange, plan, onSuccess }: EditPlanDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // currentPlanData is used to pass to PlanForm's initialData, which expects PlanFormValues structure.
  // Plan type is compatible for the fields PlanForm uses.
  const [currentPlanData, setCurrentPlanData] = useState< (PlanFormValues & { _id?: string }) | Plan | null>(null);

  useEffect(() => {
    if (isOpen && plan) {
      // Set currentPlanData directly from the plan prop.
      // PlanForm's defaultValues will handle converting plan.features (string[])
      // to a comma-separated string for the form's Textarea.
      setCurrentPlanData(plan);
    } else if (!isOpen) {
      setCurrentPlanData(null);
    }
  }, [isOpen, plan]);

  const handleSubmit = async (values: PlanFormValues) => {
    if (!currentPlanData?._id) return;
    setIsSubmitting(true);
    
    try {
      const response = await apiService<SingleResponse<Plan>>(`/plans/${currentPlanData._id}`, {
        method: 'PUT',
        body: values, // Zod schema handles features conversion from string to array
      });

      if (response.success) {
        toast({ title: 'Success', description: response.message || 'Plan updated successfully.' });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to update plan.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if(!open) setCurrentPlanData(null); }}>
      <DialogContent className="sm:max-w-lg md:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Subscription Plan</DialogTitle>
          <DialogDescription>
            Modify the details for &quot;{currentPlanData?.display_name || 'this plan'}&quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[70vh] overflow-y-auto pr-2">
          {currentPlanData ? (
            <PlanForm
              initialData={currentPlanData as (PlanFormValues & { _id?: string })} // Cast to satisfy PlanFormProps, actual fields are compatible
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => { onOpenChange(false); setCurrentPlanData(null); }}
            />
          ) : (
            <div className="space-y-4 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-1/3 ml-auto" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

