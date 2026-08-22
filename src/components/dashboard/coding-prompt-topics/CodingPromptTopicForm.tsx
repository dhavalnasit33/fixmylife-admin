"use client";

import React, { useRef, useState } from "react";
import { useForm, useFieldArray, Control, UseFormReturn } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud, X, Plus, Trash2 } from "lucide-react";
import { cn, uploadFileToServer, deleteImage } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { TiptapEditorNoSSR } from "@/components/shared/TiptapEditor";
import {
  CodingPromptTopicFormValues,
  codingPromptTopicSchema,
} from "@/types";
import { Card, CardContent } from "@/components/ui/card";

interface CodingPromptTopicFormProps {
  initialData?: CodingPromptTopicFormValues;
  onSubmit: (values: CodingPromptTopicFormValues) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
}

// --- Helper Component for Image Upload ---
const ImageUploadField = ({
  value,
  onChange,
  label,
  disabled,
}: {
  value?: string;
  onChange: (url: string) => void;
  label: string;
  disabled?: boolean;
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleUpload = async (file: File) => {
    if (!file) return;
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Only PNG, JPG, SVG allowed.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadFileToServer(file, "coding-topics");
      onChange(url);
      toast({ title: "Image uploaded successfully" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value) return;
    try {
      await deleteImage(value);
      onChange("");
    } catch (err) {
      console.error("Delete failed", err);
      onChange(""); // Clear UI anyway
    }
  };

  return (
    <div className="space-y-2">
      <FormLabel>{label}</FormLabel>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition",
          isDragging ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]);
        }}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          disabled={disabled || isUploading}
        />

        {isUploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : value ? (
          <div className="relative w-full h-full p-2">
            <img src={value} alt="Preview" className="w-full h-full object-contain rounded-md" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6"
              onClick={handleDelete}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-muted-foreground text-xs text-center p-2">
            <UploadCloud className="h-6 w-6 mb-1" />
            <p>Drag & drop or click</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Helper Component for Single Subtopic Row ---
const SubtopicItem = ({
  index,
  control,
  remove,
}: {
  index: number;
  control: Control<CodingPromptTopicFormValues>;
  remove: (index: number) => void;
}) => {
  return (
    <Card className="mb-6 border bg-card text-card-foreground shadow-sm">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
              {index + 1}
            </div>
            <h4 className="font-semibold text-sm">Subtopic Details</h4>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => remove(index)} 
            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Remove
          </Button>
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Subtopic Title */}
            <FormField
              control={control}
              name={`subtopics.${index}.title`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input placeholder="e.g. Create Component" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subtopic Icon */}
            <FormField
              control={control}
              name={`subtopics.${index}.icon`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUploadField
                      label="Subtopic Icon"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Subtopic Description */}
          <FormField
            control={control}
            name={`subtopics.${index}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea placeholder="Short explanation..." className="h-20" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Subtopic Tiptap Editor */}
          <FormField
            control={control}
            name={`subtopics.${index}.prompt_template`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prompt Template (Rich Text)</FormLabel>
                <FormControl>
                  <div className="border rounded-md min-h-[200px]">
                    <TiptapEditorNoSSR
                      value={field.value || ""}
                      onChange={(val) => field.onChange(val)}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};

// --- Main Form Component ---
export default function CodingPromptTopicForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
}: CodingPromptTopicFormProps) {
  const form = useForm<CodingPromptTopicFormValues>({
    resolver: zodResolver(codingPromptTopicSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      icon: initialData?.icon || "",
      is_active: initialData?.is_active ?? true,
      subtopics: initialData?.subtopics || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subtopics",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* --- Main Topic Section (Vertical Layout) --- */}
        <div className="gap-6 flex flex-col">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Main Topic Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. React Development" {...field} />
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
                  <Textarea placeholder="General description of this topic..." className="h-32" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-6 md:grid-cols-2">
            {/* Active Status */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-white dark:bg-gray-950">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>Visible in the menu?</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Main Icon Upload */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUploadField 
                      label="Main Topic Icon" 
                      value={field.value} 
                      onChange={field.onChange} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <hr className="border-border my-8" />

        {/* --- Subtopics Section --- */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Subtopics</h3>
              <p className="text-sm text-muted-foreground">Add individual prompt templates under this topic.</p>
            </div>
            <Button
              type="button"
              variant="default"
              onClick={() => append({ title: "", description: "", icon: "", prompt_template: "" })}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Subtopic
            </Button>
          </div>

          {fields.length === 0 && (
             <div className="text-center py-16 border-2 border-dashed rounded-lg bg-muted/20">
               <p className="text-muted-foreground mb-4">No subtopics added yet.</p>
               <Button
                type="button"
                variant="outline"
                onClick={() => append({ title: "", description: "", icon: "", prompt_template: "" })}
              >
                Start adding subtopics
              </Button>
             </div>
          )}

          <div className="space-y-6">
            {fields.map((field, index) => (
              <SubtopicItem
                key={field.id}
                index={index}
                control={form.control}
                remove={remove}
              />
            ))}
          </div>
        </div>

        {/* --- Actions --- */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form> 
  );
}