
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import apiService from '@/lib/apiService';
import type { AIModel, AIProviderConfig, SingleResponse } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Activity, BarChartHorizontalBig, ServerIcon, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ViewAIModelDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  aiModelId: string | null;
  aiProviderConfigs: AIProviderConfig[]; 
}

const DetailItem = ({ label, value, children }: { label: string; value?: string | number | null | boolean; children?: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-border/50 last:border-b-0">
    <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
    <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:text-right">
      {children ?? (value === true ? <CheckCircle className="h-5 w-5 text-green-500 inline" /> : value === false ? <XCircle className="h-5 w-5 text-red-500 inline" /> : value?.toString() ?? 'N/A')}
    </dd>
  </div>
);


export default function ViewAIModelDialog({ isOpen, onOpenChange, aiModelId, aiProviderConfigs }: ViewAIModelDialogProps) {
  const { toast } = useToast();
  const [aiModel, setAiModel] = useState<AIModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && aiModelId) {
      setIsLoading(true);
      setAiModel(null); 
      apiService<SingleResponse<AIModel>>(`/ai-models/${aiModelId}`)
        .then(response => {
          if (response.success && response.data) {
            setAiModel(response.data);
          } else {
            toast({ title: "Error", description: response.message || "Failed to load AI model details.", variant: "destructive" });
            onOpenChange(false); 
          }
        })
        .catch(err => {
          toast({ title: "Error", description: err.message || "Could not load AI model.", variant: "destructive" });
          onOpenChange(false); 
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, aiModelId, toast, onOpenChange]);

  const getProviderDisplayName = (providerId: string | AIProviderConfig): string => {
    if (typeof providerId === 'object' && providerId !== null) {
      return providerId.display_name;
    }
    const found = aiProviderConfigs.find(p => p._id === providerId);
    return found ? found.display_name : 'Unknown Provider';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-xl">
        <DialogHeader>
          <DialogTitle>AI Model Details</DialogTitle>
          {aiModel && <DialogDescription>Viewing details for model &quot;{aiModel.model}&quot;.</DialogDescription>}
        </DialogHeader>
        <div className="py-4 max-h-[70vh] overflow-y-auto pr-2 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : aiModel ? (
            <dl className="divide-y divide-border/50">
              <DetailItem label="Model Identifier" value={aiModel.model} />
              <DetailItem label="Parent Provider" value={getProviderDisplayName(aiModel.ai_provider_id)} />
              <DetailItem label="Active">
                 {aiModel.is_active ? 
                    <Badge variant="default" className="bg-accent text-accent-foreground">Active</Badge> : 
                    <Badge variant="secondary">Inactive</Badge>
                  }
              </DetailItem>
             
              {aiModel.notes && (
                 <Card className="mt-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-md flex items-center">
                            <FileText className="mr-2 h-5 w-5 text-primary" /> Notes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                        <p className="whitespace-pre-wrap">{aiModel.notes}</p>
                    </CardContent>
                </Card>
              )}

              {aiModel.usage_stats && (
                <Card className="mt-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-md flex items-center">
                            <BarChartHorizontalBig className="mr-2 h-5 w-5 text-primary" /> Usage Statistics (This Model)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                        <DetailItem label="Total Requests" value={aiModel.usage_stats.total_requests} />
                        <DetailItem label="Total Tokens Used" value={aiModel.usage_stats.total_tokens} />
                        <DetailItem label="Last Used" value={aiModel.usage_stats.last_used ? new Date(aiModel.usage_stats.last_used).toLocaleString() : 'N/A'} />
                    </CardContent>
                </Card>
              )}
              
              <DetailItem label="Created At" value={new Date(aiModel.createdAt).toLocaleString()} />
              <DetailItem label="Last Updated" value={new Date(aiModel.updatedAt).toLocaleString()} />
            </dl>
          ) : (
            <p className="text-center text-muted-foreground p-8">No AI model data available.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
