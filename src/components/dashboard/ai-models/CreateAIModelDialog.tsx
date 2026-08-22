
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import AIModelForm from './AIModelForm';
import apiService from '@/lib/apiService';
import type { SingleResponse, AIModel, AIModelFormValues, AIProviderConfig } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface CreateAIModelDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  aiProviderConfigs: AIProviderConfig[];
}

export default function CreateAIModelDialog({ isOpen, onOpenChange, onSuccess, aiProviderConfigs }: CreateAIModelDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: AIModelFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<AIModel>>('/ai-models', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.success) {
        toast({ title: 'Success', description: response.message || 'AI Model created successfully.' });
        onSuccess();
        onOpenChange(false); 
      } else {
        toast({ title: 'Error Creating Model', description: response.message || 'Failed to create AI Model.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Submission Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add New AI Model</DialogTitle>
          <DialogDescription>
            Configure a specific model and link it to an AI Provider Configuration.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[70vh] overflow-y-auto pr-2">
          {aiProviderConfigs.length === 0 ? (
            <p className="text-center text-muted-foreground">
              You must have at least one active AI Provider Configuration to add a model.
            </p>
          ) : (
            <AIModelForm 
              aiProviderConfigs={aiProviderConfigs}
              onSubmit={handleSubmit} 
              isSubmitting={isSubmitting}
              onCancel={() => onOpenChange(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
