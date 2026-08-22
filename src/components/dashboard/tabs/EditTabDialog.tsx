"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import apiService from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";
import type { Tab, TabFormValues, SingleResponse } from "@/types";
import TabForm from "./TabForm";

interface EditTabDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  id: string | null;
  onSuccess: () => void;
}

export default function EditTabDialog({
  isOpen,
  onOpenChange,
  id,
  onSuccess,
}: EditTabDialogProps) {
  const { toast } = useToast();
  const [initialData, setInitialData] = useState<TabFormValues | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && id) {
      setInitialData(null); // reset before fetching
      apiService<SingleResponse<Tab>>(`/tabs/${id}`)
        .then((res) => {
          if (res.success) {
            setInitialData({
              title: res.data.title,
              prompt_template: res.data.prompt_template || "",
              fields: (res.data.fields || []).map((f) => ({
                ...f,
                prompt: f.prompt ?? "",
              })),
              description: res.data.description || "",
              short_description: res.data.short_description || "",
              suggested_topics: res.data.suggested_topics || [],
              seo_keyphrase: res.data.seo_keyphrase || "",
              seo_title: res.data.seo_title || "",
              meta_description: res.data.meta_description || "",
              cover_image: res.data.cover_image || "",
              tool_cover_image: res.data.tool_cover_image || "",
              tab_normal_icon_image: res.data.tab_normal_icon_image || "",
              tab_active_icon_image: res.data.tab_active_icon_image || "",
              tab_image: res.data.tab_image || "",
              max_tokens: res.data.max_tokens || 4000,
              system_prompt: res.data.system_prompt || "",
              improvement_system_prompt:
                res.data.improvement_system_prompt || "",
              categories: res.data.categories || [],
              tags: res.data.tags || [],
              display_name: res.data.display_name || "",
              allternativeTools: res.data.allternativeTools || [],
              whatCanDO: res.data.whatCanDO || [],
            });
          } else {
            toast({
              title: "Error",
              description: "Failed to load tab.",
              variant: "destructive",
            });
          }
        })
        .catch(() =>
          toast({
            title: "Error",
            description: "Failed to load tab.",
            variant: "destructive",
          })
        );
    }
  }, [id, isOpen, toast]);

  const handleSubmit = async (values: TabFormValues) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<Tab>>(`/tabs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Tab updated.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update tab.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Recipes Tools</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Update the details of this Recipes Tools.
        </DialogDescription>
        {initialData ? (
          <TabForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
          />
        ) : (
          <p className="text-center text-muted-foreground">Loading...</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
