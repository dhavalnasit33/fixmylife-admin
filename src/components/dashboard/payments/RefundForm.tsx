
'use client';

import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { RefundFormValues } from '@/types';
import { refundSchema } from '@/types';

interface RefundFormProps {
  paymentId: string; // To identify which payment to refund
  maxRefundableAmount?: number; // Optional: To pre-fill or validate against
  onSubmit: (paymentId: string, values: RefundFormValues) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
}

export default function RefundForm({ paymentId, maxRefundableAmount, onSubmit, isSubmitting, onCancel }: RefundFormProps) {
  const form = useForm<RefundFormValues>({
    resolver: zodResolver(refundSchema),
    defaultValues: {
      amount: maxRefundableAmount || 0,
      reason: '',
    },
  });

  const handleSubmit: SubmitHandler<RefundFormValues> = async (data) => {
    // If maxRefundableAmount is provided, you might want to add an additional client-side check here,
    // though the primary validation should be in the Zod schema or backend.
    if (maxRefundableAmount && data.amount > maxRefundableAmount) {
      form.setError("amount", { type: "manual", message: `Amount cannot exceed ${maxRefundableAmount}` });
      return;
    }
    await onSubmit(paymentId, data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Refund Amount</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="e.g., 9.99" {...field} />
              </FormControl>
              {maxRefundableAmount && <FormMessage>Max refundable: ${maxRefundableAmount.toFixed(2)}</FormMessage>}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason for Refund</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Customer request, duplicate charge" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Processing Refund...' : 'Process Refund'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
