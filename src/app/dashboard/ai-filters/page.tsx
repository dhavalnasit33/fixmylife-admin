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
import type { PaginatedResponse, SingleResponse } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

// Import Dialogs
import CreateAIFilterDialog from "@/components/dashboard/ai-filters/CreateAIFilterDialog";
import EditAIFilterDialog from "@/components/dashboard/ai-filters/EditAIFilterDialog";
import DeleteAIFilterDialog from "@/components/dashboard/ai-filters/DeleteAIFilterDialog";
import MultipleDeleteAIFilterDialog from "@/components/dashboard/ai-filters/MultipleDeleteAIFilterDialog";
import { AIFilter } from "@/types";

const ITEMS_PER_PAGE = 10;

export default function AIFiltersPage() {
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  // State
  const [filters, setFilters] = useState<AIFilter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Selection for bulk delete
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Dialog States
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  // Selected item for Edit/Delete
  const [targetFilter, setTargetFilter] = useState<AIFilter | null>(null);

  // Use newly added AI Filter permissions
  const canManageFilters = hasPermission("viewAiFilterMenu");
  const canCreateFilters = hasPermission("createAiFilterMenu"); 
  const canEditFilters = hasPermission("editAiFilterMenu"); 
  const canDeleteFilters = hasPermission("deleteAiFilterMenu"); 
  const canManageStatusFilters = hasPermission("aiFilterMenuStatusChange");

  const fetchFilters = useCallback(
    async (page = 1, search = "") => {
      setIsLoading(true);
      try {
        const params: Record<string, any> = { page, limit: ITEMS_PER_PAGE, search };
        const response = await apiService<PaginatedResponse<AIFilter>>(
          "/ai-filters",
          { params }
        );

        if (response.success) {
          setFilters(response.data);
          setCurrentPage(response.pagination.current);
          setTotalPages(response.pagination.pages);
          setTotalItems(response.pagination.total);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch AI filters.",
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
    if (canManageFilters) fetchFilters(currentPage, searchTerm);
    else {
      setIsLoading(false);
      setFilters([]);
    }
  }, [currentPage, searchTerm, fetchFilters, canManageFilters]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleToggleActive = async (filter: AIFilter) => {
    if (!canManageStatusFilters) return;
    try {
      const response = await apiService<SingleResponse<{ is_active: boolean }>>(
        `/ai-filters/${filter._id}/toggle`,
        { method: "PATCH" }
      );
      if (response.success) {
        toast({
          title: "Success",
          description: `Filter ${filter.name} updated.`,
        });
        setFilters((prev) =>
          prev.map((f) =>
            f._id === filter._id
              ? { ...f, is_active: response.data.is_active }
              : f
          )
        );
      } else {
        toast({
          title: "Error",
          description: "Failed to update status.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Dialog Handlers
  const openEditDialog = (filter: AIFilter) => {
    setTargetFilter(filter);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (filter: AIFilter) => {
    setTargetFilter(filter);
    setIsDeleteDialogOpen(true);
  };

  // Bulk Selection Logic
  const toggleSelectAll = () => {
    if (selectedFilters.length === filters.length) setSelectedFilters([]);
    else setSelectedFilters(filters.map((f) => f._id));
  };

  const toggleSelectOne = (id: string) => {
    const isSelected = selectedFilters.includes(id);
    if (isSelected)
      setSelectedFilters((prev) => prev.filter((fId) => fId !== id));
    else setSelectedFilters((prev) => [...prev, id]);
  };

  const refreshData = () => {
    fetchFilters(
      filters.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage,
      searchTerm
    );
    setSelectedFilters([]);
  };

  return (
    <ProtectedPage requiredPermission="viewAiFilterMenu">
      <PageHeader
        title="AI Filters"
        description="Manage AI filters."
        actionButtons={
          canCreateFilters && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Filter
            </Button>
          )
        }
      />
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search filters..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-8"
            />
          </div>
        </div>
        {canDeleteFilters && (
          <Button
            variant="destructive"
            onClick={() => setIsBulkDeleteDialogOpen(true)}
            disabled={selectedFilters.length <= 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
        )}
      </div>
      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {canDeleteFilters && (
                <TableHead className="w-[40px]">
                  <input
                    type="checkbox"
                    checked={
                      selectedFilters.length === filters.length &&
                      filters.length > 0
                    }
                    onChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-center">Strength</TableHead>
              <TableHead className="text-center">Active</TableHead>
              {(canEditFilters || canDeleteFilters) && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {canDeleteFilters && (
                    <TableCell>
                      <Skeleton className="h-5 w-5" />
                    </TableCell>
                  )}
                  <TableCell>
                    <Skeleton className="h-10 w-10" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-12 mx-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-10 mx-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : filters.length > 0 ? (
              filters.map((filter) => (
                <TableRow key={filter._id}>
                  {canDeleteFilters && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedFilters.includes(filter._id)}
                        onChange={() => toggleSelectOne(filter._id)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    {filter.image ? (
                      <img
                        src={filter.image}
                        alt={filter.name}
                        className="h-10 w-10 object-cover rounded-md"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500">
                        N/A
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{filter.name}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-mono text-sm bg-primary/10 text-primary px-2.5 py-1 rounded-md font-semibold border border-primary/20">
                      {filter.strength !== undefined ? filter.strength.toFixed(2) : "0.85"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={filter.is_active}
                      onCheckedChange={() => handleToggleActive(filter)}
                      disabled={!canManageStatusFilters}
                    />
                  </TableCell>

                  {(canEditFilters || canDeleteFilters) && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEditFilters && (
                            <DropdownMenuItem
                              onClick={() => openEditDialog(filter)}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                          )}
                          {canDeleteFilters && (
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(filter)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
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
                <TableCell colSpan={6} className="text-center h-24">
                  No filters found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      {totalItems > ITEMS_PER_PAGE && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems}{" "}
            filters
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages || isLoading}
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      {/* Dialogs */}
      <CreateAIFilterDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={refreshData}
      />
      <EditAIFilterDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        filterId={targetFilter?._id || null}
        onSuccess={refreshData}
      />
      <DeleteAIFilterDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        filterId={targetFilter?._id || null}
        filterName={targetFilter?.name || ""}
        onSuccess={refreshData}
      />
      <MultipleDeleteAIFilterDialog
        isOpen={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
        selectedIds={selectedFilters}
        onSuccess={refreshData}
      />
    </ProtectedPage>
  );
}
