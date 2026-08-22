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

// -------------------- Validation --------------------
export const marketingCategorySchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z
    .string()
    .min(5, { message: "Description must be at least 5 characters." }),
  system_prompt: z
    .string()
    .min(10, { message: "System prompt must be at least 10 characters." }),
  category: z.enum(["content", "code", "business", "creative", "analysis"]),
  parent: z.string().optional().or(z.literal("")),
  icon: z
    .string()
    .url({ message: "Icon must be a valid URL." })
    .optional()
    .or(z.literal("")),
  tab_normal_icon_image: z
    .string()
    .url({ message: "Tab normal icon must be a valid URL." })
    .optional()
    .or(z.literal("")),
  tab_active_icon_image: z
    .string()
    .url({ message: "Tab active icon must be a valid URL." })
    .optional()
    .or(z.literal("")),
  is_active: z.boolean().default(true),
});

export type MarketingCategoryFormValues = z.infer<
  typeof marketingCategorySchema
>;

interface MarketingCategoryFormProps {
  initialData?:
    | (MarketingCategoryFormValues & {
        parent?: string | { _id: string };
      })
    | null;
  onSubmit: (values: MarketingCategoryFormValues) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
  categories?: any[];
}

// -------------------- Flatten tree for dropdown --------------------
function flattenCategoryTree(
  tree: any[],
  prefix = ""
): { label: string; plainLabel: string; value: string }[] {
  return tree.flatMap((node) => {
    const label = prefix ? `${prefix}↳ ${node.name}` : node.name;
    const current = [{ label, plainLabel: node.name, value: node._id }];
    const children = flattenCategoryTree(node.children || [], prefix + "   ");
    return [...current, ...children];
  });
}

