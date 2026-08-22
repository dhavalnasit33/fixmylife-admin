'use client';

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/shared/PageHeader";
import ProtectedPage from "@/components/shared/ProtectedPage";
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
  PlusCircle,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import apiService from "@/lib/apiService";
import type { PaginatedResponse, SingleResponse } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import DeleteHomeToolCategoryDialog from "@/components/dashboard/home-tool-categories/DeleteHomeToolCategoryDialog";
import MultipleDeleteHomeToolCategoryDialog from "@/components/dashboard/home-tool-categories/MultipleDeleteHomeToolCategoryDialog";

const ITEMS_PER_PAGE = 10;

export interface HomeToolCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ExtendedHomeToolCategory extends HomeToolCategory {
  level?: number;
}

export default function HomeToolCategoriesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const [categories, setCategories] = useState<ExtendedHomeToolCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<HomeToolCategory | null>(null);
  const [selectedCategorys, setSelectedCategorys] = useState<{ id: string; name: string }[]>([]);
  const [isMultipleCategoryRemoveDialogOpen, setIsMultipleCategoryRemoveDialogOpen] = useState(false);

  const canManageCategories = hasPermission("viewHomeToolCategoriesMenu");
  const canCreateCategories = hasPermission("createHomeToolCategory");
  const canEditCategories = hasPermission("editHomeToolCategory");
  const canDeleteCategories = hasPermission("deleteHomeToolCategory");
  const canManageStatusCategories = hasPermission("homeToolCategoryStatusChange");

  const fetchCategories = useCallback(async (page = 1, search = "") => {
    setIsLoading(true);
    try {
      const response = await apiService<PaginatedResponse<HomeToolCategory>>(
        "/home-tool-categories",
        { params: { page, limit: ITEMS_PER_PAGE, search } }
      );

      if (response.success) {
        setCategories(response.data);
        setCurrentPage(response.pagination.current);
        setTotalPages(response.pagination.pages);
        setTotalItems(response.pagination.total);
      } else {
        toast({ title: "Error", description: "Failed to fetch categories.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (canManageCategories) fetchCategories(currentPage, searchTerm);
    else { setIsLoading(false); setCategories([]); }
  }, [currentPage, searchTerm, fetchCategories, canManageCategories]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleToggleActive = async (category: HomeToolCategory) => {
    if (!canManageCategories && !canManageStatusCategories) {
      toast({ title: "Permission Denied", description: "You do not have permission to edit categories.", variant: "destructive" });
      return;
    }
    try {
      const response = await apiService<SingleResponse<{ is_active: boolean }>>(
        `/home-tool-categories/${category._id}/toggle`,
        { method: "PATCH" }
      );
      if (response.success) {
        toast({ title: "Success", description: `Category ${category.name} status updated.` });
        setCategories(prev => prev.map(cat => cat._id === category._id ? { ...cat, is_active: response.data.is_active } : cat));
      } else {
        toast({ title: "Error", description: `Failed to update ${category.name} status.`, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    }
  };

  const openDeleteDialog = (categoryId: string) => {
    const category = categories.find(c => c._id === categoryId) || null;
    if (!category) return;
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const onCategoryDeleted = () => {
    fetchCategories(categories.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage, searchTerm);
    setIsDeleteDialogOpen(false);
    setSelectedCategory(null);
  };

  const openMultipleCategoryRemoveDialog = () => {
    if (!canManageCategories) return;
    setIsMultipleCategoryRemoveDialogOpen(true);
  };

  const handleMultipleCategoryRemoveSuccess = () => {
    fetchCategories(categories.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage, searchTerm);
    setIsMultipleCategoryRemoveDialogOpen(false);
    setSelectedCategorys([]);
  };

  const toggleSelectAll = () => {
    if (selectedCategorys.length === categories.length) setSelectedCategorys([]);
    else setSelectedCategorys(categories.map(cat => ({ id: cat._id, name: cat.name })));
  };

  const toggleSelectOne = (id: string) => {
    const isSelected = selectedCategorys.some(c => c.id === id);
    if (isSelected) setSelectedCategorys(prev => prev.filter(c => c.id !== id));
    else setSelectedCategorys(prev => [...prev, { id, name: categories.find(c => c._id === id)?.name || "" }]);
  };

  return (
    <ProtectedPage requiredPermission="viewHomeToolCategoriesMenu">
      <PageHeader
        title="Home Tool Categories"
        description="Manage home tool categories."
        actionButtons={
          canCreateCategories && (
            <Button onClick={() => router.push("/dashboard/home-tool-categories/create")}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Home Tool Category
            </Button>
          )
        }
      />

      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search categories..." value={searchTerm} onChange={handleSearchChange} className="pl-8" />
        </div>
        {canDeleteCategories && (
          <Button variant="destructive" onClick={openMultipleCategoryRemoveDialog} disabled={selectedCategorys.length <= 0}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Categories
          </Button>
        )}
      </div>

      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {canDeleteCategories && (
                <TableHead className="w-[40px]">
                  <input type="checkbox" checked={selectedCategorys.length === categories.length && categories.length > 0} onChange={toggleSelectAll} aria-label="Select all categories" />
                </TableHead>
              )}
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              {canManageStatusCategories && <TableHead className="text-center">Active</TableHead>}
              {(canEditCategories || canDeleteCategories) && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                  {canManageStatusCategories && <TableCell className="text-center"><Skeleton className="h-5 w-10 mx-auto" /></TableCell>}
                  {(canEditCategories || canDeleteCategories) && <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>}
                </TableRow>
              ))
            ) : categories.length > 0 ? (
              categories.map(category => {
                const isChecked = selectedCategorys.some(c => c.id === category._id);
                return (
                  <TableRow key={category._id}>
                    {canDeleteCategories && (
                      <TableCell>
                        <input type="checkbox" checked={isChecked} onChange={() => toggleSelectOne(category._id)} aria-label={`Select category ${category.name}`} />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-xs">{category.description}</TableCell>
                    {canManageStatusCategories && (
                      <TableCell className="text-center">
                        <Switch checked={category.is_active} onCheckedChange={() => handleToggleActive(category)} aria-label={`Toggle ${category.name} status`} disabled={!canManageCategories} />
                      </TableCell>
                    )}
                    {(canEditCategories || canDeleteCategories) && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={!canManageCategories}>
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions for {category.name}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEditCategories && <DropdownMenuItem onClick={() => router.push(`/dashboard/home-tool-categories/${category._id}/edit`)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>}
                            {canDeleteCategories && <DropdownMenuItem onClick={() => openDeleteDialog(category._id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={canEditCategories || canDeleteCategories ? 4 : 3} className="text-center h-24">
                  No categories found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)} to {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} categories
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1 || isLoading}><ChevronLeft className="h-4 w-4 mr-1" /> Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || isLoading}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
          </div>
        </div>
      )}

      {canManageCategories && selectedCategory && (
        <DeleteHomeToolCategoryDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} category={selectedCategory} onSuccess={onCategoryDeleted} />
      )}

      {canManageCategories && selectedCategorys && (
        <MultipleDeleteHomeToolCategoryDialog isOpen={isMultipleCategoryRemoveDialogOpen} onOpenChange={setIsMultipleCategoryRemoveDialogOpen} categories={selectedCategorys} onSuccess={handleMultipleCategoryRemoveSuccess} />
      )}
    </ProtectedPage>
  );
}
