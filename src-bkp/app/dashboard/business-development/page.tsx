"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import ProtectedPage from "@/components/shared/ProtectedPage";
import GenericContentForm from "@/components/dashboard/generic-content/GenericContentForm";
import {
  SingleResponse,
  GenericContent,
  GenericContentFormValues,
} from "@/types";
import { GenericContentSchema } from "@/types";

export default function CreateOrUpdateMarketingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<GenericContentFormValues>({
    resolver: zodResolver(GenericContentSchema),
    defaultValues: {
      categories: [],
      display_name: "",
      allternativeTools: [],
      whatCanDO: [],
      suggested_topics: [{ title: "", has_input: true, sticky: false, image: "" }],
      seo_keyphrase: "",
      description: "",
      short_description: "",
      seo_title: "",
      meta_description: "",
      cover_image: "",
      tab_normal_icon_image: "",
      tab_active_icon_image: "",
      tab_image: "",
      isActive: true,
      max_tokens: 4000,
      system_prompt: "",
    },
  });

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const res = await apiService<SingleResponse<GenericContent[]>>(
          "/marketing"
        );
        const record = res.data?.[0];
        if (res.success && record) {
          form.reset(record);
          setRecordId(record._id);
        }
      } catch (error) {
        // console.error("Failed to fetch marketing record", error);
      }
    };
    fetchRecord();
  }, [form]);

  const handleSubmit = async (values: GenericContentFormValues) => {
    setIsSubmitting(true);
    try {
      const method = recordId ? "PUT" : "POST";
      const url = recordId ? `/marketing/${recordId}` : "/marketing";

      const res = await apiService<SingleResponse<GenericContent>>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.success) {
        toast({
          title: "Success",
          description:
            res.message || `Marketing ${recordId ? "updated" : "created"}.`,
        });
      } else {
        toast({
          title: "Error",
          description: res.message || "Operation failed.",
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
    <ProtectedPage requiredPermission="createorupdateMarketing">
      <div className="w-full p-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">
              {recordId ? "Update Marketing Record" : "Create Marketing Record"}
            </h2>
            <p className="text-muted-foreground mb-6">
              Manage the details and SEO settings for a Marketing record.
            </p>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                <GenericContentForm form={form} isSubmitting={isSubmitting} />

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? recordId
                        ? "Updating..."
                        : "Creating..."
                      : recordId
                        ? "Update"
                        : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}
