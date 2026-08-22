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
  CommonToolFormValues,
  CommonToolSchema,
  SingleResponse,
} from "@/types";
import { CommonTool } from "@/types";
import CommonToolForm from "@/components/dashboard/common-tool/CommonToolForm";

export default function CreateOrUpdateSearchKeywordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [seoId, setSeoId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<CommonToolFormValues>({
    resolver: zodResolver(CommonToolSchema),
    defaultValues: {
      fields: [],
      categories: [],
      allternativeTools: [],
      whatCanDO: [],
      display_name: "",
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
      isActive: true,
      max_tokens: 4000,
      system_prompt: "",
    },
  });
  useEffect(() => {
    const fetchSeo = async () => {
      try {
        const res = await apiService<SingleResponse<CommonTool[]>>(
          "/keyword-search"
        );
        const record = res.data?.[0];
        if (res.success && record) {
          form.reset(record);
          setSeoId(record._id);
        }
      } catch (error) {
        // console.error("Failed to fetch cover letter generator record", error);
      }
    };
    fetchSeo();
  }, [form]);

  const handleSubmit = async (values: CommonToolFormValues) => {
    console.log("submit callexd");
    setIsSubmitting(true);
    try {
      const method = seoId ? "PUT" : "POST";
      const url = seoId ? `/keyword-search/${seoId}` : "/keyword-search";

      const res = await apiService<SingleResponse<CommonTool>>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.success) {
        toast({
          title: "Success",
          description:
            res.message ||
            `Keyword Search ${seoId ? "updated" : "created"}.`,
        });
        // router.push("/dashboard");
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
    <ProtectedPage requiredPermission="createorupdateKeywordSearch">
      <div className="w-full p-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">
              {seoId
                ? "Update Keyword Search Record"
                : "Create Keyword Search Record"}
            </h2>
            <p className="text-muted-foreground mb-6">
              Manage the details and SEO settings for an Keyword Search record.
            </p>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                <CommonToolForm form={form} isSubmitting={isSubmitting} />

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
                      ? seoId
                        ? "Updating..."
                        : "Creating..."
                      : seoId
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
