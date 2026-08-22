"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import YoastSeoForm from "./YoastSeoForm";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm, FormProvider } from "react-hook-form";
import type { YoastSeo, SingleResponse, YoastSeoFormValues } from "@/types";

interface EditYoastSeoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  seo: YoastSeo | null;
  onSuccess: () => void;
}

export default function EditYoastSeoDialog({
  isOpen,
  onOpenChange,
  seo,
  onSuccess,
}: EditYoastSeoDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<YoastSeoFormValues>({
    defaultValues: {
      seo_keyphrase: "",
      seo_title: "",
      meta_description: "",
      cover_image: "",
    },
  });

  const { reset, handleSubmit } = form;

  // When dialog opens and has data, set the form values
  useEffect(() => {
    if (isOpen && seo) {
      reset({
        seo_keyphrase: seo.seo_keyphrase ?? "",
        seo_title: seo.seo_title ?? "",
        meta_description: seo.meta_description ?? "",
        cover_image: seo.cover_image ?? "",
      });
    }
  }, [isOpen, seo, reset]);

  const onSubmit = async (values: YoastSeoFormValues) => {
    if (!seo?._id) return;

    setIsSubmitting(true);

    try {
      const res = await apiService<SingleResponse<YoastSeo>>(
        `/yoast-seo/${seo._id}`,
        {
          method: "PUT",
          body: JSON.stringify(values),
        }
      );

      if (res.success) {
        toast({
          title: "Success",
          description: res.message || "SEO record updated.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to update.",
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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) reset(); // Reset form when dialog closes
      }}
    >
      <DialogContent className="sm:max-w-lg md:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit SEO Record</DialogTitle>
          <DialogDescription>
            Update metadata for "{seo?.seo_title || "this page"}".
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 max-h-[70vh] overflow-y-auto pr-2">
          {seo ? (
            <FormProvider {...form}>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <YoastSeoForm isSubmitting={isSubmitting} />

                <div className="flex justify-end gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="px-4 py-2 border rounded-md text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white rounded-md text-sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </FormProvider>
          ) : (
            <div className="space-y-4 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
