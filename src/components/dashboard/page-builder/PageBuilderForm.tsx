"use client";

import { useState, useRef } from "react";
import { useFieldArray, UseFormReturn, useWatch } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
// ✅ IMPORT CHEVRONS
import { PlusCircle, Trash, UploadCloud, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cn, uploadFileToServer } from "@/lib/utils";
import { PageBuilderFormValues } from "@/app/dashboard/page-builder/page";
import YoastSeoForm from "@/components/dashboard/yoast-seo/YoastSeoForm";
import { TiptapEditorNoSSR } from "@/components/shared/TiptapEditor";

interface PageBuilderFormProps {
  form: UseFormReturn<PageBuilderFormValues>;
  isSubmitting: boolean;
}

export default function PageBuilderForm({
  form,
  isSubmitting,
}: PageBuilderFormProps) {
  const { toast } = useToast();
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // ✅ NEW: State to manage open/close sections
  const [openSections, setOpenSections] = useState({
    tabs: true,
    hero: false,
    grid: false,
    features: false,
    cards: false,
  });

  // ✅ NEW: Helper to toggle sections
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // --- Watch Tabs to populate Category Dropdown ---
  const watchedTabs = useWatch({
    control: form.control,
    name: "tabs",
  });

  // --- Field Arrays ---
  const { fields: tabFields, append: appendTab, remove: removeTab } = useFieldArray({
    control: form.control,
    name: "tabs",
  });

  const { fields: heroFields, append: appendHero, remove: removeHero } = useFieldArray({
    control: form.control,
    name: "hero_sections",
  });

  const { fields: gridFields, append: appendGrid, remove: removeGrid } = useFieldArray({
    control: form.control,
    name: "grid_features",
  });

  const { fields: featureFields, append: appendFeature, remove: removeFeature } = useFieldArray({
    control: form.control,
    name: "features",
  });

  const { fields: cardFields, append: appendCard, remove: removeCard } = useFieldArray({
    control: form.control,
    name: "cards",
  });

  // --- Generic Image Upload Handler ---
  const handleGenericUpload = async (
    fieldId: string,
    file: File | undefined,
    callback: (url: string) => void
  ) => {
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg", "image/svg+xml"].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only PNG, JPG, and SVG allowed.",
        variant: "destructive",
      });
      return;
    }

    setUploadingField(fieldId);
    try {
      const url = await uploadFileToServer(file, "page-builder");
      callback(url);
      toast({ title: "Image uploaded successfully." });
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploadingField(null);
    }
  };

  // --- Render Helper: Draggable Image Box ---
  const renderUploadBox = (
    value: string,
    onChange: (val: string) => void,
    fieldId: string,
    label: string,
    heightClass = "h-48"
  ) => {
    const isUploading = uploadingField === fieldId;

    return (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <div
          className={cn(
            "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-4 cursor-pointer transition relative",
            "border-gray-300 dark:border-gray-600",
            "hover:border-primary hover:bg-primary/5"
          )}
          onClick={() => document.getElementById(`file-input-${fieldId}`)?.click()}
        >
          <input
            id={`file-input-${fieldId}`}
            type="file"
            accept=".png,.jpg,.jpeg,.svg"
            className="hidden"
            onChange={(e) => handleGenericUpload(fieldId, e.target.files?.[0], onChange)}
          />

          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="animate-spin text-primary h-8 w-8 mb-2" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : value ? (
            <div className="relative w-full max-w-xs">
              <img
                src={value}
                alt="Preview"
                className={cn("w-full object-contain rounded-md border", heightClass)}
              />
              <button
                type="button"
                className="absolute -top-2 -right-2 py-1 px-2 bg-white rounded-full border shadow hover:bg-red-500 hover:text-white text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center text-muted-foreground">
              <UploadCloud className="h-8 w-8 mb-2" />
              <p className="text-sm text-center">Click to upload</p>
            </div>
          )}
        </div>
      </FormItem>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main Section */}
      <div className="flex-1 space-y-8">
        
        {/* --- 1. FILTER TABS (Collapsible) --- */}
        <div className="border rounded bg-muted/10 overflow-hidden">
          <div 
            className="flex justify-between items-center p-4 bg-muted/20 cursor-pointer hover:bg-muted/30 transition"
            onClick={() => toggleSection('tabs')}
          >
            <div className="flex items-center gap-2">
              {openSections.tabs ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              <div>
                <h3 className="text-lg font-semibold">Filter Tabs</h3>
                <p className="text-xs text-muted-foreground">Define top navigation filters.</p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation(); // Prevent toggling when clicking add
                appendTab({ label: "", value: "" });
              }}
              disabled={isSubmitting}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Tab
            </Button>
          </div>

          {openSections.tabs && (
            <div className="p-4 space-y-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tabFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-end border p-3 rounded bg-background">
                    <FormField
                      control={form.control}
                      name={`tabs.${index}.label`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs">Label</FormLabel>
                          <FormControl><Input {...field} placeholder="Label" /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`tabs.${index}.value`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs">Value</FormLabel>
                          <FormControl><Input {...field} placeholder="value_key" /></FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeTab(index)}>
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              {tabFields.length === 0 && <p className="text-sm text-center text-muted-foreground">No tabs added yet.</p>}
            </div>
          )}
        </div>

        {/* --- 2. HERO SECTIONS (Collapsible) --- */}
     {/* --- 2. HERO SECTIONS (Collapsible) --- */}
        <div className="border rounded bg-muted/10 overflow-hidden">
          <div 
            className="flex justify-between items-center p-4 bg-muted/20 cursor-pointer hover:bg-muted/30 transition"
            onClick={() => toggleSection('hero')}
          >
            <div className="flex items-center gap-2">
              {openSections.hero ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              <h3 className="text-lg font-semibold">Hero Sections</h3>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // ✅ UPDATED: Initialize with hero_image instead of colors
                appendHero({
                  category: "", 
                  title: "", 
                  sub_title: "", 
                  button_text: "Start Designing",
                  hero_image: "" 
                });
              }}
              disabled={isSubmitting}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Hero
            </Button>
          </div>

          {openSections.hero && (
            <div className="p-4 space-y-4 border-t">
              {heroFields.map((field, index) => (
                <div key={field.id} className="border p-4 rounded space-y-4 bg-card shadow-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">Hero {index + 1}</span>
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeHero(index)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Grid Layout: Text Fields on Left, Image Upload on Right */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Left Column: Text Inputs */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name={`hero_sections.${index}.category`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category (Tab)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select tab..." /></SelectTrigger></FormControl>
                              <SelectContent>
                                {watchedTabs?.map((tab, i) => (
                                  <SelectItem key={i} value={tab.value || "temp"}>{tab.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`hero_sections.${index}.title`}
                        render={({ field }) => (
                          <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`hero_sections.${index}.sub_title`}
                        render={({ field }) => (
                          <FormItem><FormLabel>Sub Title</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl></FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`hero_sections.${index}.button_text`}
                        render={({ field }) => (
                          <FormItem><FormLabel>Button Text</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )}
                      />
                    </div>

                    {/* Right Column: Image Upload (Replaces Color Pickers) */}
                    <div>
                      <FormField
                        control={form.control}
                        name={`hero_sections.${index}.hero_image`}
                        render={({ field }) => 
                          renderUploadBox(
                            field.value, 
                            field.onChange, 
                            `hero-img-${index}`, 
                            "Hero Background Image", 
                            "h-64" // Taller box for hero image
                          )
                        }
                      />
                    </div>

                  </div>
                </div>
              ))}
              {heroFields.length === 0 && <p className="text-sm text-center text-muted-foreground">No hero sections added.</p>}
            </div>
          )}
        </div>
        {/* --- 3. GRID FEATURES (Collapsible) --- */}
        <div className="border rounded bg-muted/10 overflow-hidden">
          <div 
            className="flex justify-between items-center p-4 bg-muted/20 cursor-pointer hover:bg-muted/30 transition"
            onClick={() => toggleSection('grid')}
          >
             <div className="flex items-center gap-2">
              {openSections.grid ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              <h3 className="text-lg font-semibold">Grid Features</h3>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                appendGrid({ category: "", title: "", description: "", image: "" });
              }}
              disabled={isSubmitting}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Grid Feature
            </Button>
          </div>

          {openSections.grid && (
            <div className="p-4 space-y-4 border-t">
              {gridFields.map((field, index) => (
                <div key={field.id} className="border p-4 rounded space-y-4 bg-card shadow-sm">
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium">Grid Feature {index + 1}</span>
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeGrid(index)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name={`grid_features.${index}.category`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category (Tab)</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Select tab..." /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    {watchedTabs?.map((tab, i) => (
                                      <SelectItem key={i} value={tab.value || "temp"}>{tab.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`grid_features.${index}.title`}
                            render={({ field }) => (
                              <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`grid_features.${index}.description`}
                            render={({ field }) => (
                              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
                            )}
                          />
                        </div>
                        <div>
                          <FormField
                            control={form.control}
                            name={`grid_features.${index}.image`}
                            render={({ field }) => renderUploadBox(field.value, field.onChange, `grid-img-${index}`, "Feature Image")}
                          />
                        </div>
                    </div>
                </div>
              ))}
               {gridFields.length === 0 && <p className="text-sm text-center text-muted-foreground">No grid features added.</p>}
            </div>
          )}
        </div>

        {/* --- 4. STANDARD FEATURES (Collapsible) --- */}
        <div className="border rounded bg-muted/10 overflow-hidden">
          <div 
            className="flex justify-between items-center p-4 bg-muted/20 cursor-pointer hover:bg-muted/30 transition"
            onClick={() => toggleSection('features')}
          >
            <div className="flex items-center gap-2">
              {openSections.features ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              <h3 className="text-lg font-semibold">Standard Features (List)</h3>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                appendFeature({ name: "", value: 0, is_active: true, show_value: true });
              }}
              disabled={isSubmitting}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Feature
            </Button>
          </div>
          
          {openSections.features && (
            <div className="p-4 space-y-4 border-t">
              <div className="grid gap-4">
                {featureFields.map((field, index) => (
                  <div key={field.id} className="border p-4 rounded relative bg-white shadow-sm">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeFeature(index)}>
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pr-8">
                      <FormField
                        control={form.control}
                        name={`features.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`features.${index}.value`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Value</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                value={field.value ?? 0}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex flex-row justify-between mt-4 border p-4 rounded bg-gray-50">
                      <FormField
                        control={form.control}
                        name={`features.${index}.is_active`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-blue-600" /></FormControl>
                            <FormLabel>Active</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`features.${index}.show_value`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-blue-600" /></FormControl>
                            <FormLabel>Show Value</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {featureFields.length === 0 && <p className="text-sm text-center text-muted-foreground">No features added.</p>}
            </div>
          )}
        </div>

        {/* --- 5. CARDS (Collapsible) --- */}
        <div className="border rounded bg-muted/10 overflow-hidden">
          <div 
             className="flex justify-between items-center p-4 bg-muted/20 cursor-pointer hover:bg-muted/30 transition"
             onClick={() => toggleSection('cards')}
          >
            <div className="flex items-center gap-2">
              {openSections.cards ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              <h3 className="text-lg font-semibold">Cards / Use Cases</h3>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                appendCard({
                  category: "", title: "", description: "", image: "", icon_image: "",
                  badge_text: "", checklist: [], button_text: "Launch", custom_url: ""
                });
              }}
              disabled={isSubmitting}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Card
            </Button>
          </div>

          {openSections.cards && (
            <div className="p-4 space-y-4 border-t">
              {cardFields.map((field, index) => (
                <div key={field.id} className="border p-4 rounded space-y-4 bg-card shadow-sm">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">Card {index + 1}</span>
                    <Button variant="destructive" size="sm" onClick={() => removeCard(index)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name={`cards.${index}.category`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category (Tab)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select a tab..." /></SelectTrigger></FormControl>
                              <SelectContent>
                                {watchedTabs?.map((tab, i) => (
                                  <SelectItem key={i} value={tab.value || "temp"}>{tab.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`cards.${index}.image`}
                        render={({ field }) => renderUploadBox(field.value, field.onChange, `card-img-${index}`, "Cover Image", "h-40")}
                      />
                      <FormField
                        control={form.control}
                        name={`cards.${index}.icon_image`}
                        render={({ field }) => renderUploadBox(field.value, field.onChange, `card-icon-${index}`, "Icon", "h-16 w-16")}
                      />
                    </div>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name={`cards.${index}.badge_text`}
                        render={({ field }) => <FormItem><FormLabel>Badge</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>}
                      />
                      <FormField
                        control={form.control}
                        name={`cards.${index}.title`}
                        render={({ field }) => <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>}
                      />
                      <FormField
                        control={form.control}
                        name={`cards.${index}.description`}
                        render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl></FormItem>}
                      />
                      
                      {/* Checklist */}
                      <div className="border p-3 rounded bg-muted/30">
                        <FormLabel>Checklist (Comma separated)</FormLabel>
                        <FormField
                            control={form.control}
                            name={`cards.${index}.checklist`}
                            render={({ field }) => (
                                <Textarea 
                                    placeholder="Item 1, Item 2, Item 3" 
                                    value={field.value?.join(", ") || ""} 
                                    onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                                />
                            )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={form.control}
                          name={`cards.${index}.button_text`}
                          render={({ field }) => <FormItem><FormLabel>Button Text</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>}
                        />
                        <FormField
                          control={form.control}
                          name={`cards.${index}.custom_url`}
                          render={({ field }) => <FormItem><FormLabel>URL</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {cardFields.length === 0 && <p className="text-sm text-center text-muted-foreground">No cards added.</p>}
            </div>
          )}
        </div>

        {/* Description & SEO */}
        <div className="space-y-4 pt-6 border-t">
          <FormField
            control={form.control}
            name="short_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Page Short Description</FormLabel>
                <FormControl><Textarea {...field} maxLength={200} /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Description</FormLabel>
                <div className="border rounded-md">
                  <TiptapEditorNoSSR
                    value={field.value || ""}
                    onChange={(val) => {
                      field.onChange(val);
                      form.setValue("description", val, { shouldDirty: true, shouldValidate: true });
                    }}
                  />
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4">Yoast SEO Settings</h3>
          <YoastSeoForm isSubmitting={isSubmitting} hideCoverImage hidePageDescription />
        </div>
      </div>

      {/* Sidebar - Global Images */}
      <div className="w-full lg:w-[300px] space-y-6 mt-8 lg:mt-0">
        <h3 className="font-semibold">Page Images</h3>
        <FormField control={form.control} name="cover_image" render={({ field }) => renderUploadBox(field.value, field.onChange, "main-cover", "Cover Image")} />
        <FormField control={form.control} name="tool_cover_image" render={({ field }) => renderUploadBox(field.value, field.onChange, "tool-cover", "Tool Cover")} />
        <FormField control={form.control} name="tab_normal_icon_image" render={({ field }) => renderUploadBox(field.value, field.onChange, "tab-normal", "Tab Normal Icon", "h-20 w-20")} />
        <FormField control={form.control} name="tab_active_icon_image" render={({ field }) => renderUploadBox(field.value, field.onChange, "tab-active", "Tab Active Icon", "h-20 w-20")} />
        <FormField control={form.control} name="tab_image" render={({ field }) => renderUploadBox(field.value, field.onChange, "tab-img", "Tab Image")} />
      </div>
    </div>
  );
}