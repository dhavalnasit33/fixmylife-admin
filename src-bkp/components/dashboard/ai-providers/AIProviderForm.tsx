"use client";

import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { AIProviderConfig, AIProviderConfigFormValues } from "@/types";
import { aiProviderConfigSchema } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "@/config";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn, uploadFileToServer } from "@/lib/utils";
import apiService from "@/lib/apiService";

interface AIProviderFormProps {
  initialData?: AIProviderConfig | null;
  onSubmit: (values: AIProviderConfigFormValues) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
}
const MAX_DESCRIPTION_LENGTH = 300;

export default function AIProviderForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
}: AIProviderFormProps) {
  const form = useForm<AIProviderConfigFormValues>({
    resolver: zodResolver(aiProviderConfigSchema),
    defaultValues: {
      name: initialData?.name || "",
      title: initialData?.title || "",
      display_name: initialData?.display_name || "",
      api_key: "",
      base_url: initialData?.base_url || "",
      is_active: initialData?.is_active ?? true,
      rate_limit: {
        // Ensure rate_limit and its properties are initialized
        requests_per_minute: initialData?.rate_limit?.requests_per_minute || 60,
      },
      image: initialData?.image || "",
      description: initialData?.description || "",
    },
  });
  const { toast } = useToast();
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const iconInputRef = useRef<HTMLInputElement>(null);

  // const handleIconUpload = async (
  //   event: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;
  //   setIsUploadingIcon(true);
  //   const formData = new FormData();
  //   formData.append("file", file);
  //   formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  //   try {
  //     const res = await fetch(
  //       `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
  //       {
  //         method: "POST",
  //         body: formData,
  //       }
  //     );
  //     const data = await res.json();
  //     if (data.secure_url) {
  //       form.setValue("image", data.secure_url, {
  //         shouldDirty: true,
  //         shouldValidate: true,
  //       });
  //       toast({ title: "Image uploaded successfully" });
  //     } else {
  //       toast({ title: "Failed to upload image", variant: "destructive" });
  //     }
  //   } catch (err) {
  //     toast({ title: "Failed to upload image", variant: "destructive" });
  //   } finally {
  //     setIsUploadingIcon(false);
  //   }
  // };

  const handleIconUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingIcon(true);

    try {
      // ✅ Reuse the reusable upload function
      const uploadedUrl = await uploadFileToServer(file, "ai-provider");

      // Update form with uploaded URL
      form.setValue("image", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });

      toast({ title: "Image uploaded successfully" });
    } catch (err: any) {
      toast({
        title: "Failed to upload image",
        description: err.message || "Could not upload image.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingIcon(false);
      if (iconInputRef.current) iconInputRef.current.value = "";
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      await handleIconUpload({ target: { files: [file] } } as any); // reuse existing handler
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSubmit: SubmitHandler<AIProviderConfigFormValues> = async (
    data
  ) => {
    const payload: Partial<AIProviderConfigFormValues> = { ...data };

    if (payload.api_key !== undefined && payload.api_key.trim() === "") {
      delete payload.api_key;
    }
    if (payload.base_url !== undefined && payload.base_url.trim() === "") {
      delete payload.base_url;
    }

    await onSubmit(payload as AIProviderConfigFormValues);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Internal Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., openai" {...field} />
                </FormControl>
                {/* <FormDescription>Unique identifier for the provider config (e.g., openai, google_ai). Lowercase, numbers, underscores only.</FormDescription> */}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="display_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., OpenAI" {...field} />
                </FormControl>
                {/* <FormDescription>Friendly name shown in the UI for this provider configuration.</FormDescription> */}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">
                Title
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., Powerful AI by OpenAI" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="api_key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                API Key {initialData?._id && "(Leave blank to keep unchanged)"}
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••••••••••••••"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="base_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., https://api.openai.com/v1"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                If different from default (e.g., for proxies or custom
                endpoints).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Default Rate Limits</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <FormField
              control={form.control}
              name="rate_limit.requests_per_minute"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requests Per Minute</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 60"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Active Status</FormLabel>
                <FormDescription>
                  Is this provider configuration currently active and usable?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel className="text-dark dark:text-gray-200">
            Provider Image
          </FormLabel>
          <div
            className={cn(
              "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-4 cursor-pointer transition",
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => iconInputRef.current?.click()}
          >
            <Input
              id="providerImageInput"
              type="file"
              accept="image/*,.svg"
              className="hidden"
              ref={iconInputRef}
              onChange={handleIconUpload}
              disabled={isUploadingIcon || isSubmitting}
            />
            {isUploadingIcon ? (
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            ) : form.watch("image") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.watch("image")}
                alt="Category Icon Preview"
                className="h-16 w-16 rounded-md border object-cover"
              />
            ) : (
              <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                <UploadCloud className="h-8 w-8 mb-2" />
                <p className="text-center text-sm">
                  Drag & drop an icon here or click to upload
                </p>
              </div>
            )}
          </div>

          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <>
                <FormControl>
                  <input type="hidden" {...field} />
                </FormControl>
                <FormDescription>
                  Upload a logo or image for this provider.
                </FormDescription>
                <FormMessage />
              </>
            )}
          />
        </FormItem>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">
                Description
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  placeholder="Short description of the provider..."
                  {...field}
                />
              </FormControl>
              <div className="text-right text-sm text-muted-foreground mt-1">
                {field.value?.length || 0} / {MAX_DESCRIPTION_LENGTH}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? initialData
                ? "Saving..."
                : "Creating..."
              : initialData
              ? "Save Changes"
              : "Create Provider Config"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
