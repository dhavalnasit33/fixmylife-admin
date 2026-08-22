"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/shared/PageHeader";
import ProtectedPage from "@/components/shared/ProtectedPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Pencil,
  MoreHorizontal,
} from "lucide-react";
import apiService from "@/lib/apiService";
import type { NewsCategory, PaginatedResponse, SingleResponse } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

import CreateNewsCategoryDialog from "@/components/dashboard/news-categories/CreateNewsCategoryDialog";
import EditNewsCategoryDialog from "@/components/dashboard/news-categories/EditNewsCategoryDialog";
import DeleteNewsCategoryDialog from "@/components/dashboard/news-categories/DeleteNewsCategoryDialog";
import MultiDeleteNewsCategoryDialog from "@/components/dashboard/news-categories/MultiDeleteNewsCategoryDialog";
import CategoryRow from "@/components/dashboard/news-categories/CategoryRow";

const ITEMS_PER_PAGE = 10;

export default function NewsCategoriesPage() {
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const [categoryList, setCategoryList] = useState<NewsCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | null>(
    null
  );
  const [selectedMultiple, setSelectedMultiple] = useState<NewsCategory[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMultipleDeleteDialogOpen, setIsMultipleDeleteDialogOpen] =
    useState(false);

  const canViewNewscategories = hasPermission('viewNewsCategoryMenu');
  const canCreateNewscategories = hasPermission('createNewsCategoryMenu');
  const canEditNewscategories = hasPermission('editNewsCategoryMenu');
  const canDeleteNewscategories = hasPermission('deleteNewsCategoryMenu');
  const canUpdateNewsCategories = hasPermission('newsCategoryMenuStatusChange');

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiService<PaginatedResponse<NewsCategory>>(
        "/news-categories",
        {
          params: {
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            search: searchTerm,
          },
        }
      );
      if (response.success) {
        setCategoryList(response.data);
        setTotalItems(response.pagination.total);
        setTotalPages(response.pagination.pages);
        setCurrentPage(response.pagination.current);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch categories.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const toggleSelectOne = (cat: NewsCategory) => {
    setSelectedMultiple((prev) =>
      prev.some((c) => c._id === cat._id)
        ? prev.filter((c) => c._id !== cat._id)
        : [...prev, cat]
    );
  };

  const handleToggleActive = async (category: NewsCategory) => {
    try {
      const response = await apiService<SingleResponse<{ is_active: boolean }>>(
        `/news-categories/${category._id}/toggle`,
        {
          method: "PATCH",
        }
      );
      if (response.success) {
        toast({
          title: "Success",
          description: `Category ${category.name} status updated.`,
        });
        setCategoryList((prev) =>
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

  const toggleSelectAll = () => {
    if (selectedMultiple.length === categoryList.length) {
      setSelectedMultiple([]);
    } else {
      setSelectedMultiple(categoryList);
    }
  };

  const handleDeleteSuccess = () => {
    fetchCategories();
    setSelectedCategory(null);
    setIsDeleteDialogOpen(false);
  };

  const handleMultipleDeleteSuccess = () => {
    fetchCategories();
    setSelectedMultiple([]);
    setIsMultipleDeleteDialogOpen(false);
  };

  return (
    <ProtectedPage requiredPermission="viewNewsCategoryMenu">
      <PageHeader
        title="News Categories"
        description="Manage news categories"
        actionButtons={
          <div className="flex gap-2">
            {selectedMultiple.length > 0 && canDeleteNewscategories && (
              <Button
                variant="destructive"
                onClick={() => setIsMultipleDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
              </Button>
            )}
            {
              canCreateNewscategories && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Category
                </Button>
              )
            }
          </div>
        }
      />

      <div className="my-4 max-w-md">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search categories"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8 w-full"
          />
        </div>
      </div>

      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {
                canDeleteNewscategories && <TableHead>
                  <input
                    type="checkbox"
                    checked={selectedMultiple.length === categoryList.length}
                    onChange={toggleSelectAll}
                  />
                </TableHead>
              }
              <TableHead>Name</TableHead>
              <TableHead className="">
                Description
              </TableHead>
              <TableHead className="">Parent</TableHead>
              <TableHead className="">Total News</TableHead>
               {canUpdateNewsCategories && <TableHead className="text-center">Status</TableHead>}
              {(canEditNewscategories || canDeleteNewscategories) && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: ITEMS_PER_PAGE }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`}>
                  {/* {Array(7).fill(null).map((_, i) => (
                    <TableCell key={i}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))} */}
                  {
                    canDeleteNewscategories && <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                  }
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-64" />
                  </TableCell>
                  {
                    canUpdateNewsCategories && <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  }
                  {
                    (canEditNewscategories || canDeleteNewscategories) &&
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  }
                </TableRow>
              ))
            ) : categoryList.length > 0 ? (
              categoryList
                .filter((cat) => !cat.is_child)
                .map((cat) => (
                  <CategoryRow
                    key={cat._id}
                    category={cat}
                    selectedMultiple={selectedMultiple}
                    toggleSelectOne={toggleSelectOne}
                    handleToggleActive={handleToggleActive}
                    setSelectedCategory={setSelectedCategory}
                    setIsEditDialogOpen={setIsEditDialogOpen}
                    setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                  />
                ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-4 text-muted-foreground"
                >
                  No news categories found.
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
            {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {
        canCreateNewscategories && (
          <CreateNewsCategoryDialog
            isOpen={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onSuccess={fetchCategories}
          />
        )
      }

      {selectedCategory && (
        <>
          {
            canEditNewscategories &&
            <EditNewsCategoryDialog
              isOpen={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
              category={selectedCategory}
              onSuccess={fetchCategories}
            />
          }
          {
            canDeleteNewscategories &&
            <DeleteNewsCategoryDialog
              isOpen={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
              id={selectedCategory._id}
              onSuccess={handleDeleteSuccess}
            />
          }
        </>
      )}

      {selectedMultiple.length > 0 && canDeleteNewscategories && (
        <MultiDeleteNewsCategoryDialog
          isOpen={isMultipleDeleteDialogOpen}
          onOpenChange={setIsMultipleDeleteDialogOpen}
          ids={selectedMultiple.map((c) => c._id)}
          onSuccess={handleMultipleDeleteSuccess}
        />
      )}
    </ProtectedPage>
  );
}
