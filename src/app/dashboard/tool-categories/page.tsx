"use client";

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
import type { ToolCategory, PaginatedResponse, SingleResponse } from "@/types";
import MultipleDeleteToolCategoryDialog from "@/components/dashboard/tool-categories/MultipleDeleteToolCategoryDialog";
import { useRouter } from "next/navigation";

interface ExtendedToolCategory extends ToolCategory {
  parentCategory?: string | null;
  parentCategoryName?: string;
  level?: number;
  tool_count?: number;
}
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import DeleteToolCategoryDialog from "@/components/dashboard/tool-categories/DeleteToolCategoryDialog";
import { Skeleton } from "@/components/ui/skeleton";

const ITEMS_PER_PAGE = 10;

export default function ToolCategoriesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [categories, setCategories] = useState<ExtendedToolCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | null>(
    null
  );
  const [selectedCategorys, setSelectedCategorys] = useState<
    { id: String; name: String }[]
  >([]);
  const [
    isMultipleCategoryRemoveDialogOpen,
    setIsMultipleCategoryRemoveDialogOpen,
  ] = useState(false);

  const canManageToolCategories = hasPermission("viewToolCategoryMenu");
  const canCreateToolCategories = hasPermission("createNewToolCategory");
  const canEditToolCategories = hasPermission("editToolCategory");
  const canDeleteToolCategories = hasPermission("deleteToolCategory");
  const canManageStatusToolCategories = hasPermission("toolCategoryStatusChange");

  const fetchCategories = useCallback(
    async (page = 1, search = "") => {
      setIsLoading(true);
      try {
        const response = await apiService<PaginatedResponse<ToolCategory>>(
          "/tool-categories",
          {
            params: { page, limit: ITEMS_PER_PAGE, search },
          }
        );
        console.log("res", response);
        if (response.success) {
          const idToNameMap = new Map<string, string>();
          response.data.forEach((cat) => {
            idToNameMap.set(cat._id, cat.name);
          });

          const categoriesWithParentName = response.data.map((cat) => {
            let parentCategory = null;
            let parentCategoryName = "";

            if (cat.parent && typeof cat.parent === "object") {
              parentCategory = cat.parent._id;
              parentCategoryName = cat.parent.name;
            }

            return {
              ...cat,
              parentCategory,
              parentCategoryName,
            };
          });

          interface CategoryNode extends ExtendedToolCategory {
            children?: CategoryNode[];
          }

          const categoryMap = new Map<string, CategoryNode>();
          categoriesWithParentName.forEach((cat) => {
            categoryMap.set(cat._id, { ...cat, children: [] });
          });

          const roots: CategoryNode[] = [];
          categoryMap.forEach((cat) => {
            if (cat.parentCategory && categoryMap.has(cat.parentCategory)) {
              categoryMap.get(cat.parentCategory)!.children!.push(cat);
            } else {
              roots.push(cat);
            }
          });

          const orderedCategories: ExtendedToolCategory[] = [];
          function traverseWithLevel(node: CategoryNode, level = 0) {
            orderedCategories.push({ ...node, level });
            node.children?.forEach((child) =>
              traverseWithLevel(child, level + 1)
            );
          }
          roots.forEach((root) => traverseWithLevel(root));

          setCategories(orderedCategories);
          setCurrentPage(response.pagination.current);
          setTotalPages(response.pagination.pages);
          setTotalItems(response.pagination.total);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch tool categories.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (canManageToolCategories) {
      fetchCategories(currentPage, searchTerm);
    } else {
      setIsLoading(false);
      setCategories([]);
    }
  }, [currentPage, searchTerm, fetchCategories, canManageToolCategories]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleToggleActive = async (category: ToolCategory) => {
    if (!canManageToolCategories && !canManageStatusToolCategories) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to edit tool categories.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await apiService<SingleResponse<{ is_active: boolean }>>(
        `/tool-categories/${category._id}/toggle`,
        {
          method: "PATCH",
        }
      );
      if (response.success) {
        toast({
          title: "Success",
          description: `Category ${category.name} status updated.`,
        });
        setCategories((prev) =>
          prev.map((cat) =>
            cat._id === category._id
              ? { ...cat, is_active: response.data.is_active }
              : cat
          )
        );
      } else {
        toast({
          title: "Error",
          description: `Failed to update ${category.name} status.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (category: ToolCategory) => {
    if (!canManageToolCategories) return;

    const hasChildren = categories.some(
      (cat) => cat.parentCategory === category._id
    );

    if (hasChildren) {
      toast({
        title: "Cannot Delete Category",
        description:
          "This category has child categories. Please delete or reassign them first.",
        variant: "destructive",
      });
      return;
    }

    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const onCategoryDeleted = () => {
    fetchCategories(
      categories.length === 1 && currentPage > 1
        ? currentPage - 1
        : currentPage,
      searchTerm
    );
    setIsDeleteDialogOpen(false);
    setSelectedCategory(null);
  };

  const openMultipleCategoryRemoveDialog = () => {
    if (!canManageToolCategories) return;
    setIsMultipleCategoryRemoveDialogOpen(true);
  };

  const handleMultipleCategoryRemoveSuccess = () => {
    fetchCategories(
      categories.length === 1 && currentPage > 1
        ? currentPage - 1
        : currentPage,
      searchTerm
    );
    setIsMultipleCategoryRemoveDialogOpen(false);
    setSelectedCategorys([]);
  };

  const toggleSelectAll = () => {
    if (selectedCategorys.length == categories.length) {
      setSelectedCategorys([]);
    } else {
      setSelectedCategorys(
        categories.map((category) => ({
          id: category._id,
          name: category.name,
        }))
      );
    }
  };

  const toggleSelectOne = (id: String) => {
    const category = categories.find((category) => category._id === id);
    if (!category) return;

    const isSelected = selectedCategorys.some((c) => c.id === id);

    // If it's a child and its parent is selected, disallow unchecking
    if (category.parentCategory) {
      const parentSelected = selectedCategorys.some(
        (c) => c.id === category.parentCategory
      );
      if (parentSelected) {
        // Don't allow deselecting a child if parent is selected
        return;
      }
    }

    // Collect all descendants of this category (if it's a parent)
    const getDescendants = (
      parentId: string
    ): { id: string; name: string }[] => {
      const descendants: { id: string; name: string }[] = [];
      const collect = (parentId: string) => {
        categories.forEach((cat) => {
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
    const newSelectionSet = new Set(selectedCategorys.map((c) => c.id));

    if (isSelected) {
      // Deselect parent and all children
      newSelectionSet.delete(id as string);
      descendants.forEach((desc) => newSelectionSet.delete(desc.id));
    } else {
      // Select parent and all children
      newSelectionSet.add(id as string);
      descendants.forEach((desc) => newSelectionSet.add(desc.id));
    }

    const updatedSelection = Array.from(newSelectionSet).map((id) => {
      const cat = categories.find((c) => c._id === id)!;
      return { id: cat._id, name: cat.name };
    });

    setSelectedCategorys(updatedSelection);
  };

  return (
    <ProtectedPage requiredPermission="viewToolCategoryMenu">
      <PageHeader
        title="Tool Categories"
        description="Manage categories for AI tools."
        actionButtons={
          canManageToolCategories && (
            <Button
              onClick={() => router.push("/dashboard/tool-categories/create")}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Category
            </Button>
          )
        }
      />

      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-8"
          />
        </div>
        {
          canDeleteToolCategories && (

            <Button
              variant="destructive"

              onClick={openMultipleCategoryRemoveDialog}
              disabled={selectedCategorys.length <= 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Tool Categories
            </Button>
          )
        }
      </div>

      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {
                canDeleteToolCategories && (

                  <TableHead className="w-[40px]">
                    <input
                      type="checkbox"
                      checked={
                        selectedCategorys.length === categories.length &&
                        categories.length > 0
                      }
                      onChange={toggleSelectAll}
                      aria-label="Select all Tool Categories"
                    />
                  </TableHead>
                )
              }
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">
                Description
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                Category Type
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                Parent Category Type
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                Total Tools
              </TableHead>
              {
                canManageStatusToolCategories && (
                  <TableHead className="text-center">Active</TableHead>
                )
              }
              {canManageToolCategories && (canDeleteToolCategories || canEditToolCategories) && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>

                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-5 w-48" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-5 w-48" />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  {
                    canManageStatusToolCategories && (

                      <TableCell className="text-center">
                        <Skeleton className="h-5 w-10 mx-auto" />
                      </TableCell>
                    )
                  }
                  {canManageToolCategories && (canDeleteToolCategories || canEditToolCategories) && (
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : categories.length > 0 ? (
              categories.map((category) => {
                const isChecked = selectedCategorys.some(
                  (sCategory) => sCategory.id === category._id
                );
                return (
                  <TableRow key={category._id}>
                    {
                      canManageToolCategories && canDeleteToolCategories && (

                        <TableCell>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectOne(category._id)}
                            aria-label={`Select category ${category.name}`}
                            disabled={
                              !!category.parentCategory &&
                              selectedCategorys.some(
                                (c) => c.id === category.parentCategory
                              )
                            }
                          />
                        </TableCell>
                      )
                    }
                    <TableCell
                      className="font-medium"
                      style={{ paddingLeft: `${(category.level || 0) * 20}px` }}
                    >
                      <span className="text-blue-400 mr-2">
                        {Array.from({ length: category.level || 0 })
                          .map((_, i) => "↳")
                          .join("")}
                      </span>
                      {category.name}
                    </TableCell>

                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-xs">
                      {category.description}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {category?.category || "-"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {category.parentCategoryName
                        ? category.parentCategoryName
                        : "-"}
                    </TableCell>

                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-xs">
                      {category.tool_count || 0}
                    </TableCell>
                    {
                      canManageToolCategories && canManageStatusToolCategories && (

                        <TableCell className="text-center">
                          <Switch
                            checked={category.is_active}
                            onCheckedChange={() => handleToggleActive(category)}
                            aria-label={`Toggle ${category.name} status`}
                            disabled={!canManageToolCategories}
                          />
                        </TableCell>
                      )
                    }
                    {canManageToolCategories && (canDeleteToolCategories || canEditToolCategories) && (
                      <TableCell className="text-right">

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={!canManageToolCategories}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">
                                Actions for {category.name}
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {
                              canEditToolCategories && (

                                <DropdownMenuItem
                                  onClick={() =>
                                router.push(
                                  `/dashboard/tool-categories/${category._id}/edit`
                                )
                              }
                                  disabled={!canEditToolCategories}
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                              )
                            }
                            {
                              canDeleteToolCategories && (

                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(category)}
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                  disabled={!canDeleteToolCategories}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              )
                            }
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={canManageToolCategories ? 5 : 4}
                  className="text-center h-24"
                >
                  No tool categories found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems}{" "}
            categories
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {canManageToolCategories && selectedCategory && (
        <DeleteToolCategoryDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          category={selectedCategory}
          onSuccess={onCategoryDeleted}
        />
      )}

      {canManageToolCategories && selectedCategorys && (
        <MultipleDeleteToolCategoryDialog
          isOpen={isMultipleCategoryRemoveDialogOpen}
          onOpenChange={setIsMultipleCategoryRemoveDialogOpen}
          categories={selectedCategorys}
          onSuccess={handleMultipleCategoryRemoveSuccess}
        />
      )}
    </ProtectedPage>
  );
}
