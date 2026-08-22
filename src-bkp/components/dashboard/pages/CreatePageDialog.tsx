'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/lib/apiService';
import type { Page, PageFormValues, SingleResponse } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import PageForm from '@/components/dashboard/pages/PageForm';

export default function CreatePagePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (values: PageFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await apiService<SingleResponse<Page>>('/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (res.success) {
        toast({ title: 'Success', description: res.message || 'Page created.' });
          router.push('/dashboard/pages'); 
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
    <div className="w-full p-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-2">Create Page</h2>
          <p className="text-muted-foreground mb-6">Fill in the page content and SEO metadata.</p>
          <div className="flex-1 overflow-auto">
            <PageForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => router.back()}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
