
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { UserHistoryItem } from '@/types';
import { CheckCircle, XCircle, Info, MessageSquare, Bot, Server, Clock, Tag, Hash } from 'lucide-react';
import ClientFormattedDate from '@/components/shared/ClientFormattedDate';

interface ViewHistoryItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  historyItem: UserHistoryItem | null;
}

const DetailRow = ({ label, value, icon: Icon, isCode = false }: { label: string; value: React.ReactNode; icon?: React.ElementType, isCode?: boolean }) => (
  <div className="py-3 grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 items-start border-b border-border/30 last:border-b-0">
    <dt className="text-sm font-medium text-muted-foreground flex items-center md:col-span-1">
      {Icon && <Icon className="h-4 w-4 mr-2 shrink-0" />}
      {label}
    </dt>
    <dd className={`mt-1 text-sm text-foreground md:mt-0 md:col-span-2 ${isCode ? 'font-mono bg-muted/50 p-3 rounded-md whitespace-pre-wrap break-all text-xs leading-relaxed' : 'break-words'}`}>
      {value === null || value === undefined || (typeof value === 'string' && value.trim() === '') ? <span className="italic text-muted-foreground/70">N/A</span> : value}
    </dd>
  </div>
);

export default function ViewHistoryItemDialog({ isOpen, onOpenChange, historyItem }: ViewHistoryItemDialogProps) {
  if (!historyItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-11/12 max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[calc(80vh-100px)]">
        <DialogHeader>
          <DialogTitle>History Item Details</DialogTitle>
          <DialogDescription>
            Detailed view of a specific user history entry from <ClientFormattedDate dateInput={historyItem.createdAt} formatString="PPpp" />.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(80vh-200px)] pr-4 my-4"> {}
          <dl className="space-y-0">
            <DetailRow label="Prompt" value={historyItem.prompt} icon={MessageSquare} isCode={true} />
            <DetailRow label="Response" value={historyItem.response} icon={Bot} isCode={true} />
            <DetailRow label="Status" value={
              <Badge variant={historyItem.success ? "default" : "destructive"} className="text-xs">
                {historyItem.success ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                {historyItem.success ? "Success" : "Failed"}
              </Badge>
            } icon={Info} />
            {historyItem.error_message && (
              <DetailRow label="Error Message" value={historyItem.error_message} icon={XCircle} isCode={true} />
            )}
            <DetailRow label="API Used" value={historyItem.api_used} icon={Server} />
            <DetailRow label="Model Used" value={historyItem.model_used} icon={Bot} />
             <DetailRow label="Tool/Category" value={
                typeof historyItem.tool_category_id === 'object' && historyItem.tool_category_id !== null
                    ? historyItem.tool_category_id.name
                    : typeof historyItem.tool_category_id === 'string'
                    ? historyItem.tool_category_id 
                    : 'Uncategorized'
                } icon={Tag} />
            <DetailRow label="Tokens Used" value={historyItem.tokens_used.toLocaleString()} icon={Hash} />
            <DetailRow label="Response Time" value={`${(historyItem.response_time / 1000).toFixed(2)}s`} icon={Clock} />
          </dl>
        </ScrollArea>
        {/* <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}
