
'use client';

import { useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import apiService from '@/lib/apiService';
import type { User, SingleResponse, UpdateUserStatusFormValues } from '@/types';
import { updateUserStatusSchema } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface UpdateUserStatusDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User;
  onSuccess: () => void;
}

const statusOptions: User['status'][] = ['active', 'suspended', 'inactive'];

export default function UpdateUserStatusDialog({ isOpen, onOpenChange, user, onSuccess }: UpdateUserStatusDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateUserStatusFormValues>({
    resolver: zodResolver(updateUserStatusSchema),
    defaultValues: {
      status: user.status,
    },
  });
  
  // Reset form when user prop changes or dialog opens with a new user
useEffect(() => {
  if (isOpen && user) {
    form.reset({ status: user.status });
  }
}, [isOpen, user, form]);

  const handleSubmit: SubmitHandler<UpdateUserStatusFormValues> = async (values) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<{ status: User['status']}>>(`/users/${user._id}/status`, {
        method: 'PATCH',
        body: values,
      });

      if (response.success) {
        toast({ title: 'Success', description: `User ${user.name}'s status updated to ${values.status}.` });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to update user status.', variant: 'destructive' });
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
          <DialogTitle>Update Status for {user.name}</DialogTitle>
          <DialogDescription>
            Select the new status for the user.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status} className="capitalize">
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Status'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
