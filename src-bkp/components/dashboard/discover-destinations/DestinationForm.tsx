'use client';

import { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/lib/apiService';
import { z } from 'zod';
import { DestinationFormData, SingleResponse } from '@/types';
import { destinationSchema } from '@/types';

interface DestinationFormProps {
  initialData?: DestinationFormData & { _id?: string };
  onSuccess: () => void;
  onCancelEdit?: () => void;
}

export default function DestinationForm({ initialData, onSuccess, onCancelEdit }: DestinationFormProps) {
  const { toast } = useToast();
  const form = useForm<DestinationFormData>({
    resolver: zodResolver(destinationSchema),
    defaultValues: { title: '', description: '', is_active: true }
  });

  // reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset({ title: '', description: '', is_active: true });
    }
  }, [initialData, form]);

  const onSubmit = async (data: DestinationFormData) => {
    try {
      const url = initialData?._id
        ? `/discover-destinations/${initialData._id}`
        : '/discover-destinations';
      const method = initialData?._id ? 'PUT' : 'POST';

      const res = await apiService<SingleResponse<null>>(url, {
        method,
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.success) {
        toast({ title: 'Success', description: res.message || 'Destination saved.' });
        form.reset({ title: '', description: '', is_active: true });
        onSuccess();
      } else {
        toast({
          title: 'Error',
          description: res.message || 'Failed to save destination.',
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          name="title"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Destination title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="description"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <textarea {...field} className="w-full border rounded p-2" rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 mt-4" style={{ marginTop: "70px" }}>
          <Button type="submit">
            {initialData?._id ? 'Update Destination' : 'Create Destination'}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onCancelEdit}
          >
            Cancel
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
