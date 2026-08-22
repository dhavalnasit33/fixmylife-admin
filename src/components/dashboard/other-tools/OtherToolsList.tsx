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
import { PlusCircle, Edit, Trash2, MoreHorizontal, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import apiService from "@/lib/apiService";

// Import our Generic Components
import OtherToolDeleteDialog from "./OtherToolDeleteDialog";
import MultipleDeleteOtherToolDialog from "./MultipleDeleteOtherToolDialog";
import { Permission } from "@/config";

interface OtherToolsListProps {
  toolType: string; // e.g. "writing"
  pageTitle: string; // e.g. "Writing Tools Management"
  apiEndpoint: string; // e.g. "/writing-tools" (This is the base API path)
  frontendPath: string; // e.g. "/dashboard/writing-tools" (For navigation)
  // permissionPrefix?: string; // e.g. "writingTools" -> uses "viewWritingToolsMenu" etc.
  viewPermission: Permission;
  createPermission: Permission;
  editPermission: Permission;
  deletePermission: Permission;
  // ✅ ADDED: Specific permission for status toggles
  statusChangePermission: Permission;
}

const ITEMS_PER_PAGE = 10;

export default function OtherToolsList({
  toolType,
  pageTitle,
  apiEndpoint,
  frontendPath,
  viewPermission,
  createPermission,
  editPermission,
  deletePermission,
  statusChangePermission, // ✅ Destructure it here
}: OtherToolsListProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { hasPermission } = useAuth();

  const canCreate = hasPermission(createPermission);
  const canEdit = hasPermission(editPermission);
  const canDelete = hasPermission(deletePermission);
  // ✅ Check specifically for status change permission
  const canChangeStatus = hasPermission(statusChangePermission);
  // State
  const [tools, setTools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<any | null>(null);
  const [selectedTools, setSelectedTools] = useState<
    { id: String; name: String }[]
  >([]);
  const [isMultipleDeleteDialogOpen, setIsMultipleDeleteDialogOpen] =
    useState(false);

  // 1. Fetch Tools (Removed Category Logic)
  const fetchTools = useCallback(
    async (page = 1, search = "") => {
      setIsLoading(true);
      try {
        const params: any = { page, limit: ITEMS_PER_PAGE };
        if (search) params.search = search;

        // Hit the admin endpoint for this tool type
        const response = await apiService<any>(`${apiEndpoint}/admin`, {
          params,
        });

        if (response.success) {
          setTools(response.data);
          setTotalPages(response.pagination.pages);
          setTotalItems(response.pagination.total);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to fetch tools",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [apiEndpoint, toast]
  );

  // Effects
  useEffect(() => {
    fetchTools(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchTools]);

  // Handlers
  const handleToggleActive = async (tool: any) => {
    if (!canChangeStatus) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to change status.",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await apiService<{ success: boolean; data: any }>(
        `${apiEndpoint}/${tool._id}/toggle`,
        { method: "PATCH" }
      );
      if (res.success) {
        setTools((prev) =>
          prev.map((t) =>
            t._id === tool._id ? { ...t, is_active: res.data.is_active } : t
          )
        );
        toast({ title: "Updated", description: "Tool status updated" });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update",
        variant: "destructive",
      });
    }
  };

  const handleTogglePopular = async (tool: any) => {
    if (!canChangeStatus) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to change status.",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await apiService<{ success: boolean; data: any }>(
        `${apiEndpoint}/${tool._id}/toggle-popular`,
        { method: "PATCH" }
      );
      if (res.success) {
        setTools((prev) =>
          prev.map((t) =>
            t._id === tool._id ? { ...t, is_popular: res.data.is_popular } : t
          )
        );
        toast({ title: "Updated", description: "Popular status updated" });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update",
        variant: "destructive",
      });
    }
  };

  const toggleSelectAll = () => {
    if (selectedTools.length === tools.length) setSelectedTools([]);
    else setSelectedTools(tools.map((t) => ({ id: t._id, name: t.name })));
  };

  const toggleSelectOne = (id: string, name: string) => {
    if (selectedTools.find((i) => i.id === id))
      setSelectedTools((prev) => prev.filter((i) => i.id !== id));
    else setSelectedTools((prev) => [...prev, { id, name }]);
  };

  return (
    <ProtectedPage requiredPermission={viewPermission}>
      <PageHeader
        title={pageTitle}
        description={`Manage your ${toolType} tools.`}
        actionButtons={
          canCreate && (
            <Button onClick={() => router.push(`${frontendPath}/create`)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Tool
            </Button>
          )
        }
      />

      {/* SEARCH & DELETE ACTIONS */}
      <div className="mb-4 flex flex-col sm:flex-row justify-between gap-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {selectedTools.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setIsMultipleDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedTools.length}
              )
            </Button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {canDelete && (
                <TableHead className="w-[40px]">
                  <input
                    type="checkbox"
                    onChange={toggleSelectAll}
                    checked={
                      tools.length > 0 && selectedTools.length === tools.length
                    }
                  />
                </TableHead>
              )}

              <TableHead>Name</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="text-center">Popular</TableHead>
              {(canEdit || canDelete) && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5)
                .fill(0)
                .map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
            ) : tools.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  No tools found.
                </TableCell>
              </TableRow>
            ) : (
              tools.map((tool) => (
                <TableRow key={tool._id}>
                  {canDelete && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedTools.some((i) => i.id === tool._id)}
                        onChange={() => toggleSelectOne(tool._id, tool.name)}
                      />
                    </TableCell>
                  )}

                  <TableCell className="font-medium">{tool.name}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={tool.is_active}
                      onCheckedChange={() => handleToggleActive(tool)}
                      disabled={!canChangeStatus}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={tool.is_popular}
                      onCheckedChange={() => handleTogglePopular(tool)}
                      disabled={!canChangeStatus}
                    />
                  </TableCell>
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
                                router.push(`${frontendPath}/${tool._id}/edit`)
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedTool(tool);
                                setIsDeleteDialogOpen(true);
                              }}
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
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)}{" "}
          to {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of{" "}
          {totalItems} items
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || isLoading}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages || isLoading || totalItems === 0}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* DIALOGS */}
      <OtherToolDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        tool={selectedTool}
        onSuccess={() => fetchTools(currentPage)}
        apiEndpoint={apiEndpoint}
      />

      <MultipleDeleteOtherToolDialog
        isOpen={isMultipleDeleteDialogOpen}
        onOpenChange={setIsMultipleDeleteDialogOpen}
        tools={selectedTools}
        onSuccess={() => {
          fetchTools(currentPage);
          setSelectedTools([]);
        }}
        apiEndpoint={apiEndpoint}
      />
    </ProtectedPage>
  );
}
