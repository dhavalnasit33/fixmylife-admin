"use client";

import React, { useRef, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Loader2, UploadCloud, X } from "lucide-react";
import { cn, deleteImage, uploadFileToServer } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PromptCategoryFormValues, promptCategorySchema } from "@/types";

interface PromptCategoryFormProps {
  initialData?: PromptCategoryFormValues | null;
  onSubmit: (values: PromptCategoryFormValues) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
}

export default function PromptCategoryForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
}: PromptCategoryFormProps) {
  const { toast } = useToast();
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const iconInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PromptCategoryFormValues>({
    resolver: zodResolver(promptCategorySchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      icon: initialData?.icon || "",
      is_active: initialData?.is_active ?? true,
    },
  });

  const handleIconUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingIcon(true);
    try {
      const uploadedUrl = await uploadFileToServer(file, "prompt-category");
      form.setValue("icon", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast({
        title: "Icon Uploaded",
        description: "Category icon has been uploaded.",
      });
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message || "Could not upload icon.",
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
    if (file) await handleIconUpload({ target: { files: [file] } } as any);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);

  const handleSubmit: SubmitHandler<PromptCategoryFormValues> = async (
    data,
  ) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Creative Writing" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe this category..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Category Icon</FormLabel>
          <div
            className={cn(
              "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 cursor-pointer transition",
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600",
              "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10",
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => iconInputRef.current?.click()}
          >
            <Input
              type="file"
              accept="image/*,.svg"
              className="hidden"
              ref={iconInputRef}
              onChange={handleIconUpload}
              disabled={isUploadingIcon || isSubmitting}
            />
            {isUploadingIcon ? (
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            ) : form.watch("icon") ? (
              <div className="relative group">
                <img
                  src={form.watch("icon") || ""}
                  alt="Category Icon Preview"
                  className="h-16 w-16 rounded-md border object-cover"
                />
                {/* Remove Image Button */}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  // onClick={(e) => {
                  //   e.stopPropagation(); // Prevent triggering the file input click
                  //   form.setValue("icon", "");
                  // }}
                   onClick={async (e) => {
                    e.stopPropagation();
                    const currentIcon = form.getValues("icon");
                    if (currentIcon) {
                      try {
                        await deleteImage(currentIcon);
                      } catch (err) {
                        console.error("Failed to delete icon:", err);
                      }
                    }
                    form.setValue("icon", "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    if (iconInputRef.current) iconInputRef.current.value = "";
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                <UploadCloud className="h-8 w-8 mb-2" />
                <p className="text-center text-sm">
                  Drag & drop an icon here or click to upload
                </p>
              </div>
            )}
          </div>
        </FormItem>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Active Status</FormLabel>
                <FormDescription>
                  Whether this category is active.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
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
          <Button type="submit" disabled={isSubmitting || isUploadingIcon}>
            {isSubmitting
              ? initialData
                ? "Saving..."
                : "Creating..."
              : initialData
                ? "Save Changes"
                : "Create Category"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
