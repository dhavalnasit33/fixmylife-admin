
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import apiService from '@/lib/apiService';
import type { AIProviderConfig, SingleResponse } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, BarChartHorizontalBig, ServerIcon, Hash, Key, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ViewAIProviderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  providerConfigId: string | null;
}

const DetailItem = ({ label, value, children, icon: Icon }: { label: string; value?: string | number | null | boolean; children?: React.ReactNode, icon?: React.ElementType }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-border/50 last:border-b-0">
    <dt className="text-sm font-medium text-muted-foreground flex items-center">
      {Icon && <Icon className="h-4 w-4 mr-2 shrink-0" />}
      {label}
    </dt>
    <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:text-right break-all">
      {children ?? (value === true ? <CheckCircle className="h-5 w-5 text-green-500 inline" /> : value === false ? <XCircle className="h-5 w-5 text-red-500 inline" /> : value?.toString() ?? 'N/A')}
    </dd>
  </div>
);


export default function ViewAIProviderDialog({ isOpen, onOpenChange, providerConfigId }: ViewAIProviderDialogProps) {
  const { toast } = useToast();
  const [providerConfig, setProviderConfig] = useState<AIProviderConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (isOpen && providerConfigId) {
      setIsLoading(true);
      setProviderConfig(null);
      setShowApiKey(false); 
      apiService<SingleResponse<AIProviderConfig>>(`/ai-providers/${providerConfigId}`)
        .then(response => {
          if (response.success && response.data) {
            setProviderConfig(response.data);
          } else {
            toast({ title: "Error", description: response.message || "Failed to load AI provider config details.", variant: "destructive" });
            onOpenChange(false); 
          }
        })
        .catch(err => {
          toast({ title: "Error", description: err.message || "Could not load AI provider config.", variant: "destructive" });
          onOpenChange(false); 
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, providerConfigId, toast, onOpenChange]);

  const renderApiKeyDisplay = () => {
    if (providerConfig?.api_key) {
      return (
        <div className="flex items-center gap-2">
          <span>{showApiKey ? providerConfig.api_key : `${providerConfig.api_key.substring(0, 4)}...${providerConfig.api_key.slice(-4)}`}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowApiKey(!showApiKey)}>
            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      );
    } else if (providerConfig?.api_key_set) {
      return <Badge variant="default" className="bg-green-100 text-green-700">Set (Value not displayed)</Badge>;
    } else {
      return <Badge variant="secondary">Not Set</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-xl">
        <DialogHeader>
          <DialogTitle>AI Provider Configuration Details</DialogTitle>
          {providerConfig && <DialogDescription>Viewing details for &quot;{providerConfig.display_name}&quot; ({providerConfig.name}).</DialogDescription>}
        </DialogHeader>
        <div className="py-4 max-h-[70vh] overflow-y-auto pr-2 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/2" /> <Skeleton className="h-4 w-3/4" /> <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" /> <Skeleton className="h-4 w-full" /> <Skeleton className="h-4 w-1/2" />
            </div>
          ) : providerConfig ? (
            <dl className="divide-y divide-border/50">
              <DetailItem label="Display Name" value={providerConfig.display_name} icon={ServerIcon} />
              <DetailItem label="Internal Name" value={providerConfig.name} icon={ServerIcon}/>
              <DetailItem label="Base URL" value={providerConfig.base_url || 'N/A'}  icon={ServerIcon}/>
              <DetailItem label="API Key" icon={Key}>
                {renderApiKeyDisplay()}
              </DetailItem>
              <DetailItem label="Active" icon={CheckCircle}>
                 {providerConfig.is_active ? 
                    <Badge variant="default" className="bg-accent text-accent-foreground">Active</Badge> : 
                    <Badge variant="secondary">Inactive</Badge>
                  }
              </DetailItem>

              <Card className="mt-4">
                <CardHeader className="pb-2">
                    <CardTitle className="text-md flex items-center">
                        <Clock className="mr-2 h-5 w-5 text-primary" /> Default Rate Limits
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                    <DetailItem label="Requests/Minute" value={providerConfig.rate_limit?.requests_per_minute} />
                </CardContent>
              </Card>
              
             {providerConfig.usage_stats && (
                <Card className="mt-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-md flex items-center">
                            <BarChartHorizontalBig className="mr-2 h-5 w-5 text-primary" /> Usage Statistics (Overall for Provider Config)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                        <DetailItem label="Total Requests" value={providerConfig.usage_stats.total_requests} />
                        <DetailItem label="Total Tokens Used" value={providerConfig.usage_stats.total_tokens} />
                        <DetailItem label="Last Used" value={providerConfig.usage_stats.last_used ? new Date(providerConfig.usage_stats.last_used).toLocaleString() : 'N/A'} />
                    </CardContent>
                </Card>
              )}
              
              <DetailItem label="Created At" value={new Date(providerConfig.createdAt).toLocaleString()} />
              <DetailItem label="Last Updated" value={new Date(providerConfig.updatedAt).toLocaleString()} />
            </dl>
          ) : (
            <p className="text-center text-muted-foreground p-8">No provider configuration data available.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
