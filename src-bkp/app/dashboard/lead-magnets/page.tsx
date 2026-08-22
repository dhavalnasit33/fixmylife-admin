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
import type { LeadMagnet, PaginatedResponse, SingleResponse } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import LeadMagnetDeleteDialog from "@/components/dashboard/lead-magnets/LeadMagnetDeleteDialog";
import MultipleLeadMagnetDeleteDialog from "@/components/dashboard/lead-magnets/MultipleLeadMagnetDeleteDialog";

const ITEMS_PER_PAGE = 10;

export default function LeadMagnetsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [leadMagnets, setLeadMagnets] = useState<LeadMagnet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLeadMagnet, setSelectedLeadMagnet] =
    useState<LeadMagnet | null>(null);
  const [selectedItems, setSelectedItems] = useState<
    { id: string; title: string }[]
  >([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  const canManage = hasPermission("viewLeadMagnetsMenu");
  const canCreate = hasPermission("createLeadMagnets");
  const canEdit = hasPermission("editLeadMagnets");
  const canDelete = hasPermission("deleteLeadMagnets");
  const canManageStatus = hasPermission("leadMagnetsStatusChange");

  const fetchLeadMagnets = useCallback(
    async (page = 1, search = "") => {
      setIsLoading(true);
      try {
        const params: Record<string, string | number | boolean | undefined> = {
          page,
          limit: ITEMS_PER_PAGE,
          search: search,
        };

        const response = await apiService<PaginatedResponse<LeadMagnet>>(
          "/lead-magnets",
          { params }
        );

        if (response.success) {
          setLeadMagnets(response.data);
          if (response.pagination) {
            // Using current, page (total), and total from backend
            setCurrentPage(response.pagination.current);
            setTotalPages((response.pagination as any).page || response.pagination.pages);
            setTotalItems(response.pagination.total);
          }
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to fetch Lead Magnets.",
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
        fetchLeadMagnets(currentPage, searchTerm);
      }, 300); // 300ms debounce for search typing

      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, fetchLeadMagnets, canManage]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to page 1 when searching
  };

  const openDeleteDialog = (leadMagnet: LeadMagnet) => {
    setSelectedLeadMagnet(leadMagnet);
    setIsDeleteDialogOpen(true);
  };

  const onDeleted = () => {
    fetchLeadMagnets(currentPage, searchTerm);
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === leadMagnets.length) setSelectedItems([]);
    else
      setSelectedItems(
        leadMagnets.map((item) => ({ id: item._id, title: item.title })),
      );
  };

  const toggleSelectOne = (id: string, title: string) => {
    const isSelected = selectedItems.some((i) => i.id === id);
    if (isSelected) setSelectedItems((prev) => prev.filter((i) => i.id !== id));
    else setSelectedItems((prev) => [...prev, { id, title }]);
  };

  const handleToggleStatus = async (lm: LeadMagnet) => {
    if (!canManageStatus) return;
    try {
      const response = await apiService<SingleResponse<LeadMagnet>>(
        `/lead-magnets/${lm._id}/toggle`,
        { method: "PATCH" },
      );
      if (response.success) {
        toast({ title: "Success", description: "Status updated successfully." });
        setLeadMagnets((prev) =>
          prev.map((item) =>
            item._id === lm._id ? { ...item, status: response.data.status } : item,
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

  return (
    <ProtectedPage requiredPermission="viewLeadMagnetsMenu">
      <PageHeader
        title="Lead Magnets Management"
        description="Manage dynamic SEO lead magnets and tool associations."
        actionButtons={
          canCreate && (
            <Button
              onClick={() => router.push("/dashboard/lead-magnets/create")}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Lead Magnet
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search lead magnets..."
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
                      selectedItems.length === leadMagnets.length &&
                      leadMagnets.length > 0
                    }
                    onChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {canDelete && (
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                  )}
                  <TableCell>
                    <Skeleton className="h-5 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="h-5 w-16 mx-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : leadMagnets.length > 0 ? (
              leadMagnets.map((lm) => (
                <TableRow key={lm._id}>
                  {canDelete && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedItems.some((i) => i.id === lm._id)}
                        onChange={() => toggleSelectOne(lm._id, lm.title)}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{lm.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lm.slug}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        checked={lm.status === "published"}
                        onCheckedChange={() => handleToggleStatus(lm)}
                        disabled={!canManageStatus}
                      />
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${lm.status === "published"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                          }`}
                      >
                        {lm.status}
                      </span>
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
                              router.push(
                                `/dashboard/lead-magnets/${lm._id}/edit`,
                              )
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(lm)}
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
                <TableCell colSpan={canDelete ? 5 : 4} className="text-center h-24">
                  No lead magnets found.
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
            lead magnets
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

      <LeadMagnetDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        leadMagnet={selectedLeadMagnet}
        onSuccess={onDeleted}
      />

      {canDelete && selectedItems.length > 0 && (
        <MultipleLeadMagnetDeleteDialog
          isOpen={isBulkDeleteDialogOpen}
          onOpenChange={setIsBulkDeleteDialogOpen}
          items={selectedItems}
          onSuccess={() => {
            fetchLeadMagnets(currentPage, searchTerm);
            setSelectedItems([]);
          }}
        />
      )}
    </ProtectedPage>
  );
}
