"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService";
import OtherToolsForm from "@/components/dashboard/other-tools/OtherToolsForm"; 

export default function CreateExtraToolPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      // 1. Prepare payload
      const payload = { 
        ...values, 
        tool_type: "extra" 
      };

      // 2. Post to backend
      // FIX: Do NOT use JSON.stringify() here if apiService handles it.
      // Pass the 'payload' object directly.
      const response = await apiService<any>("/extra-tools", {
        method: "POST",
        body: payload, 
      });

      if (response.success) {
        toast({ title: "Success", description: "Extra tool created successfully." });
        router.push("/dashboard/extra-tools");
      } else {
        // Handle validation errors returned by backend (e.g. "Validation error")
        const errorMessage = Array.isArray(response.errors) 
            ? response.errors.join(", ") 
            : response.message || "Failed to create tool.";
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
  
      <OtherToolsForm
        toolTypeLabel="Extra Tool"
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        onCancel={() => router.push("/dashboard/extra-tools")}
      />
   
  );
}