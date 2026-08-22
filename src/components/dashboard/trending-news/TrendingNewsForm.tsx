"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  TrendingNewsFormSchema,
  TrendingNewsFormValues,
  NewsCategory,
} from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  API_BASE_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
} from "@/config";
import { TiptapEditorNoSSR } from "@/components/shared/TiptapEditor";
import { cn } from "@/lib/utils";

interface TrendingNewsFormProps {
  initialData?: TrendingNewsFormValues;
  onSubmit: (values: TrendingNewsFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  toolCategories: NewsCategory[];
}

export default function TrendingNewsForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  toolCategories,
}: TrendingNewsFormProps) {
  const form = useForm<TrendingNewsFormValues>({
    resolver: zodResolver(TrendingNewsFormSchema),
    defaultValues: initialData || {
      title: "",
      image: "",
      description: "",
      category_id: [],
    },
  });

  const toolIconInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const [isDragging, setIsDragging] = useState(false);

  const image = form.watch("image");

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only PNG, JPG, and SVG images are allowed.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();

      if (data.secure_url) {
        form.setValue("image", data.secure_url, {
          shouldDirty: true,
          shouldValidate: true,
        });
        toast({ title: "Image uploaded successfully." });
      } else {
        throw new Error(data.error?.message || "Upload failed");
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (toolIconInputRef.current) toolIconInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const fakeEvent = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleImageUpload(fakeEvent);
    }
  };

  const flattenCategoryTree = (
    tree: NewsCategory[],
    prefix = ""
  ): NewsCategory[] => {
    return tree.flatMap((node) => {
      const current = [{ ...node, name: prefix + node.name }];
      const children = flattenCategoryTree(
        node.children || [],
        prefix + "   ↳ "
      );
      return [...current, ...children];
    });
  };

  // useEffect(() => {
  //   const fetchCategoryTree = async () => {
  //     try {
  //       const res = await fetch(`${API_BASE_URL}/news-categories/tree`);
  //       const json = await res.json();
  //       if (json.success) {
  //         const flat = flattenCategoryTree(json.data);
  //         setCategories(flat);
  //       }
  //     } catch (err) {
  //       toast({
  //         title: "Failed to load categories",
  //         description: (err as Error).message,
  //         variant: "destructive",
  //       });
  //     } finally {
  //       setLoadingCategories(false);
  //     }
  //   };

  //   fetchCategoryTree();
  // }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">
                Title
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter trending news title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">
                Description
              </FormLabel>
              <FormControl>
                <TiptapEditorNoSSR
                  value={field.value || ""}
                  onChange={(value) => {
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-1/2">
            <FormField
              control={form.control}
              name="image"
              render={() => (
                <FormItem>
                  <FormLabel className="text-dark dark:text-gray-200">
                    News Image
                  </FormLabel>
                  <FormControl>
                    <div
                      className={cn(
                        "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 cursor-pointer transition",
                        isDragging
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-300 dark:border-gray-600",
                        "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                      )}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => toolIconInputRef.current?.click()}
                    >
                      <Input
                        ref={toolIconInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={isSubmitting || isUploading}
                      />

                      {isUploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                      ) : image ? (
                        <div className="relative w-full h-40">
                          <img
                            src={image}
                            alt="Preview"
                            className="w-full h-full object-contain mt-2 rounded-md border p-2"
                          />
                          <button
                            type="button"
                            className="absolute top-1 right-1 py-1 px-2 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-sm"
                            onClick={() => {
                              form.setValue("image", "", {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                              if (toolIconInputRef.current) {
                                toolIconInputRef.current.value = "";
                              }
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                          <UploadCloud className="h-8 w-8 mb-2" />
                          <p className="text-sm text-center">
                            Drag & drop an image here <br /> or click to upload
                          </p>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="md:w-1/2">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => {
                // Build tree structure from flat categories
                type CategoryNode = NewsCategory & {
                  children?: CategoryNode[];
                };
                const buildTree = (
                  categories: NewsCategory[]
                ): CategoryNode[] => {
                  const map = new Map<string, CategoryNode>();
                  const roots: CategoryNode[] = [];

                  // Initialize map
                  categories.forEach((cat) => {
                    map.set(cat._id, { ...cat, children: [] });
                  });

                  categories.forEach((cat) => {
                    const node = map.get(cat._id);
                    const parentId =
                      typeof cat.parent === "object" && cat.parent?._id
                        ? cat.parent._id
                        : typeof cat.parent === "string"
                        ? cat.parent
                        : null;

                    if (parentId && map.has(parentId)) {
                      map.get(parentId)!.children!.push(node!);
                    } else {
                      roots.push(node!);
                    }
                  });

                  return roots;
                };

                const tree = buildTree(toolCategories);

                // State for selected category ids
                const [selectedIds, setSelectedIds] = React.useState<string[]>(
                  field.value || []
                );

                // Helper to get all descendant ids of a node
                const getAllDescendantIds = (node: CategoryNode): string[] => {
                  let ids: string[] = [];
                  if (node.children && node.children.length > 0) {
                    node.children.forEach((child) => {
                      ids.push(child._id);
                      ids = ids.concat(getAllDescendantIds(child));
                    });
                  }
                  return ids;
                };
                // Handle checkbox change
                const onCheckboxChange = (
                  node: CategoryNode,
                  checked: boolean
                ) => {
                  let newSelected = new Set(selectedIds);

                  const getParentId = (node: CategoryNode): string | null => {
                    if (typeof node.parent === "string") return node.parent;
                    if (typeof node.parent === "object" && node.parent?._id)
                      return node.parent._id;
                    return null;
                  };

                  const getAllAncestors = (node: CategoryNode): string[] => {
                    const ancestors: string[] = [];
                    let currentNode = node;
                    while (true) {
                      const parentId = getParentId(currentNode);
                      if (!parentId) break;
                      ancestors.push(parentId);
                      const parent = toolCategories.find(
                        (c) => c._id === parentId
                      );
                      if (!parent) break;
                      currentNode = parent as CategoryNode;
                    }
                    return ancestors;
                  };

                  const getAllDescendants = (node: CategoryNode): string[] => {
                    let ids: string[] = [];
                    if (node.children && node.children.length > 0) {
                      node.children.forEach((child) => {
                        ids.push(child._id);
                        ids = ids.concat(getAllDescendants(child));
                      });
                    }
                    return ids;
                  };

                  if (checked) {
                    // Select this node
                    newSelected.add(node._id);
                    // Select all ancestors
                    getAllAncestors(node).forEach((id) => newSelected.add(id));
                    // Select all descendants
                    getAllDescendants(node).forEach((id) =>
                      newSelected.add(id)
                    );
                  } else {
                    // Unselect this node
                    newSelected.delete(node._id);
                    // Unselect all descendants
                    getAllDescendants(node).forEach((id) =>
                      newSelected.delete(id)
                    );
                    // Unselect parent if it has no other selected children
                    const ancestors = getAllAncestors(node);
                    ancestors.forEach((parentId) => {
                      const parent = toolCategories.find(
                        (c) => c._id === parentId
                      );
                      if (!parent) return;
                      const siblings = toolCategories.filter(
                        (c) => (c as any).parent === parent.name
                      );
                      const anySiblingSelected = siblings.some((sibling) =>
                        newSelected.has(sibling._id)
                      );
                      if (!anySiblingSelected) {
                        newSelected.delete(parentId);
                      }
                    });
                  }

                  const result = Array.from(newSelected);
                  setSelectedIds(result);
                  field.onChange(result);
                };

                // Recursive render tree
                const renderTree = (nodes: CategoryNode[]) => {
                  return nodes.map((node) => {
                    const isChecked = selectedIds.includes(node._id);
                    return (
                      <div key={node._id} className="ml-4">
                        <label className="inline-flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              onCheckboxChange(node, e.target.checked)
                            }
                          />
                          <span>{node.name}</span>
                        </label>
                        {node.children && node.children.length > 0 && (
                          <div className="ml-6 border-l pl-2 mt-1">
                            {renderTree(node.children)}
                          </div>
                        )}
                      </div>
                    );
                  });
                };

                return (
                  <FormItem>
                    <FormLabel className="text-dark dark:text-gray-200">
                      Categories
                    </FormLabel>
                    <FormControl>
                      {toolCategories.length === 0 ? (
                        <p>No categories available</p>
                      ) : (
                        <div className="max-h-60 overflow-auto border rounded p-2">
                          {renderTree(tree)}
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
