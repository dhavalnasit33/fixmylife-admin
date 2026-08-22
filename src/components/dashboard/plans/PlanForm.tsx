
'use client';

import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { PlanFormValues } from '@/types';
import { planSchema } from '@/types';

interface PlanFormProps {
  initialData?: PlanFormValues & { _id?: string };
  onSubmit: (values: PlanFormValues) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
}

export default function PlanForm({ initialData, onSubmit, isSubmitting, onCancel }: PlanFormProps) {
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: initialData?.name || '',
      display_name: initialData?.display_name || '',
      token_limit: initialData?.token_limit || 0,
      price: initialData?.price || 0,
      currency: initialData?.currency || 'USD',
      yearly_discount_percent: initialData?.yearly_discount_percent || 0,
      description: initialData?.description || '',
      features: initialData?.features || [], 
      is_active: initialData?.is_active ?? true,
      popular: initialData?.popular ?? false,
      stripe_monthly_price_id: initialData?.stripe_monthly_price_id || '',
    },
  });

  const handleSubmit: SubmitHandler<PlanFormValues> = async (data) => {
    // The Zod schema's preprocess will handle converting 'features' string to array
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Internal Name</FormLabel>
                <FormControl><Input placeholder="e.g., pro_plan" {...field} /></FormControl>
                <FormDescription>Unique identifier for the plan.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="display_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl><Input placeholder="e.g., Pro Plan" {...field} /></FormControl>
                <FormDescription>Name shown to users.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea placeholder="Describe this plan..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl><Input type="number" step="0.01" placeholder="e.g., 19.99" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <FormControl><Input placeholder="e.g., USD" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
  control={form.control}
  name="stripe_monthly_price_id"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Stripe Monthly Price ID</FormLabel>
      <FormControl>
        <Input placeholder="price_1234abcd..." {...field} />
      </FormControl>
      <FormDescription>
        Create this in Stripe → Products → Pricing → Monthly.
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>

            </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="token_limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Token Limit</FormLabel>
                <FormControl><Input type="number" placeholder="e.g., 5000" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="yearly_discount_percent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Yearly Discount %</FormLabel>
                <FormControl><Input type="number" step="0.01" placeholder="e.g., 20" {...field} /></FormControl>
                {/* <FormDescription>Discount applied for yearly billing.</FormDescription> */}
                <FormMessage />
              </FormItem>
            )}
          />
      
</div>
        <FormField
          control={form.control}
          name="features"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Features</FormLabel>
              <FormControl><Textarea rows={4} placeholder="Enter features, comma-separated..." {...field} /></FormControl>
              <FormDescription>Each feature separated by a comma.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <FormDescription>Is this plan currently available?</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="popular"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Popular Plan</FormLabel>
                    <FormDescription>Mark this plan as popular?</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )}
            />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (initialData?._id ? 'Saving...' : 'Creating...') : (initialData?._id ? 'Save Changes' : 'Create Plan')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
