
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import AIModelForm from './AIModelForm';
import apiService from '@/lib/apiService';
import type { AIModel, SingleResponse, AIModelFormValues, AIProviderConfig } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface EditAIModelDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  aiModelId: string | null;
  aiProviderConfigs: AIProviderConfig[];
  onSuccess: () => void;
}

export default function EditAIModelDialog({ isOpen, onOpenChange, aiModelId, aiProviderConfigs, onSuccess }: EditAIModelDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [currentData, setCurrentData] = useState<AIModel | null>(null);

  useEffect(() => {
    if (isOpen && aiModelId) {
      setIsLoadingData(true);
      setCurrentData(null); 
      apiService<SingleResponse<AIModel>>(`/ai-models/${aiModelId}`)
        .then(response => {
          if (response.success && response.data) {
            setCurrentData(response.data);
          } else {
            toast({ title: "Error", description: response.message || "Failed to load AI model details.", variant: "destructive" });
            onOpenChange(false); 
          }
        })
        .catch(err => {
          toast({ title: "Error", description: err.message || "Could not load AI model.", variant: "destructive" });
          onOpenChange(false); 
        })
        .finally(() => setIsLoadingData(false));
    } else if (!isOpen) {
        setCurrentData(null); 
    }
  }, [isOpen, aiModelId, toast, onOpenChange]);

  const handleSubmit = async (values: AIModelFormValues) => {
    if (!currentData?._id) return;
    setIsSubmitting(true);
    
    try {
      const response = await apiService<SingleResponse<AIModel>>(`/ai-models/${currentData._id}`, {
        method: 'PUT',
          headers: { "Content-Type": "application/json" },
        body:  JSON.stringify(values),
      });

      if (response.success) {
        toast({ title: 'Success', description: response.message || 'AI Model updated successfully.' });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to update AI Model.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if(!open) setCurrentData(null); }}>
      <DialogContent className="sm:max-w-lg md:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit AI Model</DialogTitle>
          <DialogDescription>
            Modify the details for model &quot;{currentData?.model || 'this model'}&quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[70vh] overflow-y-auto pr-2">
          {isLoadingData || (!currentData && isOpen && aiModelId) ? (
            <div className="space-y-4 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-1/3 ml-auto" />
            </div>
          ) : currentData ? (
            <AIModelForm
              initialData={currentData}
              aiProviderConfigs={aiProviderConfigs}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => { onOpenChange(false); setCurrentData(null); }}
            />
          ) : (
             <p className="text-center text-muted-foreground p-8">Select an AI model to edit.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
