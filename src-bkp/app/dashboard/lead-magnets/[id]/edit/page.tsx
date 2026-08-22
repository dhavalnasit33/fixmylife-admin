"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import ProtectedPage from "@/components/shared/ProtectedPage";
import LeadMagnetForm from "@/components/dashboard/lead-magnets/LeadMagnetForm";
import apiService from "@/lib/apiService";
import type { LeadMagnetFormValues, SingleResponse, LeadMagnet } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function EditLeadMagnetPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [leadMagnet, setLeadMagnet] = useState<LeadMagnet | null>(null);

  const fetchLeadMagnet = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiService<SingleResponse<LeadMagnet>>(
        `/lead-magnets/${id}`,
      );
      if (response.success) {
        setLeadMagnet(response.data);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch Lead Magnet details.",
          variant: "destructive",
        });
        router.push("/dashboard/lead-magnets");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      router.push("/dashboard/lead-magnets");
    } finally {
      setIsLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    if (id) {
      fetchLeadMagnet();
    }
  }, [id, fetchLeadMagnet]);

  const onSubmit = async (values: LeadMagnetFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<LeadMagnet>>(
        `/lead-magnets/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Lead Magnet updated successfully.",
        });
        router.push("/dashboard/lead-magnets");
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update Lead Magnet.",
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

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!leadMagnet) return null;

  return (
    <ProtectedPage requiredPermission="editLeadMagnets">
      <Card>
        <CardContent className="p-6">

          <PageHeader
            title={`Edit: ${leadMagnet.title}`}
            description="Modify the details of this lead magnet."
          />
          <div className="mt-6">
            <LeadMagnetForm
              initialData={leadMagnet}
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
