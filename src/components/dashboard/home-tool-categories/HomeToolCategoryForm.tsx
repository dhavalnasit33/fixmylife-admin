'use client';

import React, { useEffect, useRef, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Loader2, UploadCloud } from "lucide-react";
import { cn, deleteImage, uploadFileToServer } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/config";
import { HomeToolCategoryFormValues, homeToolCategorySchema } from "@/types";



interface HomeToolCategoryFormProps {
  initialData?: HomeToolCategoryFormValues & { parent?: string | { _id: string } } | null;
  onSubmit: (values: HomeToolCategoryFormValues) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
  categories?: any[];
}



// -------------------- Form Component --------------------
export default function HomeToolCategoryForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
}: HomeToolCategoryFormProps) {
  const { toast } = useToast();
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [isUploadingTabNormalIcon, setIsUploadingTabNormalIcon] = useState(false);
  const [isUploadingTabActiveIcon, setIsUploadingTabActiveIcon] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<{ label: string; plainLabel: string; value: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingTabNormalIcon, setIsDraggingTabNormalIcon] = useState(false);
  const [isDraggingTabActiveIcon, setIsDraggingTabActiveIcon] = useState(false);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const tabNormalIconInputRef = useRef<HTMLInputElement>(null);
  const tabActiveIconInputRef = useRef<HTMLInputElement>(null);

  const defaultParent =
    typeof initialData?.parent === "object" && initialData.parent !== null
      ? (initialData.parent as { _id: string })._id
      : initialData?.parent || "none";

  const form = useForm<HomeToolCategoryFormValues>({
    resolver: zodResolver(homeToolCategorySchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      icon: initialData?.icon || "",
      is_active: initialData?.is_active ?? true,
    },
  });



  // -------------------- File Upload Handlers --------------------
  const handleIconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingIcon(true);
    try {
      const uploadedUrl = await uploadFileToServer(file, "home-tool-category");
      form.setValue("icon", uploadedUrl, { shouldDirty: true, shouldValidate: true });
      toast({ title: "Icon Uploaded", description: "Category icon has been uploaded." });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message || "Could not upload icon.", variant: "destructive" });
    } finally {
      setIsUploadingIcon(false);
      if (iconInputRef.current) iconInputRef.current.value = "";
    }
  };

  const handleTabNormalIconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingTabNormalIcon(true);
    try {
      const uploadedUrl = await uploadFileToServer(file, "home-tool-category");
      form.setValue("tab_normal_icon_image", uploadedUrl, { shouldDirty: true, shouldValidate: true });
      toast({ title: "Tab Normal Icon Uploaded", description: "Tab normal icon has been uploaded." });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message || "Could not upload tab normal icon.", variant: "destructive" });
    } finally {
      setIsUploadingTabNormalIcon(false);
      if (tabNormalIconInputRef.current) tabNormalIconInputRef.current.value = "";
    }
  };

  const handleTabActiveIconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingTabActiveIcon(true);
    try {
      const uploadedUrl = await uploadFileToServer(file, "home-tool-category");
      form.setValue("tab_active_icon_image", uploadedUrl, { shouldDirty: true, shouldValidate: true });
      toast({ title: "Tab Active Icon Uploaded", description: "Tab active icon has been uploaded." });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message || "Could not upload tab active icon.", variant: "destructive" });
    } finally {
      setIsUploadingTabActiveIcon(false);
      if (tabActiveIconInputRef.current) tabActiveIconInputRef.current.value = "";
    }
  };

  // -------------------- Drag & Drop --------------------
  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) await handleIconUpload({ target: { files: [file] } } as any);
  };
  const handleTabNormalIconDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingTabNormalIcon(false);
    const file = event.dataTransfer.files?.[0];
    if (file) await handleTabNormalIconUpload({ target: { files: [file] } } as any);
  };
  const handleTabActiveIconDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingTabActiveIcon(false);
    const file = event.dataTransfer.files?.[0];
    if (file) await handleTabActiveIconUpload({ target: { files: [file] } } as any);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(true); };
  const handleTabNormalIconDragOver = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDraggingTabNormalIcon(true); };
  const handleTabActiveIconDragOver = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDraggingTabActiveIcon(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleTabNormalIconDragLeave = () => setIsDraggingTabNormalIcon(false);
  const handleTabActiveIconDragLeave = () => setIsDraggingTabActiveIcon(false);

  // -------------------- Submit --------------------
  const handleSubmit: SubmitHandler<HomeToolCategoryFormValues> = async (data) => {
    if (!data.parent || data.parent === "none") delete data.parent;
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Name */}
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl><Input placeholder="e.g., Content Tools" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Description */}
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl><Textarea placeholder="Describe this category..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Parent Category */}
        {/* <FormField control={form.control} name="parent" render={({ field }) => (
          <FormItem>
            <FormLabel>Parent Category (optional)</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                <SelectTrigger><SelectValue placeholder="Select parent category" /></SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormDescription>Select a parent category or leave blank for top-level.</FormDescription>
            <FormMessage />
          </FormItem>
        )} /> */}

        {/* Icons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Category Icon */}
          <FormItem>
            <FormLabel>Category Icon</FormLabel>
            <div className={cn("flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 cursor-pointer transition",
              isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600",
              "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
            )}
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => iconInputRef.current?.click()}>
              <Input type="file" accept="image/*,.svg" className="hidden" ref={iconInputRef} onChange={handleIconUpload} disabled={isUploadingIcon || isSubmitting} />
              {isUploadingIcon ? <Loader2 className="h-8 w-8 animate-spin text-gray-500" /> :
                form.watch("icon") ? <img src={form.watch("icon")} alt="Category Icon Preview" className="h-16 w-16 rounded-md border object-cover" /> :
                  <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                    <UploadCloud className="h-8 w-8 mb-2" />
                    <p className="text-center text-sm">Drag & drop an icon here or click to upload</p>
                  </div>
              }
            </div>
          </FormItem>

          {/* Tab Normal Icon */}
          {/* <FormItem>
            <FormLabel>Tab Normal Icon</FormLabel>
            <div className={cn("flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 cursor-pointer transition",
              isDraggingTabNormalIcon ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600",
              "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
            )}
              onDragOver={handleTabNormalIconDragOver} onDragLeave={handleTabNormalIconDragLeave} onDrop={handleTabNormalIconDrop} onClick={() => tabNormalIconInputRef.current?.click()}>
              <Input type="file" accept="image/*,.svg" className="hidden" ref={tabNormalIconInputRef} onChange={handleTabNormalIconUpload} disabled={isUploadingTabNormalIcon || isSubmitting} />
              {isUploadingTabNormalIcon ? <Loader2 className="h-8 w-8 animate-spin text-gray-500" /> :
                form.watch("tab_normal_icon_image") ? <img src={form.watch("tab_normal_icon_image")} alt="Tab Normal Icon" className="h-16 w-16 rounded-md border object-cover" /> :
                  <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                    <UploadCloud className="h-8 w-8 mb-2" />
                    <p className="text-center text-sm">Drag & drop tab normal icon here or click to upload</p>
                  </div>
              }
            </div>
          </FormItem> */}

          {/* Tab Active Icon */}
          {/* <FormItem>
            <FormLabel>Tab Active Icon</FormLabel>
            <div className={cn("flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 cursor-pointer transition",
              isDraggingTabActiveIcon ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600",
              "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
            )}
              onDragOver={handleTabActiveIconDragOver} onDragLeave={handleTabActiveIconDragLeave} onDrop={handleTabActiveIconDrop} onClick={() => tabActiveIconInputRef.current?.click()}>
              <Input type="file" accept="image/*,.svg" className="hidden" ref={tabActiveIconInputRef} onChange={handleTabActiveIconUpload} disabled={isUploadingTabActiveIcon || isSubmitting} />
              {isUploadingTabActiveIcon ? <Loader2 className="h-8 w-8 animate-spin text-gray-500" /> :
                form.watch("tab_active_icon_image") ? <img src={form.watch("tab_active_icon_image")} alt="Tab Active Icon" className="h-16 w-16 rounded-md border object-cover" /> :
                  <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                    <UploadCloud className="h-8 w-8 mb-2" />
                    <p className="text-center text-sm">Drag & drop tab active icon here or click to upload</p>
                  </div>
              }
            </div>
          </FormItem> */}
        </div>

        {/* Active Switch */}
        <FormField control={form.control} name="is_active" render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel>Active Status</FormLabel>
              <FormDescription>Whether this category is active.</FormDescription>
            </div>
            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} /></FormControl>
          </FormItem>
        )} />

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>}
          <Button type="submit" disabled={isSubmitting || isUploadingIcon}>
            {isSubmitting ? initialData ? "Saving..." : "Creating..." : initialData ? "Save Changes" : "Create Category"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
