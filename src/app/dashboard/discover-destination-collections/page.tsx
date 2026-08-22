"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/shared/PageHeader";
import ProtectedPage from "@/components/shared/ProtectedPage";
import { Button } from "@/components/ui/button";
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
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Pencil,
  MoreHorizontal,
  Filter,
} from "lucide-react";
import apiService from "@/lib/apiService";
import type {
  PaginatedResponse,
  DiscoverDestinationCollection,
  DiscoverDestination,
} from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import ClientFormattedDate from "@/components/shared/ClientFormattedDate";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import MultiDeleteDiscoverDestinationCollectionDialog from "@/components/dashboard/discover-destination-collections/MultiDeleteDiscoverDestinationCollectionDialog";
import DeleteDiscoverDestinationCollectionDialog from "@/components/dashboard/discover-destination-collections/DeleteDiscoverDestinationCollectionDialog";
import CreateDiscoverDestinationCollectionDialog from "@/components/dashboard/discover-destination-collections/CreateDiscoverDestinationCollectionDialog";
import EditDiscoverDestinationCollectionDialog from "@/components/dashboard/discover-destination-collections/EditDiscoverDestinationCollectionDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ITEMS_PER_PAGE = 10;

export default function DiscoverDestinationCollectionsPage() {
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const [collections, setCollections] = useState<
    DiscoverDestinationCollection[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [destinations, setDestinations] = useState<DiscoverDestination[]>([]);
  const [selectedDestination, setSelectedDestination] = useState("all");
  const [isImageOpen, setIsImageOpen] = useState(false);
const [selectedImage, setSelectedImage] = useState<string | null>(null);

const openImageDialog = (imageUrl: string) => {
  setSelectedImage(imageUrl);
  setIsImageOpen(true);
};

const closeImageDialog = () => {
  setSelectedImage(null);
  setIsImageOpen(false);
};

  const canCreate = hasPermission("createDestinationsCollectionsMenu");
  const canEdit = hasPermission("editDestinationsCollectionsMenu");
  const canDelete = hasPermission("deleteDestinationsCollectionsMenu");
  const canToggleStatus = hasPermission(
    "DestinationsCollectionsMenuStatusChange"
  );

  const [selectedCollection, setSelectedCollection] =
    useState<DiscoverDestinationCollection | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMultiple, setSelectedMultiple] = useState<
    DiscoverDestinationCollection[]
  >([]);
  const [isMultipleDeleteDialogOpen, setIsMultipleDeleteDialogOpen] =
    useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchCollections = useCallback(async () => {
    setIsLoading(true);
    try {
      let response;

      if (selectedDestination !== "all") {
        response = await apiService<{
          success: boolean;
          data: DiscoverDestinationCollection[];
        }>(
          `/discover-destination-collections/by-discover/${selectedDestination}`,
          {
            params: {
              search: searchTerm || undefined, // 🔎 include search param here
            },
          }
        );

        if (response.success) {
          setCollections(response.data);
          setTotalItems(response.data.length);
          setTotalPages(1);
          setCurrentPage(1);
        } else {
          throw new Error("Failed to load collections by destination");
        }
      } else {
        response = await apiService<
          PaginatedResponse<DiscoverDestinationCollection>
        >("/discover-destination-collections", {
          params: {
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            search: searchTerm || undefined,
            is_active:
              statusFilter !== "all" ? statusFilter === "active" : undefined,
          },
        });

        if (response.success) {
          setCollections(response.data);
          setTotalItems(response.pagination.total);
          setTotalPages(response.pagination.pages);
          setCurrentPage(response.pagination.current);
        } else {
          throw new Error("Failed to load collections");
        }
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, currentPage, searchTerm, statusFilter, selectedDestination]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const fetchDestinations = useCallback(async () => {
    try {
      const res = await apiService<{
        success: boolean;
        data: DiscoverDestination[];
      }>("/discover-destinations/all");
      if (res.success) {
        setDestinations(res.data);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load destinations.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  const toggleSelectOne = (collection: DiscoverDestinationCollection) => {
    setSelectedMultiple((prev) =>
      prev.some((n) => n._id === collection._id)
        ? prev.filter((n) => n._id !== collection._id)
        : [...prev, collection]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMultiple.length === collections.length) {
      setSelectedMultiple([]);
    } else {
      setSelectedMultiple(collections);
    }
  };

  const openEditDialog = (collection: DiscoverDestinationCollection) => {
    setSelectedCollection(collection);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (collection: DiscoverDestinationCollection) => {
    setSelectedCollection(collection);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = () => {
    fetchCollections();
    setSelectedCollection(null);
    setIsDeleteDialogOpen(false);
  };

  const handleMultipleDeleteSuccess = () => {
    fetchCollections();
    setSelectedMultiple([]);
    setIsMultipleDeleteDialogOpen(false);
  };

  const handleToggleStatus = async (
    collection: DiscoverDestinationCollection
  ) => {
    const newStatus = !collection.is_active;

    setCollections((prev) =>
      prev.map((item) =>
        item._id === collection._id ? { ...item, is_active: newStatus } : item
      )
    );

    try {
      const response = await apiService<{
        success: boolean;
        data: Partial<DiscoverDestinationCollection>;
      }>(`/discover-destination-collections/${collection._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (!response.success) throw new Error("Failed to update status");

      setCollections((prev) =>
        prev.map((item) =>
          item._id === collection._id
            ? {
                ...item,
                ...response.data,
                discover_destinations: item.discover_destinations,
              }
            : item
        )
      );

      toast({
        title: "Success",
        description: `Collection has been ${
          newStatus ? "activated" : "deactivated"
        }.`,
      });
    } catch (error: any) {
      setCollections((prev) =>
        prev.map((item) =>
          item._id === collection._id
            ? { ...item, is_active: collection.is_active }
            : item
        )
      );
      toast({
        title: "Error",
        description: error.message || "Could not update status",
        variant: "destructive",
      });
    }
  };

  return (
    <ProtectedPage requiredPermission="viewDestinationsCollectionsMenu">
      <PageHeader
        title="Discover Destination Collections"
        description="Manage all discover destination collections"
        actionButtons={
          <div className="flex gap-2">
            {selectedMultiple.length > 0 && canDelete && (
              <Button
                variant="destructive"
                onClick={() => setIsMultipleDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
              </Button>
            )}
            {canCreate && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Collection
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search collections by title"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8 w-full"
          />
        </div>
        <div className="flex flex-row gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="mr-2 h-4 w-4" /> Filter by Status
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-0">
              <div className="p-2">
                <Label htmlFor="status-filter" className="text-sm font-medium">
                  Status
                </Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger id="status-filter" className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="mr-2 h-4 w-4" /> Filter by Destination
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-0">
              <div className="p-2">
                <Label
                  htmlFor="destination-filter"
                  className="text-sm font-medium"
                >
                  Discover Destination
                </Label>
                <Select
                  value={selectedDestination}
                  onValueChange={(value) => {
                    setSelectedDestination(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger id="destination-filter" className="mt-1">
                    <SelectValue placeholder="All Destinations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {destinations.map((destination) => (
                      <SelectItem key={destination._id} value={destination._id}>
                        {destination.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {canDelete && (
                <TableHead>
                  <input
                    type="checkbox"
                    checked={selectedMultiple.length === collections.length}
                    onChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Discover Destinations</TableHead>
              {canToggleStatus && <TableHead>Status</TableHead>}
              <TableHead>Created Date</TableHead>
              {(canEdit || canDelete) && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: ITEMS_PER_PAGE }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`}>
                  {canDelete && (
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                  )}
                  <TableCell>
                    <Skeleton className="h-12 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-64" />
                  </TableCell>
                  {canToggleStatus && (
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                  )}
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  {(canEdit || canDelete) && (
                    <TableCell>
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : collections.length > 0 ? (
              collections.map((col) => {
                const isSelected = selectedMultiple.some(
                  (n) => n._id === col._id
                );
                return (
                  <TableRow key={col._id}>
                    {canDelete && (
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(col)}
                        />
                      </TableCell>
                    )}
                   <TableCell>
  {col.image ? (
    <img
      src={col.image}
      alt={col.title}
      className="h-12 w-12 object-cover rounded cursor-pointer"
      onClick={() => openImageDialog(col.image)}
    />
  ) : (
    <span className="italic text-muted-foreground text-sm">
      No image
    </span>
  )}
</TableCell>

                    <TableCell>{col.title}</TableCell>
                    <TableCell>
                      {Array.isArray(col.discover_destinations) &&
                      col.discover_destinations.length > 0
                        ? (col.discover_destinations as any[])
                            .map((d: any) => d.title)
                            .join(", ")
                        : "-"}
                    </TableCell>

                    {canToggleStatus && (
                      <TableCell>
                        <Switch
                          checked={col.is_active}
                          onCheckedChange={() => handleToggleStatus(col)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <ClientFormattedDate
                        dateInput={col.createdAt}
                        formatString="MMM d, yyyy"
                      />
                    </TableCell>
                    {(canEdit || canDelete) && (
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
                                onClick={() => openEditDialog(col)}
                              >
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(col)}
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
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-4"
                >
                  No destination collections found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
       <Dialog open={isImageOpen} onOpenChange={closeImageDialog}>
  <DialogContent className="max-w-5xl w-full p-4">
    <DialogHeader>
      <DialogTitle>Image Preview</DialogTitle>
    </DialogHeader>
    <div className="flex justify-center items-center">
      {selectedImage && (
        <img 
          src={selectedImage} 
          alt="Preview" 
          className="max-h-[80vh] max-w-full object-contain rounded"
        />
      )}
    </div>
  </DialogContent>
</Dialog>


      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {canCreate && (
        <CreateDiscoverDestinationCollectionDialog
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={fetchCollections}
          destinations={destinations}
        />
      )}
      {selectedCollection && (
        <>
          {canEdit && (
            <EditDiscoverDestinationCollectionDialog
              isOpen={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
              id={selectedCollection?._id ?? null}
              onSuccess={fetchCollections}
              destinations={destinations}
            />
          )}
          {canDelete && (
            <DeleteDiscoverDestinationCollectionDialog
              isOpen={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
              id={selectedCollection?._id ?? null}
              onSuccess={handleDeleteSuccess}
            />
          )}
        </>
      )}

      {selectedMultiple.length > 0 && canDelete && (
        <MultiDeleteDiscoverDestinationCollectionDialog
          isOpen={isMultipleDeleteDialogOpen}
          onOpenChange={setIsMultipleDeleteDialogOpen}
          ids={selectedMultiple.map((n) => n._id)}
          onSuccess={handleMultipleDeleteSuccess}
        />
      )}
    </ProtectedPage>
  );
}
