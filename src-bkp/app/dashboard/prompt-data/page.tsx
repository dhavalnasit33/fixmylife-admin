"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/shared/PageHeader";
import ProtectedPage from "@/components/shared/ProtectedPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import type { PaginatedResponse, PromptData, SingleResponse } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import DeletePromptDataDialog from "@/components/dashboard/prompt-data/DeletePromptDataDialog";
import MultipleDeletePromptDataDialog from "@/components/dashboard/prompt-data/MultipleDeletePromptDataDialog";
import { Switch } from "@/components/ui/switch";

const ITEMS_PER_PAGE = 10;

export default function PromptDataPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const [data, setData] = useState<PromptData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PromptData | null>(null);
  const [selectedItems, setSelectedItems] = useState<
    { id: string; name: string }[]
  >([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  const canManage = hasPermission("viewPromptDataMenu");
  const canCreate = hasPermission("createPromptData");
  const canEdit = hasPermission("editPromptData");
  const canDelete = hasPermission("deletePromptData");
  const canManageStatus = hasPermission("promptDataStatusChange");

  const fetchData = useCallback(
    async (page = 1, search = "") => {
      setIsLoading(true);
      try {
        const response = await apiService<PaginatedResponse<PromptData>>(
          "/prompt-data",
          { params: { page, limit: ITEMS_PER_PAGE, search } }
        );
        if (response.success) {
          setData(response.data);
          setCurrentPage(response.pagination.current);
          setTotalPages(response.pagination.pages);
          setTotalItems(response.pagination.total);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to fetch data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (canManage) fetchData(currentPage, searchTerm);
    else setIsLoading(false);
  }, [currentPage, searchTerm, fetchData, canManage]);

  const toggleSelectAll = () => {
    if (selectedItems.length === data.length) setSelectedItems([]);
    else
      setSelectedItems(data.map((item) => ({ id: item._id, name: item.name })));
  };

  const toggleSelectOne = (id: string, name: string) => {
    const isSelected = selectedItems.some((i) => i.id === id);
    if (isSelected) setSelectedItems((prev) => prev.filter((i) => i.id !== id));
    else setSelectedItems((prev) => [...prev, { id, name }]);
  };

  const handleToggleActive = async (prompt: PromptData) => {
    if (!canManage && !canManageStatus) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to edit prompt status.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await apiService<SingleResponse<{ is_active: boolean }>>(
        `/prompt-data/${prompt._id}/toggle`,
        { method: "PATCH" }
      );
      if (response.success) {
        toast({
          title: "Success",
          description: `Prompt ${prompt.name} status updated.`,
        });
        setData((prev) =>
          prev.map((item) =>
            item._id === prompt._id
              ? { ...item, is_active: response.data.is_active }
              : item
          )
        );
      } else {
        toast({
          title: "Error",
          description: `Failed to update ${prompt.name} status.`,
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

  return (
    <ProtectedPage requiredPermission="viewPromptDataMenu">
      <PageHeader
        title="Prompt Data"
        description="Manage your prompts content."
        actionButtons={
          canCreate && (
            <Button
              onClick={() => router.push("/dashboard/prompt-data/create")}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Create New
            </Button>
          )
        }
      />
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search prompts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
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
                      selectedItems.length === data.length && data.length > 0
                    }
                    onChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              {/* <TableHead>Image</TableHead> */}
              <TableHead>Name</TableHead>
              {/* <TableHead>Categories</TableHead> */}
              <TableHead className="hidden md:table-cell">
                Short Description
              </TableHead>
              <TableHead className="text-center">Active</TableHead>
              {(canEdit || canDelete) && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : data.length > 0 ? (
              data.map((item) => (
                <TableRow key={item._id}>
                  {canDelete && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedItems.some((i) => i.id === item._id)}
                        onChange={() => toggleSelectOne(item._id, item.name)}
                      />
                    </TableCell>
                  )}
                  {/* <TableCell>
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                  </TableCell> */}
                  <TableCell className="font-medium">{item.name}</TableCell>
                  {/* <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.category.map((cat: any) => (
                        <Badge
                          key={cat._id || cat}
                          variant="secondary"
                          className="text-xs"
                        >
                          {cat.name || "Unknown"}
                        </Badge>
                      ))}
                    </div>
                  </TableCell> */}
                  <TableCell className="hidden md:table-cell max-w-xs truncate text-muted-foreground">
                    {item.short_description}
                  </TableCell>
                  {canManageStatus && (
                    <TableCell className="text-center">
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={() => handleToggleActive(item)}
                        aria-label={`Toggle ${item.name} status`}
                        disabled={!canManage}
                      />
                    </TableCell>
                  )}
                  {(canEdit || canDelete) && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEdit && (
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/dashboard/prompt-data/${item._id}/edit`
                                )
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedItem(item);
                                setIsDeleteDialogOpen(true);
                              }}
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
                  No prompts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)}{" "}
          to {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of{" "}
          {totalItems} prompts
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages || isLoading}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Pagination controls here (same as previous pages) */}
      {canDelete && selectedItem && (
        <DeletePromptDataDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          prompt={selectedItem as any} // Change from 'category' to 'prompt'
          onSuccess={() => fetchData(currentPage)}
        />
      )}
      {canDelete && selectedItems.length > 0 && (
        <MultipleDeletePromptDataDialog
          isOpen={isBulkDeleteDialogOpen}
          onOpenChange={setIsBulkDeleteDialogOpen}
          prompts={selectedItems} // Change from 'categories' to 'prompts'
          onSuccess={() => {
            fetchData(currentPage);
            setSelectedItems([]);
          }}
        />
      )}
    </ProtectedPage>
  );
}
