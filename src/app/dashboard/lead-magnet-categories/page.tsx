"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/shared/PageHeader";
import ProtectedPage from "@/components/shared/ProtectedPage";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import type { LeadMagnetCategory, PaginatedResponse, SingleResponse } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import LeadMagnetCategoryDeleteDialog from "@/components/dashboard/lead-magnet-categories/LeadMagnetCategoryDeleteDialog";
import MultipleLeadMagnetCategoryDeleteDialog from "@/components/dashboard/lead-magnet-categories/MultipleLeadMagnetCategoryDeleteDialog";

const ITEMS_PER_PAGE = 10;

export default function LeadMagnetCategoriesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [categories, setCategories] = useState<LeadMagnetCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<LeadMagnetCategory | null>(null);
  const [selectedItems, setSelectedItems] = useState<{ id: string; name: string }[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  const canManage = hasPermission("viewLeadMagnetCategoriesMenu");
  const canCreate = hasPermission("createLeadMagnetCategories");
  const canEdit = hasPermission("editLeadMagnetCategories");
  const canDelete = hasPermission("deleteLeadMagnetCategories");
  const canManageStatus = hasPermission("leadMagnetCategoriesStatusChange");

  const fetchCategories = useCallback(
    async (page = 1, search = "") => {
      setIsLoading(true);
      try {
        const params: Record<string, any> = {
          page,
          limit: ITEMS_PER_PAGE,
          search: search,
        };

        const response = await apiService<PaginatedResponse<LeadMagnetCategory>>(
          "/lead-magnet-categories",
          { params }
        );

        if (response.success) {
          setCategories(response.data);
          if (response.pagination) {
            setCurrentPage(response.pagination.current);
            setTotalPages(response.pagination.pages);
            setTotalItems(response.pagination.total);
          }
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to fetch categories.",
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
    if (canManage) {
      const timer = setTimeout(() => {
        fetchCategories(currentPage, searchTerm);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, fetchCategories, canManage]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleToggleStatus = async (cat: LeadMagnetCategory) => {
    if (!canManageStatus) return;
    try {
      const response = await apiService<SingleResponse<{ is_active: boolean }>>(
        `/lead-magnet-categories/${cat._id}/toggle`,
        { method: "PATCH" },
      );
      if (response.success) {
        toast({ title: "Success", description: "Status updated successfully." });
        setCategories((prev) =>
          prev.map((item) =>
            item._id === cat._id ? { ...item, is_active: response.data.is_active } : item,
          ),
        );
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update status.",
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
    if (selectedItems.length === categories.length) setSelectedItems([]);
    else
      setSelectedItems(
        categories.map((item) => ({ id: item._id, name: item.name })),
      );
  };

  const toggleSelectOne = (id: string, name: string) => {
    const isSelected = selectedItems.some((i) => i.id === id);
    if (isSelected) setSelectedItems((prev) => prev.filter((i) => i.id !== id));
    else setSelectedItems((prev) => [...prev, { id, name }]);
  };

  const openDeleteDialog = (category: LeadMagnetCategory) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  return (
    <ProtectedPage requiredPermission="viewLeadMagnetCategoriesMenu">
      <PageHeader
        title="Lead Magnet Category Management"
        description="Manage categories for your lead magnets."
        actionButtons={
          canCreate && (
            <Button
              onClick={() => router.push("/dashboard/lead-magnet-categories/create")}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Category
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-8 w-full"
          />
        </div>

        {canDelete && (
          <Button
            variant="destructive"
            onClick={() => setIsBulkDeleteDialogOpen(true)}
            disabled={selectedItems.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
          </Button>
        )}
      </div>

      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {canDelete && (
                <TableHead className="w-[40px]">
                  <input
                    type="checkbox"
                    checked={
                      selectedItems.length === categories.length &&
                      categories.length > 0
                    }
                    onChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              {/* <TableHead className="w-[80px]">Icon</TableHead> */}
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {canDelete && <TableCell><Skeleton className="h-4 w-4" /></TableCell>}
                  {/* <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell> */}
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : categories.length > 0 ? (
              categories.map((cat) => (
                <TableRow key={cat._id}>
                  {canDelete && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedItems.some((i) => i.id === cat._id)}
                        onChange={() => toggleSelectOne(cat._id, cat.name)}
                      />
                    </TableCell>
                  )}
                  {/* <TableCell>
                    {cat.icon ? (
                      <div className="h-10 w-10 rounded-md overflow-hidden border">
                        <img src={cat.icon} alt={cat.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground italic">No Icon</span>
                      </div>
                    )}
                  </TableCell> */}
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{cat.slug}</TableCell>
                  <TableCell>{cat.display_order}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        checked={cat.is_active}
                        onCheckedChange={() => handleToggleStatus(cat)}
                        disabled={!canManageStatus}
                      />
                      {/* <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cat.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                          }`}
                      >
                        {cat.is_active ? "Active" : "Inactive"}
                      </span> */}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit && (
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/dashboard/lead-magnet-categories/${cat._id}/edit`)
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(cat)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={canDelete ? 6 : 5} className="text-center h-24">
                  No categories found.
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

      <LeadMagnetCategoryDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        category={selectedCategory}
        onSuccess={() => fetchCategories(currentPage, searchTerm)}
      />

      {canDelete && selectedItems.length > 0 && (
        <MultipleLeadMagnetCategoryDeleteDialog
          isOpen={isBulkDeleteDialogOpen}
          onOpenChange={setIsBulkDeleteDialogOpen}
          items={selectedItems}
          onSuccess={() => {
            fetchCategories(currentPage, searchTerm);
            setSelectedItems([]);
          }}
        />
      )}
    </ProtectedPage>
  );
}
