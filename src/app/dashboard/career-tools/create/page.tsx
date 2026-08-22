"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService";
import OtherToolsForm from "@/components/dashboard/other-tools/OtherToolsForm"; 

export default function CreateCareerToolPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      // 1. Prepare payload
      const payload = { 
        ...values, 
        tool_type: "career" 
      };

      // 2. Post to backend
      // FIX: Do NOT use JSON.stringify() here if apiService handles it.
      // Pass the 'payload' object directly.
      const response = await apiService<any>("/career-tools", {
        method: "POST",
        body: payload, 
      });

      if (response.success) {
        toast({ title: "Success", description: "Career tool created successfully." });
        router.push("/dashboard/career-tools");
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
        toolTypeLabel="Career Tool"
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        onCancel={() => router.push("/dashboard/career-tools")}
      />
   
  );
}