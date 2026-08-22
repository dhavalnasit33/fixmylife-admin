'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import YoastSeoForm from './YoastSeoForm';
import apiService from '@/lib/apiService';
import { useToast } from '@/hooks/use-toast';
import type { YoastSeo, SingleResponse, YoastSeoFormValues } from '@/types';

interface CreateYoastSeoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateYoastSeoDialog({ isOpen, onOpenChange, onSuccess }: CreateYoastSeoDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: YoastSeoFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await apiService<SingleResponse<YoastSeo>>('/yoast-seo', {
        method: 'POST',
        body:JSON.stringify(values),
      });

      if (res.success) {
        toast({ title: 'Success', description: res.message || 'SEO record created.' });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({ title: 'Error', description: res.message || 'Failed to create.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Unexpected error.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create SEO Record</DialogTitle>
          <DialogDescription>Fill in the SEO metadata for the page.</DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[70vh] overflow-y-auto pr-2">
         <YoastSeoForm isSubmitting={isSubmitting} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
