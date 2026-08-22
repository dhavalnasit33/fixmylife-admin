
'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import apiService from '@/lib/apiService';
import type { SingleResponse, AddTokensFormValues } from '@/types';
import { addTokensSchema } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AddTokensDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userId: string;
  userName: string;
  onSuccess: () => void;
}

export default function AddTokensDialog({ isOpen, onOpenChange, userId, userName, onSuccess }: AddTokensDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddTokensFormValues>({
    resolver: zodResolver(addTokensSchema),
    defaultValues: {
      tokens: 0,
    },
  });

  const handleSubmit: SubmitHandler<AddTokensFormValues> = async (values) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<{ remaining_tokens: number }>>(`/users/${userId}/add-tokens`, {
        method: 'POST',
        body: values,
      });

      if (response.success) {
        toast({ title: 'Success', description: `Successfully added ${values.tokens} tokens to ${userName}.` });
        onSuccess();
        onOpenChange(false);
        form.reset();
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to add tokens.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Tokens to {userName}</DialogTitle>
          <DialogDescription>
            Specify the number of tokens to add to this user&apos;s balance.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="tokens"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Tokens</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter token amount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { onOpenChange(false); form.reset(); }} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding Tokens...' : 'Add Tokens'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
