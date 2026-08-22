"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ImagePromptFormValues,
  imagePromptSchema,
  SingleResponse,
  ImageStyle,
} from "@/types";
import apiService from "@/lib/apiService";

interface ImagePromptFormProps {
  initialData?: ImagePromptFormValues | null;
  onSubmit: (values: ImagePromptFormValues) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
}

export default function ImagePromptForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
}: ImagePromptFormProps) {
  const { toast } = useToast();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [styles, setStyles] = useState<ImageStyle[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const form = useForm<ImagePromptFormValues>({
    resolver: zodResolver(imagePromptSchema),
    defaultValues: {
      image: initialData?.image || "",
      style: initialData?.style || "",
      image_prompt: initialData?.image_prompt || "",
      is_active: initialData?.is_active ?? true,
    },
  });

  // Fetch Image Styles for the dropdown
  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const res = await apiService<SingleResponse<ImageStyle[]>>(
          "/image-styles/all/admin", 
          { method: "GET" }
        );
        if (res.success) {
          setStyles(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch styles");
      }
    };
    fetchStyles();
  }, []);

  const handleImageDrop = async (files: FileList) => {
    const file = files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const uploadedUrl = await uploadFileToServer(file, "image-prompts");
      form.setValue("image", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast({
        title: "Image Uploaded",
        description: "Prompt image has been uploaded.",
      });
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Style Selection */}
          <FormField
            control={form.control}
            name="style"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image Style</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a style" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {styles.map((style) => (
                      <SelectItem key={style._id} value={style._id}>
                        {style.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Image Upload */}
        <FormItem>
          <FormLabel>Prompt Image (Required)</FormLabel>
          <div
            className={cn(
              "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 cursor-pointer transition",
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600",
              "hover:border-blue-500 hover:bg-muted/50"
            )}
            onClick={() => imageInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.length) {
                handleImageDrop(e.dataTransfer.files);
                e.dataTransfer.clearData();
              }
            }}
          >
            <Input
              type="file"
              accept="image/*"
              className="hidden"
              ref={imageInputRef}
              onChange={(e) => {
                if (e.target.files) handleImageDrop(e.target.files);
              }}
              disabled={isUploadingImage || isSubmitting}
            />

            {isUploadingImage ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : form.watch("image") ? (
              <div className="relative">
                <img
                  src={form.watch("image")}
                  alt="Preview"
                  className="h-64 w-auto rounded-md object-contain"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  // onClick={(e) => {
                  //   e.stopPropagation();
                  //   form.setValue("image", "", {
                  //     shouldDirty: true,
                  //     shouldValidate: true,
                  //   });
                  // }}
                   onClick={async (e) => {
                    e.stopPropagation();
                    const currentImage = form.getValues("image");
                    if (currentImage) {
                      try {
                        await deleteImage(currentImage);
                      } catch (err) {
                        console.error("Failed to delete image:", err);
                      }
                    }
                    form.setValue("image", "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    if (imageInputRef.current) imageInputRef.current.value = "";
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <UploadCloud className="h-8 w-8 mb-2" />
                <p className="text-sm text-center">
                  Drag & drop image here <br /> or click to upload
                </p>
              </div>
            )}
          </div>
          <FormField
             control={form.control}
             name="image"
             render={() => <FormMessage />}
          />
        </FormItem>

        {/* Prompt Text */}
        <FormField
          control={form.control}
          name="image_prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prompt Text</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter the prompt used to generate the image..."
                  className="h-32"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Active Status */}
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Active Status</FormLabel>
                <FormDescription>Visible to users when active.</FormDescription>
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

        <div className="flex justify-end space-x-3">
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
          <Button type="submit" disabled={isSubmitting || isUploadingImage}>
            {isSubmitting
              ? initialData
                ? "Saving..."
                : "Creating..."
              : initialData
                ? "Save Changes"
                : "Create Image Prompt"}
          </Button>
        </div>
      </form>
    </Form>
  );
}