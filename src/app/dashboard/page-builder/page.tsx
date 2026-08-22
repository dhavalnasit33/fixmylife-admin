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
import { SingleResponse } from "@/types";
import * as z from "zod";
import PageBuilderForm from "@/components/dashboard/page-builder/PageBuilderForm";

// --- 1. Define Zod Schemas ---

const tabSchema = z.object({
  label: z.string().min(1, "Label is required"),
  value: z.string().min(1, "Value is required"),
});

// NEW: Hero Section Schema
const heroSectionSchema = z.object({
  category: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required"),
  sub_title: z.string().min(1, "Sub-title is required"),
  button_text: z.string().default("Start Designing"),
  hero_image: z.string().optional().default(""),
});

// NEW: Grid Feature Schema
const gridFeatureSchema = z.object({
  category: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  image: z.string().url("Valid image URL is required"),
});

export const featureSchema = z.object({
  name: z.string().min(1, "Feature name is required"),
  // ✅ FIXED: Using z.coerce.number() handles HTML input "number" correctly
  value: z.coerce.number().min(0, "Value must be non-negative").default(0),
  is_active: z.boolean().default(true),
  show_value: z.boolean().default(true),
});

const cardSchema = z.object({
  category: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  image: z.string().url("Valid image URL is required"),
  icon_image: z.string().optional().default(""),
  badge_text: z.string().optional().default(""),
  checklist: z.array(z.string()).optional().default([]),
  button_text: z.string().optional().default("Launch"),
  custom_url: z.string().url("Valid URL is required").optional().or(z.literal("")),
});

export const pageBuilderSchema = z.object({
  tabs: z.array(tabSchema).optional().default([]),
  hero_sections: z.array(heroSectionSchema).optional().default([]),
  grid_features: z.array(gridFeatureSchema).optional().default([]),
  features: z.array(featureSchema).optional().default([]),
  cards: z.array(cardSchema).optional().default([]),

  short_description: z.string().max(200).optional().default(""),
  description: z.string().max(50000).optional().default(""),
  seo_keyphrase: z.string().optional().default(""),
  seo_title: z.string().optional().default(""),
  meta_description: z.string().optional().default(""),
  cover_image: z.string().optional().default(""),
  tool_cover_image: z.string().optional().default(""),
  tab_normal_icon_image: z.string().optional().default(""),
  tab_active_icon_image: z.string().optional().default(""),
  tab_image: z.string().optional().default(""),
});

export type PageBuilderFormValues = z.infer<typeof pageBuilderSchema>;

// --- 2. TypeScript Interface for API ---
export interface PageBuilder {
  _id: string;
  tabs: Array<{ label: string; value: string }>;
  hero_sections: Array<{
    category: string;
    title: string;
    sub_title: string;
    button_text: string;
    hero_image: string;
  }>;
  grid_features: Array<{
    category: string;
    title: string;
    description: string;
    image: string;
  }>;
  features: Array<{
    name: string;
    value: number;
    is_active: boolean;
    show_value: boolean;
  }>;
  cards: Array<{
    category: string;
    title: string;
    description: string;
    image: string;
    icon_image: string;
    badge_text: string;
    checklist: string[];
    button_text: string;
    custom_url: string | "";
  }>;
  short_description: string;
  description: string;
  seo_keyphrase: string;
  seo_title: string;
  meta_description: string;
  cover_image: string;
  tool_cover_image: string;
  tab_normal_icon_image: string;
  tab_active_icon_image: string;
  tab_image: string;
  createdAt: string;
  updatedAt: string;
}

export default function PageBuilderPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageBuilderId, setPageBuilderId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<PageBuilderFormValues>({
    resolver: zodResolver(pageBuilderSchema),
    defaultValues: {
      tabs: [],
      hero_sections: [],
      grid_features: [],
      features: [],
      cards: [],
      short_description: "",
      description: "",
      seo_keyphrase: "",
      seo_title: "",
      meta_description: "",
      cover_image: "",
      tool_cover_image: "",
      tab_normal_icon_image: "",
      tab_active_icon_image: "",
      tab_image: "",
    },
  });

  useEffect(() => {
    const fetchPageBuilder = async () => {
      try {
        const res = await apiService<SingleResponse<PageBuilder>>(
          "/page-builder"
        );
        const record = res.data;
        if (res.success && record) {
          form.reset(record);
          setPageBuilderId(record._id);
        }
      } catch (error) {
        console.error("Failed to fetch page builder record", error);
      }
    };
    fetchPageBuilder();
  }, [form]);

  const handleSubmit = async (values: PageBuilderFormValues) => {
    setIsSubmitting(true);
    const cleanedData = {
      ...values,
      hero_sections: values.hero_sections?.map(h => ({
        category: h.category,
        title: h.title,
        sub_title: h.sub_title,
        button_text: h.button_text,
        hero_image: h.hero_image || "",
      })),
      cards: values.cards?.map((card) => ({
        ...card,
        custom_url: card.custom_url || "",
        image: card.image || "",
        icon_image: card.icon_image || "",
        checklist: card.checklist || [],
      })),
      // z.coerce already handled the number conversion, but safe to keep
      features: values.features?.map((feature) => ({
        ...feature,
        value: Number(feature.value) || 0,
      })),
    };

    try {
      const method = pageBuilderId ? "PUT" : "POST";
      const url = pageBuilderId
        ? `/page-builder/${pageBuilderId}`
        : "/page-builder";

      const res = await apiService<SingleResponse<PageBuilder>>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      });

      if (res.success) {
        toast({
          title: "Success",
          description: res.message || `PageBuilder ${pageBuilderId ? "Updated" : "Created"}`,
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

  // ✅ ADDED: Validation Error Handler
  const onInvalid = (errors: any) => {
    console.error("❌ Form Validation Failed:", errors);
    toast({
      title: "Validation Error",
      description: "Please check the form for missing or invalid fields.",
      variant: "destructive",
    });
  };

  return (
    <ProtectedPage requiredPermission="editPageBuilderMenu">
      <div className="w-full p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  {pageBuilderId ? "Update Page Builder" : "Create Page Builder"}
                </h2>
                <p className="text-muted-foreground">
                  Configure hero sections, features, grid content, cards, and SEO.
                </p>
              </div>
            </div>

            <Form {...form}>
              {/* ✅ UPDATED: Added onInvalid callback here */}
              <form onSubmit={form.handleSubmit(handleSubmit, onInvalid)} className="space-y-6">
                <PageBuilderForm form={form} isSubmitting={isSubmitting} />

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
                      ? pageBuilderId ? "Updating..." : "Creating..."
                      : pageBuilderId ? "Update" : "Create"}
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