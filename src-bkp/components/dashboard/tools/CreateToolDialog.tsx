
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ToolForm from './ToolForm';
import apiService from '@/lib/apiService';
import type { SingleResponse, Tool, ToolFormValues, ToolCategory, PaginatedResponse, AIProviderConfig, AIModel } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface CreateToolDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  toolCategories: ToolCategory[];
}

export default function CreateToolDialog({ isOpen, onOpenChange, onSuccess, toolCategories }: CreateToolDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiProviderConfigs, setAiProviderConfigs] = useState<AIProviderConfig[]>([]);
  const [aiModels, setAiModels] = useState<AIModel[]>([]);
  const [isLoadingPrerequisites, setIsLoadingPrerequisites] = useState(false);

  const fetchPrerequisites = useCallback(async () => {
    setIsLoadingPrerequisites(true);
    try {
      const [providerConfigsResponse, modelsResponse] = await Promise.all([
        apiService<PaginatedResponse<AIProviderConfig>>('/ai-providers', { params: { limit: 1000, is_active: true } }),
        apiService<PaginatedResponse<AIModel>>('/ai-models', { params: { limit: 1000, is_active: true } })
      ]);

      if (providerConfigsResponse.success) {
        setAiProviderConfigs(providerConfigsResponse.data);
      } else {
        toast({ title: 'Error', description: 'Failed to fetch AI Provider Configurations.', variant: 'destructive' });
        setAiProviderConfigs([]);
      }

      if (modelsResponse.success) {
        setAiModels(modelsResponse.data);
      } else {
        toast({ title: 'Error', description: 'Failed to fetch AI Models.', variant: 'destructive' });
        setAiModels([]);
      }

    } catch (error: any) {
      toast({ title: 'Error fetching prerequisites', description: error.message, variant: 'destructive' });
      setAiProviderConfigs([]);
      setAiModels([]);
    } finally {
      setIsLoadingPrerequisites(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      fetchPrerequisites();
    }
  }, [isOpen, fetchPrerequisites]);

  const handleSubmit = async (values: ToolFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<Tool>>('/tools', {
        method: 'POST',
        body: values,
      });

      if (response.success) {
        toast({ title: 'Success', description: response.message || 'Tool created successfully.' });
        onSuccess();
        onOpenChange(false); 
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to create tool.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = toolCategories.length > 0 && aiProviderConfigs.length > 0 && aiModels.length > 0 && !isLoadingPrerequisites;
  let proceedMessage = "";
  if (!isLoadingPrerequisites) {
    if (toolCategories.length === 0) proceedMessage = "Create a Tool Category first.";
    else if (aiProviderConfigs.length === 0) proceedMessage = "Configure an AI Provider first.";
    else if (aiModels.length === 0) proceedMessage = "Add an AI Model first.";
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New AI Tool</DialogTitle>
          <DialogDescription>
            Define the properties, tabs, and fields for your new AI tool.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoadingPrerequisites && <p className="text-center text-muted-foreground">Loading prerequisites...</p>}
          {!isLoadingPrerequisites && !canProceed && (
            <p className="text-center text-muted-foreground">{proceedMessage}</p>
          )}
          {canProceed && (
            <ToolForm 
              onSubmit={handleSubmit} 
              isSubmitting={isSubmitting}
              onCancel={() => onOpenChange(false)}
              toolCategories={toolCategories}
              aiProviderConfigs={aiProviderConfigs}
              aiModels={aiModels}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
