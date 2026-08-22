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
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import apiService from "@/lib/apiService";
import type { PaginatedResponse, SingleResponse } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

// Import Dialogs
import CreateImageStyleDialog from "@/components/dashboard/image-styles/CreateImageStyleDialog";
import EditImageStyleDialog from "@/components/dashboard/image-styles/EditImageStyleDialog";
import DeleteImageStyleDialog from "@/components/dashboard/image-styles/DeleteImageStyleDialog";
import MultipleDeleteImageStyleDialog from "@/components/dashboard/image-styles/MultipleDeleteImageStyleDialog";
import { ImageStyle } from "@/types";

const ITEMS_PER_PAGE = 10;

export default function ImageStylesPage() {
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  // State
  const [styles, setStyles] = useState<ImageStyle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "image" | "video">("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Selection for bulk delete
  const [selectedStyles, setSelectedStyles] = useState<
    { id: string; name: string }[]
  >([]);

  // Dialog States
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  // Selected item for Edit/Delete
  const [targetStyle, setTargetStyle] = useState<ImageStyle | null>(null);

  const canManageImageStyles = hasPermission("viewImageStyleMenu");
  const canCreateImageStyles = hasPermission("createImageStyleMenu");
  const canEditImageStyles = hasPermission("editImageStyleMenu");
  const canDeleteImageStyles = hasPermission("deleteImageStyleMenu");
  const canManageStatusImageStyles = hasPermission(
    "imageStyleMenuStatusChange",
  );

  const fetchStyles = useCallback(
    async (page = 1, search = "", type: string = "") => {
      setIsLoading(true);
      try {
        const params: Record<string, any> = { page, limit: ITEMS_PER_PAGE, search };
        if (type) params.type = type;
        const response = await apiService<PaginatedResponse<ImageStyle>>(
          "/image-styles",
          { params },
        );

        if (response.success) {
          setStyles(response.data);
          setCurrentPage(response.pagination.current);
          setTotalPages(response.pagination.pages);
          setTotalItems(response.pagination.total);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch image styles.",
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
    if (canManageImageStyles) fetchStyles(currentPage, searchTerm, typeFilter);
    else {
      setIsLoading(false);
      setStyles([]);
    }
  }, [currentPage, searchTerm, typeFilter, fetchStyles, canManageImageStyles]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value as "" | "image" | "video");
    setCurrentPage(1);
  };

  const handleToggleActive = async (style: ImageStyle) => {
    if (!canManageStatusImageStyles) return;
    try {
      const response = await apiService<SingleResponse<{ is_active: boolean }>>(
        `/image-styles/${style._id}/toggle`,
        { method: "PATCH" },
      );
      if (response.success) {
        toast({
          title: "Success",
          description: `Style ${style.name} updated.`,
        });
        setStyles((prev) =>
          prev.map((s) =>
            s._id === style._id
              ? { ...s, is_active: response.data.is_active }
              : s,
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

  // Dialog Handlers
  const openEditDialog = (style: ImageStyle) => {
    setTargetStyle(style);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (style: ImageStyle) => {
    setTargetStyle(style);
    setIsDeleteDialogOpen(true);
  };

  // Bulk Selection Logic
  const toggleSelectAll = () => {
    if (selectedStyles.length === styles.length) setSelectedStyles([]);
    else setSelectedStyles(styles.map((s) => ({ id: s._id, name: s.name })));
  };

  const toggleSelectOne = (id: string, name: string) => {
    const isSelected = selectedStyles.some((s) => s.id === id);
    if (isSelected)
      setSelectedStyles((prev) => prev.filter((s) => s.id !== id));
    else setSelectedStyles((prev) => [...prev, { id, name }]);
  };

  const refreshData = () => {
    fetchStyles(
      styles.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage,
      searchTerm,
      typeFilter,
    );
    setSelectedStyles([]);
  };

  return (
    <ProtectedPage requiredPermission="viewImageStyleMenu">
      {" "}
      {/* Update Permission */}
      <PageHeader
        title="Image Styles"
        description="Manage styles for image generation prompts."
        actionButtons={
          canCreateImageStyles && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Image Style
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
              placeholder="Search styles..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-8"
            />
          </div>
          <Select value={typeFilter || "all"} onValueChange={(v) => handleTypeFilterChange(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {canDeleteImageStyles && (
          <Button
            variant="destructive"
            onClick={() => setIsBulkDeleteDialogOpen(true)}
            disabled={selectedStyles.length <= 0}
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
              {canDeleteImageStyles && (
                <TableHead className="w-[40px]">
                  <input
                    type="checkbox"
                    checked={
                      selectedStyles.length === styles.length &&
                      styles.length > 0
                    }
                    onChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Active</TableHead>
              {(canEditImageStyles || canDeleteImageStyles) && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-5" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-10 mx-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : styles.length > 0 ? (
              styles.map((style) => (
                <TableRow key={style._id}>
                  {canDeleteImageStyles && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedStyles.some((s) => s.id === style._id)}
                        onChange={() => toggleSelectOne(style._id, style.name)}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{style.name}</TableCell>
                  <TableCell>
                    <Badge variant={style.type === "video" ? "secondary" : "default"} className="capitalize">
                      {style.type || "image"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-center">
                    <Switch
                      checked={style.is_active}
                      onCheckedChange={() => handleToggleActive(style)}
                      disabled={!canManageStatusImageStyles}
                    />
                  </TableCell>

                  {(canEditImageStyles || canDeleteImageStyles) && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEditImageStyles && (
                            <DropdownMenuItem
                              onClick={() => openEditDialog(style)}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                          )}
                          {canDeleteImageStyles && (
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(style)}
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
                <TableCell colSpan={4} className="text-center h-24">
                  No styles found.
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
            styles
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
      <CreateImageStyleDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={refreshData}
      />
      <EditImageStyleDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        styleId={targetStyle?._id || null}
        onSuccess={refreshData}
      />
      <DeleteImageStyleDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        style={targetStyle}
        onSuccess={refreshData}
      />
      <MultipleDeleteImageStyleDialog
        isOpen={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
        styles={selectedStyles}
        onSuccess={refreshData}
      />
    </ProtectedPage>
  );
}
