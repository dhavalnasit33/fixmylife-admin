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
import type { MarketingCategory, PaginatedResponse, SingleResponse } from "@/types";
import MultipleDeleteMarketingCategoryDialog from "@/components/dashboard/marketing-categories/MultipleDeleteMarketingCategoryDialog";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import DeleteMarketingCategoryDialog from "@/components/dashboard/marketing-categories/DeleteMarketingCategoryDialog";
import { Skeleton } from "@/components/ui/skeleton";

const ITEMS_PER_PAGE = 10;

interface ExtendedMarketingCategory extends MarketingCategory {
  parentCategory?: string | null;
  parentCategoryName?: string;
  level?: number;
  tool_count?: number;
}

export default function MarketingCategoriesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [categories, setCategories] = useState<ExtendedMarketingCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MarketingCategory | null>(null);
  const [selectedCategorys, setSelectedCategorys] = useState<{ id: string; name: string }[]>([]);
  const [isMultipleCategoryRemoveDialogOpen, setIsMultipleCategoryRemoveDialogOpen] = useState(false);

  const canManageCategories = hasPermission("viewMarketingCategoryMenu");
  const canCreateCategories = hasPermission("createNewMarketingCategory");
  const canEditCategories = hasPermission("editMarketingCategory");
  const canDeleteCategories = hasPermission("deleteMarketingCategory");
  const canManageStatusCategories = hasPermission("marketingCategoryStatusChange");

  const fetchCategories = useCallback(async (page = 1, search = "") => {
    setIsLoading(true);
    try {
      const response = await apiService<PaginatedResponse<MarketingCategory>>(
        "/marketing-categories",
        { params: { page, limit: ITEMS_PER_PAGE, search } }
      );

      if (response.success) {
        const categoriesWithParentName = response.data.map(cat => {
          let parentCategory = null;
          let parentCategoryName = "";
          if (cat.parent && typeof cat.parent === "object") {
            parentCategory = cat.parent._id;
            parentCategoryName = cat.parent.name;
          }
          return { ...cat, parentCategory, parentCategoryName };
        });

        interface CategoryNode extends ExtendedMarketingCategory {
          children?: CategoryNode[];
        }

        const categoryMap = new Map<string, CategoryNode>();
        categoriesWithParentName.forEach(cat => categoryMap.set(cat._id, { ...cat, children: [] }));

        const roots: CategoryNode[] = [];
        categoryMap.forEach(cat => {
          if (cat.parentCategory && categoryMap.has(cat.parentCategory)) {
            categoryMap.get(cat.parentCategory)!.children!.push(cat);
          } else {
            roots.push(cat);
          }
        });

        const orderedCategories: ExtendedMarketingCategory[] = [];
        function traverseWithLevel(node: CategoryNode, level = 0) {
          orderedCategories.push({ ...node, level });
          node.children?.forEach(child => traverseWithLevel(child, level + 1));
        }
        roots.forEach(root => traverseWithLevel(root));

        setCategories(orderedCategories);
        setCurrentPage(response.pagination.current);
        setTotalPages(response.pagination.pages);
        setTotalItems(response.pagination.total);
      } else {
        toast({ title: "Error", description: "Failed to fetch marketing categories.", variant: "destructive" });
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

  const handleToggleActive = async (category: MarketingCategory) => {
    if (!canManageCategories && !canManageStatusCategories) {
      toast({ title: "Permission Denied", description: "You do not have permission to edit marketing categories.", variant: "destructive" });
      return;
    }
    try {
      const response = await apiService<SingleResponse<{ is_active: boolean }>>(
        `/marketing-categories/${category._id}/toggle`,
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
    const hasChildren = categories.some(c => c.parentCategory === category._id);
    if (hasChildren) return toast({ title: 'Cannot Delete', description: 'Category has children.', variant: 'destructive' });

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
    if (selectedCategorys.length == categories.length) setSelectedCategorys([]);
    else setSelectedCategorys(categories.map(cat => ({ id: cat._id, name: cat.name })));
  };

  const toggleSelectOne = (id: string) => {
    const category = categories.find(cat => cat._id === id);
    if (!category) return;
    const isSelected = selectedCategorys.some(c => c.id === id);

    // Check parent
    if (category.parentCategory && selectedCategorys.some(c => c.id === category.parentCategory)) return;

    const getDescendants = (parentId: string): { id: string; name: string }[] => {
      const descendants: { id: string; name: string }[] = [];
      const collect = (parentId: string) => {
        categories.forEach(cat => {
          if (cat.parentCategory === parentId) {
            descendants.push({ id: cat._id, name: cat.name });
            collect(cat._id);
          }
        });
      };
      collect(parentId);
      return descendants;
    };

    const descendants = getDescendants(category._id);
    const newSelectionSet = new Set(selectedCategorys.map(c => c.id));

    if (isSelected) {
      newSelectionSet.delete(id);
      descendants.forEach(d => newSelectionSet.delete(d.id));
    } else {
      newSelectionSet.add(id);
      descendants.forEach(d => newSelectionSet.add(d.id));
    }

    setSelectedCategorys(Array.from(newSelectionSet).map(id => {
      const cat = categories.find(c => c._id === id)!;
      return { id: cat._id, name: cat.name };
    }));
  };

  return (
    <ProtectedPage requiredPermission="viewMarketingCategoryMenu">
      <PageHeader
        title="Marketing Categories"
        description="Manage marketing categories."
        actionButtons={
          canManageCategories && (
            <Button onClick={() => router.push("/dashboard/marketing-categories/create")}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Marketing Category
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
            Delete Marketing Categories
          </Button>
        )}
      </div>

      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {canDeleteCategories && (
                <TableHead className="w-[40px]">
                  <input type="checkbox" checked={selectedCategorys.length === categories.length && categories.length > 0} onChange={toggleSelectAll} aria-label="Select all Marketing Categories" />
                </TableHead>
              )}
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead className="hidden sm:table-cell">Category Type</TableHead>
              <TableHead className="hidden sm:table-cell">Parent Category</TableHead>
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
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
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
                        <input type="checkbox" checked={isChecked} onChange={() => toggleSelectOne(category._id)} disabled={!!category.parentCategory && selectedCategorys.some(c => c.id === category.parentCategory)} aria-label={`Select category ${category.name}`} />
                      </TableCell>
                    )}
                    <TableCell className="font-medium" style={{ paddingLeft: `${(category.level || 0) * 20}px` }}>
                      {Array.from({ length: category.level || 0 }).map((_, i) => "↳").join("")}
                      {category.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-xs">{category.description}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{category.category || "-"}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{category.parentCategoryName || "-"}</TableCell>
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
                            {canEditCategories && <DropdownMenuItem onClick={() => router.push(`/dashboard/marketing-categories/${category._id}/edit`)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>}
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
                <TableCell colSpan={canEditCategories || canDeleteCategories ? 6 : 5} className="text-center h-24">
                  No marketing categories found.
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
        <DeleteMarketingCategoryDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} category={selectedCategory} onSuccess={onCategoryDeleted} />
      )}

      {canManageCategories && selectedCategorys && (
        <MultipleDeleteMarketingCategoryDialog isOpen={isMultipleCategoryRemoveDialogOpen} onOpenChange={setIsMultipleCategoryRemoveDialogOpen} categories={selectedCategorys} onSuccess={handleMultipleCategoryRemoveSuccess} />
      )}
    </ProtectedPage>
  );
}
