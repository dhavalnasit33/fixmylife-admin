"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  PlusCircle,
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  RefreshCw,
  FolderTree,
  CheckCircle2,
  Layers,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL } from "@/config";

interface Subcategory {
  _id?: string;
  slug: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

interface MainCategory {
  _id?: string;
  slug: string;
  name: string;
  display_order: number;
  is_active: boolean;
  subcategories: any[];
}

export default function VideoTaxonomyPage() {
  const { toast } = useToast();

  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<
    "main-categories" | "subcategories" | "mapping"
  >("main-categories");
  const [selectedMainCat, setSelectedMainCat] = useState<MainCategory | null>(
    null,
  );

  // Modals state
  const [isMainModalOpen, setIsMainModalOpen] = useState(false);
  const [editingMainCat, setEditingMainCat] = useState<MainCategory | null>(
    null,
  );
  const [mainFormName, setMainFormName] = useState("");
  const [mainFormSlug, setMainFormSlug] = useState("");
  const [mainFormOrder, setMainFormOrder] = useState(1);

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSubcat, setEditingSubcat] = useState<Subcategory | null>(null);
  const [subFormName, setSubFormName] = useState("");
  const [subFormSlug, setSubFormSlug] = useState("");
  const [subFormOrder, setSubFormOrder] = useState(1);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mainRes, subRes] = await Promise.all([
        fetch(`${API_BASE_URL}/video-taxonomy`),
        fetch(`${API_BASE_URL}/video-taxonomy/subcategories`),
      ]);

      const mainJson = await mainRes.json();
      const subJson = await subRes.json();

      if (mainJson.success) {
        setMainCategories(mainJson.data || []);
        if (mainJson.data?.length > 0) {
          setSelectedMainCat((prev) => {
            if (!prev) return mainJson.data[0];
            const found = mainJson.data.find((m: any) => m._id === prev._id);
            return found || mainJson.data[0];
          });
        }
      }
      if (subJson.success) setSubcategories(subJson.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch video taxonomy data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle Active Status for Main Category
  const handleToggleMainActive = async (cat: MainCategory) => {
    if (!cat._id) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/video-taxonomy/main-categories/${cat._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: !cat.is_active }),
        },
      );
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Status Updated",
          description: `${cat.name} is now ${!cat.is_active ? "Active" : "Inactive"}.`,
        });
        setMainCategories((prev) =>
          prev.map((item) =>
            item._id === cat._id
              ? { ...item, is_active: !cat.is_active }
              : item,
          ),
        );
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle status.",
        variant: "destructive",
      });
    }
  };

  // Toggle Active Status for Subcategory
  const handleToggleSubActive = async (sub: Subcategory) => {
    if (!sub._id) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/video-taxonomy/subcategories/${sub._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: !sub.is_active }),
        },
      );
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Status Updated",
          description: `${sub.name} is now ${!sub.is_active ? "Active" : "Inactive"}.`,
        });
        setSubcategories((prev) =>
          prev.map((item) =>
            item._id === sub._id
              ? { ...item, is_active: !sub.is_active }
              : item,
          ),
        );
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle status.",
        variant: "destructive",
      });
    }
  };

  // Toggle Subcategory in Main Category mapping
  const handleToggleSubInMain = async (subId: string) => {
    if (!selectedMainCat || !selectedMainCat._id) return;

    const currentSubIds = (selectedMainCat.subcategories || []).map((s: any) =>
      typeof s === "string" ? s : s._id,
    );

    let updatedSubIds: string[];
    if (currentSubIds.includes(subId)) {
      updatedSubIds = currentSubIds.filter((id: string) => id !== subId);
    } else {
      updatedSubIds = [...currentSubIds, subId];
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/video-taxonomy/main-categories/${selectedMainCat._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subcategories: updatedSubIds }),
        },
      );
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update mapping.",
        variant: "destructive",
      });
    }
  };

  // Save Main Category (Create or Edit)
  const handleSaveMainCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainFormName.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingMainCat && editingMainCat._id) {
        const res = await fetch(
          `${API_BASE_URL}/video-taxonomy/main-categories/${editingMainCat._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: mainFormName.trim(),
              slug: mainFormSlug.trim() || undefined,
              display_order: Number(mainFormOrder),
            }),
          },
        );
        const data = await res.json();
        if (data.success) {
          toast({ title: "Success", description: "Main category updated." });
        }
      } else {
        const res = await fetch(
          `${API_BASE_URL}/video-taxonomy/main-categories`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: mainFormName.trim(),
              slug: mainFormSlug.trim() || undefined,
              display_order: Number(mainFormOrder),
              is_active: true,
              subcategories: [],
            }),
          },
        );
        const data = await res.json();
        if (data.success) {
          toast({ title: "Success", description: "Main category created." });
        }
      }
      setIsMainModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save category.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Subcategory (Create or Edit)
  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subFormName.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingSubcat && editingSubcat._id) {
        const res = await fetch(
          `${API_BASE_URL}/video-taxonomy/subcategories/${editingSubcat._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: subFormName.trim(),
              slug: subFormSlug.trim() || undefined,
              display_order: Number(subFormOrder),
            }),
          },
        );
        const data = await res.json();
        if (data.success) {
          toast({ title: "Success", description: "Subcategory updated." });
        }
      } else {
        const res = await fetch(
          `${API_BASE_URL}/video-taxonomy/subcategories`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: subFormName.trim(),
              slug: subFormSlug.trim() || undefined,
              display_order: Number(subFormOrder),
              is_active: true,
            }),
          },
        );
        const data = await res.json();
        if (data.success) {
          toast({ title: "Success", description: "Subcategory created." });
        }
      }
      setIsSubModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save subcategory.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Main Category
  const handleDeleteMainCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this main category?")) return;
    try {
      await fetch(`${API_BASE_URL}/video-taxonomy/main-categories/${id}`, {
        method: "DELETE",
      });
      toast({ title: "Success", description: "Main category deleted." });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete.",
        variant: "destructive",
      });
    }
  };

  // Delete Subcategory
  const handleDeleteSubcategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subcategory?")) return;
    try {
      await fetch(`${API_BASE_URL}/video-taxonomy/subcategories/${id}`, {
        method: "DELETE",
      });
      toast({ title: "Success", description: "Subcategory deleted." });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete.",
        variant: "destructive",
      });
    }
  };

  const filteredMainCategories = mainCategories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredSubcategories = subcategories.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Video Taxonomy Management"
        description="Manage 6 Main Categories, 16 Subcategories, Active Status, and Tool Mappings for the Video Generator."
        actionButtons={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            {activeTab === "main-categories" && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingMainCat(null);
                  setMainFormName("");
                  setMainFormSlug("");
                  setMainFormOrder(mainCategories.length + 1);
                  setIsMainModalOpen(true);
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Main Category
              </Button>
            )}
            {activeTab === "subcategories" && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingSubcat(null);
                  setSubFormName("");
                  setSubFormSlug("");
                  setSubFormOrder(subcategories.length + 1);
                  setIsSubModalOpen(true);
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Subcategory
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs Navigation & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-1 border rounded-lg p-1 bg-muted/40">
          <Button
            variant={activeTab === "main-categories" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("main-categories")}
            className="text-xs font-medium"
          >
            <Layers className="mr-1.5 h-3.5 w-3.5" />
            1. Main Categories ({mainCategories.length})
          </Button>
          <Button
            variant={activeTab === "subcategories" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("subcategories")}
            className="text-xs font-medium"
          >
            <FolderTree className="mr-1.5 h-3.5 w-3.5" />
            2. Subcategories ({subcategories.length})
          </Button>
          <Button
            variant={activeTab === "mapping" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("mapping")}
            className="text-xs font-medium"
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            3. Interactive Mapping
          </Button>
        </div>

        {activeTab !== "mapping" && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`Search ${activeTab === "main-categories" ? "categories" : "subcategories"}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>
        )}
      </div>

      {/* TAB 1: MAIN CATEGORIES TABLE */}
      {activeTab === "main-categories" && (
        <div className="rounded-md border shadow-sm bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Order</TableHead>
                <TableHead>Category Name</TableHead>
                <TableHead className="hidden md:table-cell">Slug</TableHead>
                <TableHead>Mapped Subcategories</TableHead>
                <TableHead className="text-center w-[120px]">Active</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`skeleton-main-${i}`}>
                    <TableCell>
                      <Skeleton className="h-5 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-5 w-10 mx-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-5 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredMainCategories.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No main categories found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMainCategories.map((cat) => (
                  <TableRow key={cat._id || cat.slug}>
                    <TableCell className="font-mono font-medium">
                      {cat.display_order}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {cat.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                      /{cat.slug}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {Array.isArray(cat.subcategories)
                          ? cat.subcategories.length
                          : 0}{" "}
                        Subcategories
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={cat.is_active}
                        onCheckedChange={() => handleToggleMainActive(cat)}
                        aria-label={`Toggle active state for ${cat.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingMainCat(cat);
                              setMainFormName(cat.name);
                              setMainFormSlug(cat.slug);
                              setMainFormOrder(cat.display_order || 1);
                              setIsMainModalOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          {cat._id && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteMainCategory(cat._id!)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 2: SUBCATEGORIES TABLE */}
      {activeTab === "subcategories" && (
        <div className="rounded-md border shadow-sm bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Order</TableHead>
                <TableHead>Subcategory Name</TableHead>
                <TableHead className="hidden md:table-cell">Slug</TableHead>
                <TableHead className="text-center w-[120px]">Active</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={`skeleton-sub-${i}`}>
                    <TableCell>
                      <Skeleton className="h-5 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-5 w-10 mx-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-5 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredSubcategories.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No subcategories found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubcategories.map((sub) => (
                  <TableRow key={sub._id || sub.slug}>
                    <TableCell className="font-mono font-medium">
                      {sub.display_order}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {sub.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                      /{sub.slug}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={sub.is_active}
                        onCheckedChange={() => handleToggleSubActive(sub)}
                        aria-label={`Toggle active state for ${sub.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingSubcat(sub);
                              setSubFormName(sub.name);
                              setSubFormSlug(sub.slug);
                              setSubFormOrder(sub.display_order || 1);
                              setIsSubModalOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          {sub._id && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteSubcategory(sub._id!)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 3: INTERACTIVE MAPPING VIEW */}
      {activeTab === "mapping" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Main Categories selector */}
          <div className="lg:col-span-5 border rounded-lg p-4 bg-card shadow-sm space-y-3">
            <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              1. Select Main Category
            </h3>
            <div className="space-y-1.5">
              {mainCategories.map((mainCat) => {
                const isSelected = selectedMainCat?._id === mainCat._id;
                const subCount = Array.isArray(mainCat.subcategories)
                  ? mainCat.subcategories.length
                  : 0;
                return (
                  <div
                    key={mainCat._id || mainCat.slug}
                    onClick={() => setSelectedMainCat(mainCat)}
                    className={`p-3 rounded-md border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? "bg-primary/10 border-primary text-primary font-semibold shadow-xs"
                        : "bg-background hover:bg-muted/50 border-border"
                    }`}
                  >
                    <div>
                      <span className="text-sm block">{mainCat.name}</span>
                      <span className="text-xs font-mono text-muted-foreground font-normal">
                        /{mainCat.slug}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-background text-muted-foreground font-mono">
                      {subCount} mapped
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Subcategories Checkbox Grid */}
          <div className="lg:col-span-7 border rounded-lg p-4 bg-card shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  2. Subcategories for:{" "}
                  <span className="text-primary font-bold">
                    {selectedMainCat?.name || "None"}
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Check or uncheck subcategories to include them in this Main
                  Category filter tab.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
              {subcategories.map((sub) => {
                const currentSubIds = (
                  selectedMainCat?.subcategories || []
                ).map((s: any) => (typeof s === "string" ? s : s._id));
                const isChecked = sub._id
                  ? currentSubIds.includes(sub._id)
                  : false;

                return (
                  <div
                    key={sub._id || sub.slug}
                    onClick={() => sub._id && handleToggleSubInMain(sub._id)}
                    className={`p-3 rounded-md border cursor-pointer transition flex items-center justify-between select-none ${
                      isChecked
                        ? "bg-primary/10 border-primary/60 text-foreground font-medium"
                        : "bg-background hover:bg-muted/40 border-border text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                          isChecked
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/40 bg-background"
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div>
                        <span className="text-xs font-semibold block">
                          {sub.name}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          /{sub.slug}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT MAIN CATEGORY */}
      <Dialog open={isMainModalOpen} onOpenChange={setIsMainModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMainCat ? "Edit Main Category" : "Add Main Category"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveMainCategory} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="mainName">Category Name</Label>
              <Input
                id="mainName"
                placeholder="e.g. Popular, Create & Transform"
                value={mainFormName}
                onChange={(e) => setMainFormName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mainSlug">Slug (URL friendly)</Label>
              <Input
                id="mainSlug"
                placeholder="e.g. popular (optional, auto-generated)"
                value={mainFormSlug}
                onChange={(e) => setMainFormSlug(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mainOrder">Display Order</Label>
              <Input
                id="mainOrder"
                type="number"
                value={mainFormOrder}
                onChange={(e) => setMainFormOrder(Number(e.target.value))}
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMainModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: ADD / EDIT SUBCATEGORY */}
      <Dialog open={isSubModalOpen} onOpenChange={setIsSubModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubcat ? "Edit Subcategory" : "Add Subcategory"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSubcategory} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="subName">Subcategory Name</Label>
              <Input
                id="subName"
                placeholder="e.g. Photo Experiences"
                value={subFormName}
                onChange={(e) => setSubFormName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subSlug">Slug</Label>
              <Input
                id="subSlug"
                placeholder="e.g. photo-experiences (optional)"
                value={subFormSlug}
                onChange={(e) => setSubFormSlug(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subOrder">Display Order</Label>
              <Input
                id="subOrder"
                type="number"
                value={subFormOrder}
                onChange={(e) => setSubFormOrder(Number(e.target.value))}
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSubModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Subcategory"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
