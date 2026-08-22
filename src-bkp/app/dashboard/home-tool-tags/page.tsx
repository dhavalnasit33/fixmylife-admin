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
import type { PaginatedResponse, SingleResponse, HomeToolTag } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

// dialogs
import DeleteHomeToolTagDialog from "@/components/dashboard/home-tool-tags/DeleteHomeToolTagDialog";
import MultipleDeleteHomeToolTagDialog from "@/components/dashboard/home-tool-tags/MultipleDeleteHomeToolTagDialog";

const ITEMS_PER_PAGE = 10;

export default function HomeToolTagsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const [tags, setTags] = useState<HomeToolTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<HomeToolTag | null>(null);
  const [selectedTags, setSelectedTags] = useState<{ id: string; name: string }[]>([]);
  const [isMultipleTagRemoveDialogOpen, setIsMultipleTagRemoveDialogOpen] = useState(false);

  // permissions
  const canManageTags = hasPermission("viewHomeToolTagsMenu");
  const canCreateTags = hasPermission("createHomeToolTag");
  const canEditTags = hasPermission("editHomeToolTag");
  const canDeleteTags = hasPermission("deleteHomeToolTag");
  const canManageStatusTags = hasPermission("homeToolTagStatusChange");

  const fetchTags = useCallback(
    async (page = 1, search = "") => {
      setIsLoading(true);
      try {
        const response = await apiService<PaginatedResponse<HomeToolTag>>("/home-tool-tags", {
          params: { page, limit: ITEMS_PER_PAGE, search },
        });

        if (response.success) {
          setTags(response.data);
          setCurrentPage(response.pagination.current);
          setTotalPages(response.pagination.pages);
          setTotalItems(response.pagination.total);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch tags.",
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
    if (canManageTags) fetchTags(currentPage, searchTerm);
    else {
      setIsLoading(false);
      setTags([]);
    }
  }, [currentPage, searchTerm, fetchTags, canManageTags]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleToggleActive = async (tag: HomeToolTag) => {
    if (!canManageTags && !canManageStatusTags) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to update tags.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await apiService<SingleResponse<{ is_active: boolean }>>(
        `/home-tool-tags/${tag._id}/toggle`,
        { method: "PATCH" }
      );

      if (response.success) {
        toast({
          title: "Success",
          description: `Tag ${tag.name} status updated.`,
        });

        setTags((prev) =>
          prev.map((t) => (t._id === tag._id ? { ...t, is_active: response.data.is_active } : t))
        );
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (tagId: string) => {
    const tag = tags.find((t) => t._id === tagId) || null;
    if (!tag) return;
    setSelectedTag(tag);
    setIsDeleteDialogOpen(true);
  };

  const onTagDeleted = () => {
    fetchTags(tags.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage, searchTerm);
    setIsDeleteDialogOpen(false);
    setSelectedTag(null);
  };

  const openMultipleTagRemoveDialog = () => {
    if (!canManageTags) return;
    setIsMultipleTagRemoveDialogOpen(true);
  };

  const handleMultipleTagRemoveSuccess = () => {
    fetchTags(tags.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage, searchTerm);
    setIsMultipleTagRemoveDialogOpen(false);
    setSelectedTags([]);
  };

  const toggleSelectAll = () => {
    if (selectedTags.length === tags.length) setSelectedTags([]);
    else setSelectedTags(tags.map((tag) => ({ id: tag._id, name: tag.name })));
  };

  const toggleSelectOne = (id: string) => {
    const isSelected = selectedTags.some((t) => t.id === id);
    if (isSelected) setSelectedTags((prev) => prev.filter((t) => t.id !== id));
    else setSelectedTags((prev) => [...prev, { id, name: tags.find((t) => t._id === id)?.name || "" }]);
  };

  return (
    <ProtectedPage requiredPermission="viewHomeToolTagsMenu">
      <PageHeader
        title="Home Tool Tags"
        description="Manage home tool tags."
        actionButtons={
          canCreateTags && (
            <Button onClick={() => router.push("/dashboard/home-tool-tags/create")}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Home Tool Tag
            </Button>
          )
        }
      />

      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tags..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-8"
          />
        </div>

        {canDeleteTags && (
          <Button
            variant="destructive"
            onClick={openMultipleTagRemoveDialog}
            disabled={selectedTags.length <= 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Tags
          </Button>
        )}
      </div>

      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {canDeleteTags && (
                <TableHead className="w-[40px]">
                  <input
                    type="checkbox"
                    checked={selectedTags.length === tags.length && tags.length > 0}
                    onChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>Name</TableHead>
              {canManageStatusTags && <TableHead className="text-center">Active</TableHead>}
              {(canEditTags || canDeleteTags) && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  {canManageStatusTags && (
                    <TableCell className="text-center">
                      <Skeleton className="h-5 w-10 mx-auto" />
                    </TableCell>
                  )}
                  {(canEditTags || canDeleteTags) && (
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : tags.length > 0 ? (
              tags.map((tag) => {
                const isChecked = selectedTags.some((t) => t.id === tag._id);

                return (
                  <TableRow key={tag._id}>
                    {canDeleteTags && (
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(tag._id)}
                        />
                      </TableCell>
                    )}

                    <TableCell className="font-medium">{tag.name}</TableCell>

                    {canManageStatusTags && (
                      <TableCell className="text-center">
                        <Switch
                          checked={tag.is_active}
                          onCheckedChange={() => handleToggleActive(tag)}
                          disabled={!canManageTags}
                        />
                      </TableCell>
                    )}

                    {(canEditTags || canDeleteTags) && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEditTags && (
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/dashboard/home-tool-tags/${tag._id}/edit`)
                                }
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                            )}

                            {canDeleteTags && (
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(tag._id)}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                  No tags found.
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
            {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} tags
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
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || isLoading}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {canManageTags && selectedTag && (
        <DeleteHomeToolTagDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          tag={selectedTag}
          onSuccess={onTagDeleted}
        />
      )}

      {canManageTags && selectedTags && (
        <MultipleDeleteHomeToolTagDialog
          isOpen={isMultipleTagRemoveDialogOpen}
          onOpenChange={setIsMultipleTagRemoveDialogOpen}
          tags={selectedTags}
          onSuccess={handleMultipleTagRemoveSuccess}
        />
      )}
    </ProtectedPage>
  );
}
