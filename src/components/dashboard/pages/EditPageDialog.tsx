"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService";
import type { Page, PageFormValues, SingleResponse } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import PageForm from "@/components/dashboard/pages/PageForm";

// ✅ Define props
interface EditPagePageProps {
  id: string;
}

export default function EditPagePage({ id }: EditPagePageProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [initialData, setInitialData] = useState<Page | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch page data
  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await apiService<SingleResponse<Page>>(`/pages/${id}`);
        if (res.success) {
          setInitialData(res.data);
        } else {
          toast({
            title: "Error",
            description: res.message,
            variant: "destructive",
          });
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Error loading page data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchPage();
  }, [id, toast]);

  // Handle update
  const handleSubmit = async (values: PageFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await apiService<SingleResponse<Page>>(`/pages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.success) {
        toast({
          title: "Success",
          description: res.message || "Page updated successfully.",
        });
        router.push("/dashboard/pages");
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to update page.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Unexpected error.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full p-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-2">Edit Page</h2>
          <p className="text-muted-foreground mb-6">
            Update the content and SEO metadata of this page.
          </p>

          {isLoading ? (
            <p>Loading...</p>
          ) : initialData ? (
            <PageForm
              initialData={initialData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => router.back()}
            />
          ) : (
            <p className="text-destructive">Failed to load page data.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
