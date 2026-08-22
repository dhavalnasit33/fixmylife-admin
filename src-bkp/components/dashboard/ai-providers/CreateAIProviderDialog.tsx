
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import AIProviderForm from './AIProviderForm';
import apiService from '@/lib/apiService';
import type { SingleResponse, AIProviderConfig, AIProviderConfigFormValues } from '@/types'; // Updated types
import { useToast } from '@/hooks/use-toast';

interface CreateAIProviderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
}

export default function CreateAIProviderDialog({ isOpen, onOpenChange, onSuccess }: CreateAIProviderDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: AIProviderConfigFormValues) => { // Updated type
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<AIProviderConfig>>('/ai-providers', { // Updated type
        method: 'POST',
         headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.success) {
        toast({ title: 'Success', description: response.message || 'AI Provider Configuration created successfully.' });
        onSuccess();
        onOpenChange(false); 
      } else {
        toast({ title: 'Error Creating Provider Config', description: response.message || 'Failed to create AI Provider Configuration.', variant: 'destructive' });
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
          <DialogTitle>Add New AI Provider Configuration</DialogTitle>
          <DialogDescription>
            Configure a new base AI service provider (e.g., OpenAI, Google AI). Specific models are added separately.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[70vh] overflow-y-auto pr-2">
          <AIProviderForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