// -------------------- Form Component --------------------
export default function MarketingCategoryForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
}: MarketingCategoryFormProps) {
  const { toast } = useToast();
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [isUploadingTabNormalIcon, setIsUploadingTabNormalIcon] =
    useState(false);
  const [isUploadingTabActiveIcon, setIsUploadingTabActiveIcon] =
    useState(false);
  const [categoryOptions, setCategoryOptions] = useState<
    { label: string; plainLabel: string; value: string }[]
  >([]);
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

  const form = useForm<MarketingCategoryFormValues>({
    resolver: zodResolver(marketingCategorySchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      system_prompt: initialData?.system_prompt || "",
      parent: defaultParent,
      icon: initialData?.icon || "",
      tab_normal_icon_image: initialData?.tab_normal_icon_image || "",
      tab_active_icon_image: initialData?.tab_active_icon_image || "",
      is_active: initialData?.is_active ?? true,
      category: initialData?.category || "content",
    },
  });
  

  useEffect(() => {
    const fetchCategoryTree = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/marketing-categories/tree`);
        const json = await res.json();
        if (json.success) {
          const flat = flattenCategoryTree(json.data);
          setCategoryOptions([
            { label: "No Parent", plainLabel: "No Parent", value: "none" },
            ...flat,
          ]);
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCategoryTree();
  }, []);

  const handleIconUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingIcon(true);
    try {
      const uploadedUrl = await uploadFileToServer(file, "marketing-category");
      form.setValue("icon", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });

      toast({
        title: "Icon Uploaded",
        description: "Category icon has been uploaded.",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload icon.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingIcon(false);
      if (iconInputRef.current) iconInputRef.current.value = "";
    }
  };

  const handleTabNormalIconUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingTabNormalIcon(true);
    try {
      const uploadedUrl = await uploadFileToServer(file, "marketing-category");
      form.setValue("tab_normal_icon_image", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });

      toast({
        title: "Tab Normal Icon Uploaded",
        description: "Tab normal icon has been uploaded.",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload tab normal icon.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingTabNormalIcon(false);
      if (tabNormalIconInputRef.current)
        tabNormalIconInputRef.current.value = "";
    }
  };

  // ✅ Add this function for tab active icon image upload
  const handleTabActiveIconUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingTabActiveIcon(true);
    try {
      const uploadedUrl = await uploadFileToServer(file, "marketing-category");
      form.setValue("tab_active_icon_image", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });

      toast({
        title: "Tab Active Icon Uploaded",
        description: "Tab active icon has been uploaded.",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload tab active icon.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingTabActiveIcon(false);
      if (tabActiveIconInputRef.current)
        tabActiveIconInputRef.current.value = "";
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      await handleIconUpload({ target: { files: [file] } } as any);
    }
  };

  // ✅ Add drop handlers for new image fields
  const handleTabNormalIconDrop = async (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setIsDraggingTabNormalIcon(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      await handleTabNormalIconUpload({ target: { files: [file] } } as any);
    }
  };

  const handleTabActiveIconDrop = async (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setIsDraggingTabActiveIcon(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      await handleTabActiveIconUpload({ target: { files: [file] } } as any);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleTabNormalIconDragOver = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setIsDraggingTabNormalIcon(true);
  };

  const handleTabActiveIconDragOver = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setIsDraggingTabActiveIcon(true);
  };

  const handleDragLeave = () => setIsDragging(false);
  const handleTabNormalIconDragLeave = () => setIsDraggingTabNormalIcon(false);
  const handleTabActiveIconDragLeave = () => setIsDraggingTabActiveIcon(false);

  const handleSubmit: SubmitHandler<MarketingCategoryFormValues> = async (
    data
  ) => {
    if (!data.parent || data.parent === "none") delete data.parent;
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
              <FormLabel className="text-dark dark:text-gray-200">
                Name
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., Content Generation" {...field} />
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
              <FormLabel className="text-dark dark:text-gray-200">
                Description
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what this category is for..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="system_prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">
                System Prompt
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="Enter the base system prompt for tools in this category..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="parent"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">
                Parent Category (optional)
              </FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder="Select a parent category or 'No Parent'"
                      aria-label="Parent Category"
                    >
                      {categoryOptions.find(
                        (opt) => opt.value === form.getValues("parent")
                      )?.plainLabel || "No Parent"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                Select a parent category to create a child, or 'No Parent' for a
                top-level category.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-dark dark:text-gray-200">
                Category Type
              </FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category type" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "content",
                      "code",
                      "business",
                      "creative",
                      "analysis",
                    ].map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormItem>
            <FormLabel className="text-dark dark:text-gray-200">
              Category Icon
            </FormLabel>

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
              onClick={() => iconInputRef.current?.click()}
            >
              <Input
                id="categoryIconInput"
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
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.watch("icon")}
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
              name="icon"
              render={({ field }) => (
                <>
                  <FormControl>
                    <input type="hidden" {...field} />
                  </FormControl>
                  <FormDescription>
                    Upload an icon for the category.
                  </FormDescription>
                  <FormMessage />
                </>
              )}
            />
          </FormItem>

          {/* ✅ Add Tab Normal Icon Image Field */}
          <FormItem>
            <FormLabel className="text-dark dark:text-gray-200">
              Tab Normal Icon Image
            </FormLabel>

            <div
              className={cn(
                "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 cursor-pointer transition",
                isDraggingTabNormalIcon
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-gray-600",
                "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
              )}
              onDragOver={handleTabNormalIconDragOver}
              onDragLeave={handleTabNormalIconDragLeave}
              onDrop={handleTabNormalIconDrop}
              onClick={() => tabNormalIconInputRef.current?.click()}
            >
              <Input
                id="tabNormalIconInput"
                type="file"
                accept="image/*,.svg"
                className="hidden"
                ref={tabNormalIconInputRef}
                onChange={handleTabNormalIconUpload}
                disabled={isUploadingTabNormalIcon || isSubmitting}
              />

              {isUploadingTabNormalIcon ? (
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              ) : form.watch("tab_normal_icon_image") ? (
                <div className="relative">
                  <img
                    src={form.watch("tab_normal_icon_image")}
                    alt="Tab Normal Icon Preview"
                    className="h-16 w-16 rounded-md border object-cover"
                  />
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 py-1 px-2 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-sm"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const iconUrl = form.watch("tab_normal_icon_image");
                      if (iconUrl) {
                        try {
                          await deleteImage(iconUrl);
                        } catch (err) {
                          console.error("Error deleting image:", err);
                        }
                      }
                      form.setValue("tab_normal_icon_image", "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                  <UploadCloud className="h-8 w-8 mb-2" />
                  <p className="text-center text-sm">
                    Drag & drop tab normal icon here or click to upload
                  </p>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="tab_normal_icon_image"
              render={({ field }) => (
                <>
                  <FormControl>
                    <input type="hidden" {...field} />
                  </FormControl>
                  <FormDescription>
                    Upload a tab normal icon image for the category.
                  </FormDescription>
                  <FormMessage />
                </>
              )}
            />
          </FormItem>

          {/* ✅ Add Tab Active Icon Image Field */}
          <FormItem>
            <FormLabel className="text-dark dark:text-gray-200">
              Tab Active Icon Image
            </FormLabel>

            <div
              className={cn(
                "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 cursor-pointer transition",
                isDraggingTabActiveIcon
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-gray-600",
                "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
              )}
              onDragOver={handleTabActiveIconDragOver}
              onDragLeave={handleTabActiveIconDragLeave}
              onDrop={handleTabActiveIconDrop}
              onClick={() => tabActiveIconInputRef.current?.click()}
            >
              <Input
                id="tabActiveIconInput"
                type="file"
                accept="image/*,.svg"
                className="hidden"
                ref={tabActiveIconInputRef}
                onChange={handleTabActiveIconUpload}
                disabled={isUploadingTabActiveIcon || isSubmitting}
              />

              {isUploadingTabActiveIcon ? (
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              ) : form.watch("tab_active_icon_image") ? (
                <div className="relative">
                  <img
                    src={form.watch("tab_active_icon_image")}
                    alt="Tab Active Icon Preview"
                    className="h-16 w-16 rounded-md border object-cover"
                  />
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 py-1 px-2 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-sm"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const iconUrl = form.watch("tab_active_icon_image");
                      if (iconUrl) {
                        try {
                          await deleteImage(iconUrl);
                        } catch (err) {
                          console.error("Error deleting image:", err);
                        }
                      }
                      form.setValue("tab_active_icon_image", "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                  <UploadCloud className="h-8 w-8 mb-2" />
                  <p className="text-center text-sm">
                    Drag & drop tab active icon here or click to upload
                  </p>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="tab_active_icon_image"
              render={({ field }) => (
                <>
                  <FormControl>
                    <input type="hidden" {...field} />
                  </FormControl>
                  <FormDescription>
                    Upload a tab active icon image for the category.
                  </FormDescription>
                  <FormMessage />
                </>
              )}
            />
          </FormItem>
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel className="text-dark dark:text-gray-200">
                  Active Status
                </FormLabel>
                <FormDescription>
                  Whether this category is currently active and usable.
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
              disabled={isSubmitting || isUploadingIcon}
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
