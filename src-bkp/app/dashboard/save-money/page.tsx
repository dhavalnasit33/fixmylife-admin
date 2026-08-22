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
import {
  Dynamic,
  DynamicFormValues,
  DynamicSchema,
  SingleResponse,
} from "@/types";
import DynamicForm from "@/components/dashboard/dynamic/DynamicForm";

export default function CreateOrUpdateSaveMoneyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<DynamicFormValues>({
    resolver: zodResolver(DynamicSchema),
    defaultValues: {
      fields: [],
      categories: [],
      display_name: "",
      allternativeTools: [],
      whatCanDO: [],
      suggested_topics: [],
      prompt_template: "",
      description: "",
      short_description: "",
      seo_keyphrase: "",
      seo_title: "",
      meta_description: "",
      cover_image: "",
      tool_cover_image: "",
      tab_normal_icon_image: "",
      tab_active_icon_image: "",
      tab_image: "",
      system_prompt: "",
      improvement_system_prompt: "",
      display_wordcount: true,
      custom_url: "",
      max_tokens: 4000,
      isActive: true,
    },
  });

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const res = await apiService<SingleResponse<Dynamic[]>>("/save-money");
        const record = res.data?.[0];
        if (res.success && record) {
          form.reset(record);
          setRecordId(record._id);
        }
      } catch (error) {
        console.error("Failed to fetch Save Money record", error);
      }
    };

    fetchRecord();
  }, [form]);

  const handleSubmit = async (values: DynamicFormValues) => {
    setIsSubmitting(true);
    try {
      const method = recordId ? "PUT" : "POST";
      const url = recordId ? `/save-money/${recordId}` : "/save-money";

      const res = await apiService<SingleResponse<Dynamic>>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.success) {
        toast({
          title: "Success",
          description:
            res.message || `Save Money ${recordId ? "updated" : "created"}.`,
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
    <ProtectedPage requiredPermission="createorupdateSaveMoney">
      <div className="w-full p-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">
              {recordId ? "Update Save Money" : "Create Save Money"}
            </h2>
            <p className="text-muted-foreground mb-6">
              Manage fields, suggested topics, and SEO settings for an Save
              Money record.
            </p>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                <DynamicForm
                  form={form}
                  isSubmitting={isSubmitting}
                  showExtraFields
                />

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
