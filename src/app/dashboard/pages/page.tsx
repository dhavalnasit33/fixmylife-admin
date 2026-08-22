"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/shared/PageHeader";
import ProtectedPage from "@/components/shared/ProtectedPage";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Search, Trash } from "lucide-react";
import apiService from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import DeletePageDialog from "@/components/dashboard/pages/DeletePageDialog";
import MultipleDeletePageDialog from "@/components/dashboard/pages/MultipleDeletePageDialog";
import type { Page as PageType, PaginatedResponse } from "@/types";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

const ITEMS_PER_PAGE = 10;

export default function PagesPage() {
  const { toast } = useToast();

  const router = useRouter();
  const { hasPermission } = useAuth();

  const [pages, setPages] = useState<PageType[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedPageToDelete, setSelectedPageToDelete] =
    useState<PageType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);

  const canViewPages = hasPermission('viewPagesMenu');
  const canCreatePages = hasPermission('createPagesMenu');
  const canEditPages = hasPermission('editPagesMenu');
  const canDeletePages = hasPermission('deletePagesMenu');


  const fetchPages = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { page: currentPage, limit: ITEMS_PER_PAGE };
      if (search) params.search = search;

      const response = await apiService<PaginatedResponse<PageType>>("/pages", {
        params,
      });
      if (response.success) {
        setPages(response.data);
        setTotalPages(response.pagination.pages);
        setTotalItems(response.pagination.total);
        setSelectedPages([]);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch pages.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error fetching pages",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [search, currentPage, toast]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const toggleSelectAll = () => {
    if (selectedPages.length === pages.length) {
      setSelectedPages([]);
    } else {
      setSelectedPages(pages.map((page) => page._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedPages((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const selectedPageDetails = pages
    .filter((p) => selectedPages.includes(p._id))
    .map((p) => ({ id: p._id, page_title: p.page_title }));

  return (
    <>
      <ProtectedPage requiredPermission="viewPagesMenu">
        <PageHeader
          title="Pages"
          description="Manage your site pages with SEO data."
          actionButtons={
            <div className="flex gap-2">
              {selectedPages.length > 0 && canDeletePages && (
                <Button
                  variant="destructive"

                  onClick={() => setBulkDeleteDialogOpen(true)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Selected
                </Button>
              )}
            </div>
          }
        />

        <div className="mt-4 mb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search pages..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8"
            />
          </div>
        </div>

        <div className="rounded-md border shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {
                  canDeletePages && <TableHead className="w-4">
                    <input
                      type="checkbox"
                      checked={selectedPages.length === pages.length}
                      onChange={toggleSelectAll}
                    />
                  </TableHead>
                }
                <TableHead>Title</TableHead>
                <TableHead>SEO Title</TableHead>
                <TableHead>Meta Desc.</TableHead>
                <TableHead>Keyphrase</TableHead>
                <TableHead>Created At</TableHead>
                {(canEditPages || canDeletePages) && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {
                      canDeletePages && <TableCell>
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
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    {
                      (canEditPages || canDeletePages) &&
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    }
                  </TableRow>
                ))
              ) : pages.length > 0 ? (
                pages.map((page) => (
                  <TableRow key={page._id}>
                    {
                      canDeletePages && <TableCell className="w-4">
                        <input
                          type="checkbox"
                          checked={selectedPages.includes(page._id)}
                          onChange={() => toggleSelect(page._id)}
                        />
                      </TableCell>
                    }
                    <TableCell>
                      {page.page_title || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {page.seo_title || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="truncate max-w-sm">
                      {page.meta_description || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {page.seo_keyphrase || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {page.createdAt
                        ? new Date(page.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                        : "—"}
                    </TableCell>
                    {
                      (canEditPages || canDeletePages) &&
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">
                                Actions for {page.page_title}
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {
                              canEditPages && <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/dashboard/pages/${page._id}/edit`)
                                }
                              >
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                            }
                            {
                              canDeletePages && <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPageToDelete(page);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              >
                                <Trash className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            }
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    }
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No pages found.
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
              {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of{" "}
              {totalItems} pages
            </p>
            <div className="flex items-center gap-2">
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
                disabled={currentPage === totalPages || isLoading}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </ProtectedPage>

      {
        canViewPages && canDeletePages &&
        <DeletePageDialog
          isOpen={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          page={selectedPageToDelete}
          onSuccess={() => {
            setSelectedPageToDelete(null);
            fetchPages();
          }}
        />
      }
      {
        canViewPages && canDeletePages &&

        <MultipleDeletePageDialog
          isOpen={bulkDeleteDialogOpen}
          onOpenChange={setBulkDeleteDialogOpen}
          pages={selectedPageDetails}
          onSuccess={() => {
            setSelectedPages([]);
            fetchPages();
          }}
        />
      }
    </>
  );
}
