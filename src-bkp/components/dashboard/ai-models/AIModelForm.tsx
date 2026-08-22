
'use client';

import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AIModel, AIModelFormValues, AIProviderConfig } from '@/types';
import { aiModelSchema } from '@/types';

interface AIModelFormProps {
  initialData?: AIModel | null;
  aiProviderConfigs: AIProviderConfig[]; 
  onSubmit: (values: AIModelFormValues) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
}

export default function AIModelForm({ initialData, aiProviderConfigs, onSubmit, isSubmitting, onCancel }: AIModelFormProps) {
  const form = useForm<AIModelFormValues>({
    resolver: zodResolver(aiModelSchema),
    defaultValues: {
      ai_provider_id: typeof initialData?.ai_provider_id === 'object' 
                        ? initialData.ai_provider_id._id 
                        : initialData?.ai_provider_id || (aiProviderConfigs.length > 0 ? aiProviderConfigs[0]._id : ''),
      model: initialData?.model || '',
      is_active: initialData?.is_active ?? true,
      notes: initialData?.notes || '',
    },
  });

  const handleSubmit: SubmitHandler<AIModelFormValues> = async (data) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="ai_provider_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent AI Provider Configuration</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                disabled={aiProviderConfigs.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={aiProviderConfigs.length === 0 ? "No provider configs available" : "Select a provider config"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {aiProviderConfigs.map((config) => (
                    <SelectItem key={config._id} value={config._id}>
                      {config.display_name} ({config.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Link this model to a base provider configuration.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model Identifier</FormLabel>
              <FormControl><Input placeholder="e.g., gpt-4o, gemini-1.5-pro" {...field} /></FormControl>
              <FormDescription>The specific model string used by the provider (e.g., from their API docs).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl><Textarea placeholder="Any specific notes about this model configuration..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> */}

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Active Status</FormLabel>
                <FormDescription>
                  Is this model currently active and usable?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>}
          <Button type="submit" disabled={isSubmitting || aiProviderConfigs.length === 0}>
            {isSubmitting ? (initialData ? 'Saving...' : 'Creating...') : (initialData ? 'Save Changes' : 'Create AI Model')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
