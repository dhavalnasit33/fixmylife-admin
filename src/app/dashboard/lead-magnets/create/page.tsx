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

export default function CreateLeadMagnetPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: LeadMagnetFormValues) => {
    setIsSubmitting(true);
    try {
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
          description: response.message || "Lead Magnet created successfully.",
        });
        router.push("/dashboard/lead-magnets");
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create Lead Magnet.",
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
            title="Create Lead Magnet"
            description="Fill in the details to create a new lead magnet."
          // showBackButton
          />
          <div className="mt-6">
            <LeadMagnetForm
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => router.push("/dashboard/lead-magnets")}
            />
          </div>
        </CardContent>

      </Card>
    </ProtectedPage>
  );
}
