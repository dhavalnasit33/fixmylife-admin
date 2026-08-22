"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import ProtectedPage from "@/components/shared/ProtectedPage";

import { UploadCloud, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FaviconSetting, FaviconSettingSchema } from "@/types";
import { deleteImage, uploadFileToServer } from "@/lib/utils";


type FaviconFormValues = FaviconSetting;

export default function FaviconSettingsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

   const { toast } = useToast();
  const router = useRouter();
  const faviconInputRef = useRef<HTMLInputElement>(null);

const form = useForm<FaviconSetting>({
  resolver: zodResolver(FaviconSettingSchema),
  defaultValues: { key: "favicon", value: "" },
});


  const coverImage = form.watch("value");

  // Fetch existing favicon
  useEffect(() => {
    const fetchFavicon = async () => {
      try {
        const res = await apiService<{ success: boolean; data: FaviconSetting; message?: string }>("/settings/favicon");
        if (res.success && res.data) {
          form.setValue("value", res.data.value);
          setFaviconUrl(res.data.value);
        }
      } catch (err) {
        // console.error("Failed to fetch favicon:", err);
      }
    };
    fetchFavicon();
  }, [form]);

  // Handle favicon upload
  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/x-icon"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Only PNG, JPG, SVG, ICO images are allowed.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const uploadedUrl = await uploadFileToServer(file, "favicon");
      form.setValue("value", uploadedUrl, { shouldDirty: true, shouldValidate: true });
      setFaviconUrl(uploadedUrl);
      toast({ title: "Uploaded", description: "Favicon uploaded successfully." });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message || "Could not upload favicon.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (faviconInputRef.current) faviconInputRef.current.value = "";
    }
  };

  // Drag & drop handler
  const handleFaviconDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file && faviconInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      faviconInputRef.current.files = dataTransfer.files;
      const changeEvent = { target: faviconInputRef.current } as React.ChangeEvent<HTMLInputElement>;
      handleFaviconUpload(changeEvent);
    }
  };

  // Submit favicon
  const handleSubmit = async (values: FaviconFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await apiService<{ success: boolean; message?: string }>("/settings/favicon", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.success) {
        toast({ title: "Success", description: "Favicon updated successfully." });
      } else {
        toast({ title: "Error", description: res.message || "Failed to update.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Unexpected error.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
   <ProtectedPage requiredPermission="manageFavicon">
  <div className="w-full p-6">
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-2">Favicon Settings</h2>
        <p className="text-muted-foreground mb-6">
          Upload and manage your site's favicon. Preview will be shown below.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              name="value"
              render={() => (
                <FormItem>
                  <FormLabel>Favicon Upload</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-6 gap-6">
                    <div
                      className="flex items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-primary transition-colors bg-gray-50 relative"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleFaviconDrop}
                      onClick={() => faviconInputRef.current?.click()}
                    >
                      
                      <Input
                        type="file"
                        accept=".ico,.png,.jpg,.jpeg,.svg"
                        className="hidden"
                        ref={faviconInputRef}
                        onChange={handleFaviconUpload}
                        disabled={isSubmitting || isUploading}
                      />

                      {!coverImage ? (
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          {isUploading ? (
                            <Loader2 className="h-6 w-6 animate-spin mb-2" />
                          ) : (
                            <UploadCloud className="h-6 w-6 mb-2" />
                          )}
                          <p className="text-sm text-center">
                            Drag & drop an image here, or click to upload
                          </p>
                        </div>
                      ) : (
                        <div className="relative w-24 h-24">
                          <img
                            src={coverImage}
                            alt="Favicon Preview"
                            className="w-full h-full object-contain rounded-md border p-1 bg-white"
                          />
                          <button
                            type="button"
                            className="absolute -top-2 -right-2 py-1 px-2 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-xs"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!coverImage) return;
                              try {
                                await deleteImage(coverImage);
                                form.setValue("value", "", {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                                if (faviconInputRef.current)
                                  faviconInputRef.current.value = "";
                              } catch (err) {
                                console.error("Failed to delete favicon:", err);
                              }
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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
                {isSubmitting ? "Updating..." : "Update Favicon"}
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
