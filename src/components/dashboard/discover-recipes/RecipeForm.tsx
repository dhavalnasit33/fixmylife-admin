"use client";

import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService";
import { z } from "zod";
import { RecipeFormData, SingleResponse } from "@/types";
import { recipeSchema } from "@/types";

interface RecipeFormProps {
  initialData?: RecipeFormData & { _id?: string };
  onSuccess: () => void;
  onCancelEdit?: () => void;
}

export default function RecipeForm({
  initialData,
  onSuccess,
  onCancelEdit,
}: RecipeFormProps) {
  const { toast } = useToast();
  const form = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: { title: "", description: "", is_active: true },
  });

  // reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset({ title: "", description: "", is_active: true });
    }
  }, [initialData, form]);

  const onSubmit = async (data: RecipeFormData) => {
    try {
      const url = initialData?._id
        ? `/discover-recipes/${initialData._id}`
        : "/discover-recipes";
      const method = initialData?._id ? "PUT" : "POST";

      const res = await apiService<SingleResponse<null>>(url, {
        method,
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });

      if (res.success) {
        toast({
          title: "Success",
          description: res.message || "Recipe saved.",
        });
        form.reset({ title: "", description: "", is_active: true });
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to save recipe.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          name="title"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Recipe title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="description"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  className="w-full border rounded p-2"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div
          className="flex justify-end gap-2 mt-4"
          style={{ marginTop: "70px" }}
        >
          <Button type="submit">
            {initialData?._id ? "Update Recipe" : "Create Recipe"}
          </Button>

          <Button type="button" variant="outline" onClick={onCancelEdit}>
            Cancel
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
