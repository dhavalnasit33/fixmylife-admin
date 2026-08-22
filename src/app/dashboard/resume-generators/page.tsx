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

import ResumeGeneratorForm from "@/components/dashboard/resume-generators/ResumeGeneratorForm";
import {
  ResumeGenerator,
  ResumeGeneratorFormValues,
  SingleResponse,
} from "@/types";
import { ResumeGeneratorSchema } from "@/types";

export default function CreateOrUpdateResumeGeneratorPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ResumeGeneratorFormValues>({
    resolver: zodResolver(ResumeGeneratorSchema),
    defaultValues: {
      tabs: [
        {
          title: "",
          description: "",
          prompt_template: "",
          fields: [
            {
              key: "",
              label: "",
              prompt: "",
              description: "",
              type: "textbox",
              required: true,
              placeholder: "",
              options: [],
              default_value: "",
            },
          ],
        },
      ],
      categories: [],
      display_name: "",
      allternativeTools: [],
      whatCanDO: [],
      seo_keyphrase: "",
      seo_title: "",
      meta_description: "",
      cover_image: "",
      tool_cover_image: "",
      tab_normal_icon_image: "",
      tab_active_icon_image: "",
      tab_image: "",
      max_tokens: 4000,
      system_prompt: "",
      long_description: "",
      short_description: "",
      mini_description: "",

    },
  });

  // Fetch existing resume generator data
  useEffect(() => {
    const fetchResume = async () => {
      try {
        const res =
          await apiService<SingleResponse<ResumeGenerator[]>>(
            "/resume-generators",
          );
        const record = res.data?.[0];
        if (res.success && record) {
          form.reset(record);
          setResumeId(record._id);
        }
      } catch (error) {
        // console.error("Failed to fetch resume generator record", error);
      }
    };
    fetchResume();
  }, [form]);

  const handleSubmit = async (values: ResumeGeneratorFormValues) => {
    setIsSubmitting(true);
    try {
      const method = resumeId ? "PUT" : "POST";
      const url = resumeId
        ? `/resume-generators/${resumeId}`
        : "/resume-generators";

      const res = await apiService<SingleResponse<ResumeGenerator>>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.success) {
        toast({
          title: "Success",
          description:
            res.message ||
            `Resume Generator ${resumeId ? "updated" : "created"}.`,
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
    <ProtectedPage requiredPermission="createorupdateResumeGenerator">
      <div className="w-full p-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">
              {resumeId
                ? "Update Resume Generator Record"
                : "Create Resume Generator Record"}
            </h2>
            <p className="text-muted-foreground mb-6">
              Manage resume generator settings and SEO details for this page.
            </p>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                <ResumeGeneratorForm form={form} isSubmitting={isSubmitting} />

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
                      ? resumeId
                        ? "Updating..."
                        : "Creating..."
                      : resumeId
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
