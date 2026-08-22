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
  ImageOff,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import apiService from "@/lib/apiService";
import type { PaginatedResponse, SingleResponse, AlternativeTool } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Import Dialogs
import CreateAlternativeToolDialog from "@/components/dashboard/alternative-tools/CreateAlternativeToolDialog";
import EditAlternativeToolDialog from "@/components/dashboard/alternative-tools/EditAlternativeToolDialog";
import DeleteAlternativeToolDialog from "@/components/dashboard/alternative-tools/DeleteAlternativeToolDialog";
import MultipleDeleteAlternativeToolDialog from "@/components/dashboard/alternative-tools/MultipleDeleteAlternativeToolDialog";

const ITEMS_PER_PAGE = 10;

export default function AlternativeToolsPage() {
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  // State
  const [tools, setTools] = useState<AlternativeTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Selection for bulk delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialog States
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  // Selected item for Edit/Delete
  const [targetTool, setTargetTool] = useState<AlternativeTool | null>(null);

  const canManageAlternativeTools = hasPermission("viewAlternativeToolsMenu");
  const canCreateAlternativeTools = hasPermission("createAlternativeTools");
  const canEditAlternativeTools = hasPermission("editAlternativeTools");
  const canDeleteAlternativeTools = hasPermission("deleteAlternativeTools");
  const canManageStatusAlternativeTools = hasPermission("alternativeToolsMenuStatusChange");

  const fetchTools = useCallback(
    async (page = 1, search = "") => {
      setIsLoading(true);
      try {
        const params: Record<string, any> = { page, limit: ITEMS_PER_PAGE, search };
        const response = await apiService<PaginatedResponse<AlternativeTool>>(
          "/alternative-tools",
          { params },
        );

        if (response.success) {
          setTools(response.data);
          setCurrentPage(response.pagination.current);
          setTotalPages(response.pagination.pages);
          setTotalItems(response.pagination.total);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch alternative tools.",
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
    [toast],
  );

  useEffect(() => {
    if (canManageAlternativeTools) fetchTools(currentPage, searchTerm);
    else {
      setIsLoading(false);
      setTools([]);
    }
  }, [currentPage, searchTerm, fetchTools, canManageAlternativeTools]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleToggleActive = async (tool: AlternativeTool) => {
    // If permission not checked, allow if user is admin (Backend enforces this)
    // Here we check the frontend permission if available
    try {
      const response = await apiService<SingleResponse<{ is_active: boolean }>>(
        `/alternative-tools/${tool._id}/toggle`,
        { method: "PUT" },
      );
      if (response.success) {
        toast({
          title: "Success",
          description: `Tool ${tool.name} updated.`,
        });
        setTools((prev) =>
          prev.map((t) =>
            t._id === tool._id
              ? { ...t, is_active: response.data.is_active }
              : t,
          ),
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

  const openEditDialog = (tool: AlternativeTool) => {
    setTargetTool(tool);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (tool: AlternativeTool) => {
    setTargetTool(tool);
    setIsDeleteDialogOpen(true);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === tools.length) setSelectedIds([]);
    else setSelectedIds(tools.map((t) => t._id));
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id))
      setSelectedIds((prev) => prev.filter((prevId) => prevId !== id));
    else setSelectedIds((prev) => [...prev, id]);
  };

  const refreshData = () => {
    fetchTools(
      tools.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage,
      searchTerm,
    );
    setSelectedIds([]);
  };

  const formatPrice = (price: AlternativeTool["price"]) => {
    const numericPrice =
      typeof price === "number"
        ? price
        : typeof price === "string"
          ? Number(price)
          : NaN;

    return Number.isFinite(numericPrice) ? `$${numericPrice.toFixed(2)}` : "-";
  };

  return (
    <ProtectedPage requiredPermission="viewAlternativeToolsMenu">
      <PageHeader
        title="Alternative Tools"
        description="Manage the list of alternative tools for your application."
        actionButtons={
          (canCreateAlternativeTools || true) && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Tool
            </Button>
          )
        }
      />
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tools..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-8"
          />
        </div>
        {(canDeleteAlternativeTools || true) && (
          <Button
            variant="destructive"
            onClick={() => setIsBulkDeleteDialogOpen(true)}
            disabled={selectedIds.length <= 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
        )}
      </div>
      <div className="rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {canDeleteAlternativeTools && (

                <TableHead className="w-[40px]">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === tools.length &&
                      tools.length > 0
                    }
                    onChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-center">Active</TableHead>
              {(canEditAlternativeTools || canDeleteAlternativeTools) && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : tools.length > 0 ? (
              tools.map((tool) => (
                <TableRow key={tool._id}>
                  {canDeleteAlternativeTools && (

                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(tool._id)}
                        onChange={() => toggleSelectOne(tool._id)}
                      />
                    </TableCell>
                  )

                  }
                  <TableCell>
                    {tool.image ? (
                      <img
                        src={tool.image}
                        alt={tool.name}
                        className="h-10 w-10 rounded-md object-cover border"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                        <ImageOff className="h-4 w-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{tool.name}</TableCell>
                  <TableCell>{formatPrice(tool.price)}</TableCell>

                  <TableCell className="text-center">
                    <Switch
                      checked={tool.is_active}
                      onCheckedChange={() => handleToggleActive(tool)}
                      disabled={!canManageStatusAlternativeTools}
                    />
                  </TableCell>

                  {(canEditAlternativeTools || canDeleteAlternativeTools) && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEditAlternativeTools && (
                            <DropdownMenuItem onClick={() => openEditDialog(tool)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                          )}
                          {canDeleteAlternativeTools && (
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(tool)}
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
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No tools found.
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
            tools
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
      <CreateAlternativeToolDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={refreshData}
      />
      {targetTool && (
        <>
          <EditAlternativeToolDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            toolId={targetTool._id}
            onSuccess={refreshData}
          />
          <DeleteAlternativeToolDialog
            isOpen={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            toolId={targetTool._id}
            toolName={targetTool.name}
            onSuccess={refreshData}
          />
        </>
      )}
      <MultipleDeleteAlternativeToolDialog
        isOpen={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
        selectedIds={selectedIds}
        onSuccess={refreshData}
      />
    </ProtectedPage>
  );
}
