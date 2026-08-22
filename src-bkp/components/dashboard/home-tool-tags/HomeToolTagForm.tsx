'use client';

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
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { HomeToolTagFormValues, homeToolTagSchema } from "@/types";

// -------------------- Props --------------------
interface HomeToolTagFormProps {
  initialData?: HomeToolTagFormValues | null;
  onSubmit: (values: HomeToolTagFormValues) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
}


// -------------------- Component --------------------
export default function HomeToolTagForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
}: HomeToolTagFormProps) {

  const form = useForm<HomeToolTagFormValues>({
    resolver: zodResolver(homeToolTagSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      is_active: initialData?.is_active ?? true,
    },
  });

  // -------------------- Submit --------------------
  const handleSubmit: SubmitHandler<HomeToolTagFormValues> = async (data) => {
    await onSubmit(data);
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

        {/* Name */}
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g., AI Tools, Writing, Coding..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />


        {/* Description */}
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea placeholder="Describe this tag..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Active Status */}
        <FormField control={form.control} name="is_active" render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel>Active Status</FormLabel>
              <FormDescription>Toggle whether this tag is active.</FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
            </FormControl>
          </FormItem>
        )} />


        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (initialData ? "Saving..." : "Creating...") : initialData ? "Save Changes" : "Create Tag"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
