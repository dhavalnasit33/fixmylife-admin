"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedPage from "@/components/shared/ProtectedPage";
import PageHeader from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Pencil,
  Trash,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import apiService from "@/lib/apiService";
import DeleteRecipeDialog from "@/components/dashboard/discover-recipes/DeleteRecipeDialog";
import MultipleDeleteRecipeDialog from "@/components/dashboard/discover-recipes/MultipleDeleteRecipeDialog";
import RecipeForm from "@/components/dashboard/discover-recipes/RecipeForm";
import type { PaginatedResponse } from "@/types";
import { Switch } from "@/components/ui/switch";

const ITEMS_PER_PAGE = 5;

export default function DiscoverRecipesPage() {
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const canViewRecipes = hasPermission("viewRecipesCategoriesMenu");
  const canCreateRecipes = hasPermission("createRecipesCategoriesMenu");
  const canEditRecipes = hasPermission("editRecipesCategoriesMenu");
  const canDeleteRecipes = hasPermission("deleteRecipesCategoriesMenu");

  const [recipes, setRecipes] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedRecipeToDelete, setSelectedRecipeToDelete] = useState<
    any | null
  >(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);

  const [editingRecipe, setEditingRecipe] = useState<any | null>(null);

  const fetchRecipes = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { page: currentPage, limit: ITEMS_PER_PAGE };
      if (search) params.search = search;

      const response = await apiService<PaginatedResponse<any>>(
        "/discover-recipes",
        { params }
      );
      if (response.success) {
        setRecipes(response.data);
        setTotalPages(response.pagination.pages);
        setTotalItems(response.pagination.total);
        setSelectedRecipes([]);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch recipes",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error fetching recipes",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search, toast]);

  async function updateRecipeStatus(
    recipeId: string,
    isActive: boolean
  ): Promise<any> {
    const response = await apiService<any>(
      `/discover-recipes/${recipeId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: isActive }),
      }
    );

    if (!response.success) {
      throw new Error(response.message || "Failed to update recipe status");
    }

    return response;
  }

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const toggleSelectAll = () => {
    if (selectedRecipes.length === recipes.length) {
      setSelectedRecipes([]);
    } else {
      setSelectedRecipes(recipes.map((r) => r._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedRecipes((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  return (
    <ProtectedPage requiredPermission="viewRecipesCategoriesMenu">
      <PageHeader
        title="Recipes Categories"
        description="Manage all your Recipes Categories"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 items-start">
        {/* Left side - Recipe Form */}
        {(canCreateRecipes || editingRecipe) && (
          <div className="border rounded-md shadow-sm bg-white p-5">
            <h2 className="font-semibold text-lg mb-4">
              {editingRecipe ? "Edit Recipe" : "Add Recipe"}
            </h2>
            <RecipeForm
              initialData={editingRecipe}
              onSuccess={() => {
                fetchRecipes();
                setEditingRecipe(null);
              }}
              onCancelEdit={() => setEditingRecipe(null)}
            />
          </div>
        )}

        {/* Right side - Recipes Table */}
        <div>
          <div className="flex justify-between items-center">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search recipes..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 mb-1"
              />
            </div>

            {selectedRecipes.length > 0 && canDeleteRecipes && (
              <Button
                variant="destructive"
                onClick={() => setBulkDeleteDialogOpen(true)}
              >
                <Trash className="mr-2 h-4 w-4" /> Delete Selected
              </Button>
            )}
          </div>

          <div className="rounded-md border shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {canDeleteRecipes && (
                    <TableHead className="w-4">
                      <input
                        type="checkbox"
                        checked={selectedRecipes.length === recipes.length}
                        onChange={toggleSelectAll}
                      />
                    </TableHead>
                  )}
                  <TableHead>Name</TableHead>
                  <TableHead>Recipes Count</TableHead>
                  <TableHead>Status</TableHead>
                  {(canEditRecipes || canDeleteRecipes) && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      {canDeleteRecipes && (
                        <TableCell>
                          <Skeleton className="h-4 w-4" />
                        </TableCell>
                      )}
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      {(canEditRecipes || canDeleteRecipes) && (
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : recipes.length > 0 ? (
                  recipes.map((recipe) => (
                    <TableRow key={recipe._id}>
                      {canDeleteRecipes && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedRecipes.includes(recipe._id)}
                            onChange={() => toggleSelect(recipe._id)}
                          />
                        </TableCell>
                      )}
                      <TableCell>{recipe.title}</TableCell>
                      <TableCell>{recipe.collection_count ?? 0}</TableCell>
                      <TableCell>
                        <Switch
                          checked={recipe.is_active}
                          onCheckedChange={async (checked) => {
                            try {
                              await updateRecipeStatus(recipe._id, checked);
                              fetchRecipes(); 
                            } catch (error) {
                              console.error("Failed to update status", error);
                            }
                          }}
                        />
                      </TableCell>

                      {(canEditRecipes || canDeleteRecipes) && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canEditRecipes && (
                                <DropdownMenuItem
                                  onClick={() => setEditingRecipe(recipe)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                              )}
                              {canDeleteRecipes && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedRecipeToDelete(recipe);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                  <Trash className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      No recipes found.
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
                {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)}{" "}
                to {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of{" "}
                {totalItems} recipes
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages || isLoading}
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {canDeleteRecipes && (
        <>
          <DeleteRecipeDialog
            isOpen={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            recipe={selectedRecipeToDelete}
            onSuccess={fetchRecipes}
          />
          <MultipleDeleteRecipeDialog
            isOpen={bulkDeleteDialogOpen}
            onOpenChange={setBulkDeleteDialogOpen}
            recipes={recipes.filter((r) => selectedRecipes.includes(r._id))}
            onSuccess={fetchRecipes}
          />
        </>
      )}
    </ProtectedPage>
  );
}
