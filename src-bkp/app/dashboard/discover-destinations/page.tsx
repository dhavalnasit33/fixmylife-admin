"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedPage from "@/components/shared/ProtectedPage";
import PageHeader from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Pencil,
  Trash,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import apiService from "@/lib/apiService";

import DeleteDestinationDialog from "@/components/dashboard/discover-destinations/DeleteDestinationDialog";
import MultipleDeleteDestinationDialog from "@/components/dashboard/discover-destinations/MultipleDeleteDestinationDialog";
import DestinationForm from "@/components/dashboard/discover-destinations/DestinationForm";
import type { PaginatedResponse } from "@/types";
import { Switch } from "@/components/ui/switch";

const ITEMS_PER_PAGE = 5;

export default function DiscoverDestinationsPage() {
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const canViewDestinations = hasPermission("viewDestinationsCategoriesMenu");
  const canCreateDestinations = hasPermission(
    "createDestinationsCategoriesMenu"
  );
  const canEditDestinations = hasPermission("editDestinationsCategoriesMenu");
  const canDeleteDestinations = hasPermission(
    "deleteDestinationsCategoriesMenu"
  );

  const [destinations, setDestinations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDestinationToDelete, setSelectedDestinationToDelete] =
    useState<any | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(
    []
  );

  const [editingDestination, setEditingDestination] = useState<any | null>(
    null
  );

  const fetchDestinations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { page: currentPage, limit: ITEMS_PER_PAGE };
      if (search) params.search = search;

      const response = await apiService<PaginatedResponse<any>>(
        "/discover-destinations",
        { params }
      );
      if (response.success) {
        setDestinations(response.data);
        setTotalPages(response.pagination.pages);
        setTotalItems(response.pagination.total);
        setSelectedDestinations([]);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch destinations",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error fetching destinations",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search, toast]);

  async function updateDestinationStatus(
    discoverId: string,
    isActive: boolean
  ): Promise<any> {
    const response = await apiService<any>(
      `/discover-destinations/${discoverId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: isActive }),
      }
    );

    if (!response.success) {
      throw new Error(response.message || "Failed to update recipe status");
    }

    return response;
  }

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  const toggleSelectAll = () => {
    if (selectedDestinations.length === destinations.length) {
      setSelectedDestinations([]);
    } else {
      setSelectedDestinations(destinations.map((d) => d._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedDestinations((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  return (
    <ProtectedPage requiredPermission="viewDestinationsCategoriesMenu">
      <PageHeader
        title="Destinations Categories"
        description="Manage all your Destinations Categories"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 items-start">
        {/* Left side - Destination Form */}
        {(canCreateDestinations || editingDestination) && (
          <div className="border rounded-md shadow-sm bg-white p-5">
            <h2 className="font-semibold text-lg mb-4">
              {editingDestination ? "Edit Destination" : "Add Destination"}
            </h2>
            <DestinationForm
              initialData={editingDestination}
              onSuccess={() => {
                fetchDestinations();
                setEditingDestination(null);
              }}
              onCancelEdit={() => setEditingDestination(null)}
            />
          </div>
        )}

        {/* Right side - Destinations Table */}
        <div>
          <div className="flex justify-between items-center">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search destinations..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 mb-1"
              />
            </div>

            {selectedDestinations.length > 0 && canDeleteDestinations && (
              <Button
                variant="destructive"
                onClick={() => setBulkDeleteDialogOpen(true)}
              >
                <Trash className="mr-2 h-4 w-4" /> Delete Selected
              </Button>
            )}
          </div>

          <div className="rounded-md border shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {canDeleteDestinations && (
                    <TableHead className="w-4">
                      <input
                        type="checkbox"
                        checked={
                          selectedDestinations.length === destinations.length
                        }
                        onChange={toggleSelectAll}
                      />
                    </TableHead>
                  )}
                  <TableHead>Name</TableHead>
                  <TableHead>Destinations Counts</TableHead>
                  <TableHead>Status</TableHead>
                  {(canEditDestinations || canDeleteDestinations) && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      {canDeleteDestinations && (
                        <TableCell>
                          <Skeleton className="h-4 w-4" />
                        </TableCell>
                      )}
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      {(canEditDestinations || canDeleteDestinations) && (
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : destinations.length > 0 ? (
                  destinations.map((destination) => (
                    <TableRow key={destination._id}>
                      {canDeleteDestinations && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedDestinations.includes(
                              destination._id
                            )}
                            onChange={() => toggleSelect(destination._id)}
                          />
                        </TableCell>
                      )}
                      <TableCell>{destination.title}</TableCell>
                      <TableCell>{destination.collection_count ?? 0}</TableCell>
                      <TableCell>
                        <Switch
                          checked={destination.is_active}
                          onCheckedChange={async (checked) => {
                            try {
                              await updateDestinationStatus(
                                destination._id,
                                checked
                              );
                              fetchDestinations();
                            } catch (error) {
                              console.error("Failed to update status", error);
                            }
                          }}
                        />
                      </TableCell>

                      {(canEditDestinations || canDeleteDestinations) && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canEditDestinations && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setEditingDestination(destination)
                                  }
                                >
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                              )}
                              {canDeleteDestinations && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDestinationToDelete(destination);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                  <Trash className="mr-2 h-4 w-4" /> Delete
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
                      No destinations found.
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
                {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)}{" "}
                to {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of{" "}
                {totalItems} destinations
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages || isLoading}
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {canDeleteDestinations && (
        <>
          <DeleteDestinationDialog
            isOpen={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            destination={selectedDestinationToDelete}
            onSuccess={fetchDestinations}
          />
          <MultipleDeleteDestinationDialog
            isOpen={bulkDeleteDialogOpen}
            onOpenChange={setBulkDeleteDialogOpen}
            destinations={destinations.filter((d) =>
              selectedDestinations.includes(d._id)
            )}
            onSuccess={fetchDestinations}
          />
        </>
      )}
    </ProtectedPage>
  );
}
