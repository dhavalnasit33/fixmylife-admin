"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import ProtectedPage from "@/components/shared/ProtectedPage";
import LeadMagnetForm from "@/components/dashboard/lead-magnets/LeadMagnetForm";
import apiService from "@/lib/apiService";
import type { LeadMagnetFormValues, SingleResponse, LeadMagnet } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export default function CreateAlternativeLeadMagnetPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: LeadMagnetFormValues) => {
    setIsSubmitting(true);
    try {
      // Zod schema automatically validation takes care, type is injected in LeadMagnetForm values
      const response = await apiService<SingleResponse<LeadMagnet>>(
        "/lead-magnets",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Alternative Lead Magnet created successfully.",
        });
        router.push("/dashboard/alternative-lead-magnets");
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create Alternative Lead Magnet.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedPage requiredPermission="createLeadMagnets">
      <Card>
        <CardContent className="p-6">
          <PageHeader
            title="Create Alternative Lead Magnet"
            description="Fill in the details to create a new alternative SEO lead magnet page."
          />
          <div className="mt-6">
            <LeadMagnetForm
              type="alternative"
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => router.push("/dashboard/alternative-lead-magnets")}
            />
          </div>
        </CardContent>
      </Card>
    </ProtectedPage>
  );
}
