
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import RefundForm from './RefundForm';
import apiService from '@/lib/apiService';
import type { SingleResponse, RefundFormValues } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ProcessRefundDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  paymentId: string; // The ID of the payment to be refunded
  maxRefundableAmount?: number; // Optional, for display or client-side validation
  onSuccess: () => void; // Callback after successful refund
}

export default function ProcessRefundDialog({ 
  isOpen, 
  onOpenChange, 
  paymentId, 
  maxRefundableAmount,
  onSuccess 
}: ProcessRefundDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (idOfPaymentToRefund: string, values: RefundFormValues) => {
    setIsSubmitting(true);
    try {
      // The paymentId is already passed to the form, ensuring we use the correct one.
      const response = await apiService<SingleResponse<any>>(`/payments/${idOfPaymentToRefund}/refund`, {
        method: 'POST',
        body: values,
      });

      if (response.success) {
        toast({ title: 'Success', description: response.message || 'Refund processed successfully.' });
        onSuccess();
        onOpenChange(false); 
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to process refund.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'An unexpected error occurred during refund.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
          <DialogDescription>
            Enter the amount and reason for refunding payment ID: {paymentId}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RefundForm 
            paymentId={paymentId}
            maxRefundableAmount={maxRefundableAmount}
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
