"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import apiService from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";

import type { Tab } from "@/types";
import CreateTabDialog from "@/components/dashboard/tabs/CreateTabDialog";
import EditTabDialog from "@/components/dashboard/tabs/EditTabDialog";
import DeleteTabDialog from "@/components/dashboard/tabs/DeleteTabDialog";
import MultiDeleteTabDialog from "@/components/dashboard/tabs/MultiDeleteTabDialog";
import ProtectedPage from "@/components/shared/ProtectedPage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

const ITEMS_PER_PAGE = 10;

export default function TabsPage() {
  const { hasPermission } = useAuth();

  const [tabs, setTabs] = useState<Tab[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTabs, setSelectedTabs] = useState<Tab[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTab, setEditTab] = useState<Tab | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTab, setDeleteTab] = useState<Tab | null>(null);
  const [isMultiDeleteOpen, setIsMultiDeleteOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMultiple, setSelectedMultiple] = useState<Tab[]>([]);

  const canEdit = hasPermission("editRecipesToolsMenu");

  const { toast } = useToast();

  const fetchTabs = async () => {
    setIsLoading(true);
    try {
      const res = await apiService<{ success: boolean; data: Tab[] }>("/tabs", {
        params: { search: searchTerm },
      });

      // Check if res is not null
      if (res && res.success) {
        setTabs(res.data);
        setTotalItems(res.data.length);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (err) {
      toast({ title: "Error fetching tabs", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchTabs();
  }, [searchTerm]);

  const handleEdit = (tab: Tab) => {
    setEditTab(tab);
    setIsEditOpen(true);
  };

  const handleDelete = (tab: Tab) => {
    setDeleteTab(tab);
    setIsDeleteOpen(true);
  };

  const toggleSelectOne = (collection: Tab) => {
    setSelectedMultiple((prev) =>
      prev.some((n) => n._id === collection._id)
        ? prev.filter((n) => n._id !== collection._id)
        : [...prev, collection]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMultiple.length === tabs.length) {
      setSelectedMultiple([]);
    } else {
      setSelectedMultiple(tabs);
    }
  };

  return (
    <ProtectedPage requiredPermission="viewRecipesToolsMenu">
      <PageHeader
        title="Recipes Tools Management"
        description="Manage all recipes tools: create, edit, or delete them as needed."
        actionButtons={
          <div className="flex gap-2">
            {/* {selectedMultiple.length > 0 && canDelete && (
              <Button
                variant="destructive"
                onClick={() => setIsMultiDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
              </Button>
            )} */}
            {/* {canCreate && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Tabs
              </Button>
            )} */}
          </div>
        }
      />

      <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search Tabs..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8 w-full"
          />
        </div>
      </div>

      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {/* {canDelete && (
                <TableHead>
                  <input
                    type="checkbox"
                    checked={selectedMultiple.length === tabs.length}
                    onChange={toggleSelectAll}
                  />
                </TableHead>
              )} */}
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Fields</TableHead>
              {canEdit && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: ITEMS_PER_PAGE }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`}>
                  {/* {canDelete && (
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                  )} */}
                  <TableCell>
                    <Skeleton className="h-12 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <Skeleton className="h-5 w-64" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : tabs.length > 0 ? (
              tabs.map((tab) => {
                const isSelected = selectedMultiple.some(
                  (n) => n._id === tab._id
                );
                return (
                  <TableRow key={tab._id}>
                    {/* {canDelete && (
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(tab)}
                        />
                      </TableCell>
                    )} */}
                    <TableCell>{tab.title}</TableCell>
                    <TableCell>
                     <div dangerouslySetInnerHTML={{ __html: tab.description?.trim() || "" }} />

                    </TableCell>

                    <TableCell>
                      {tab.fields.map((f) => (
                        <div key={f.key}>
                          <strong>{f.label}</strong> ({f.type})
                        </div>
                      ))}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEdit && (
                              <DropdownMenuItem onClick={() => handleEdit(tab)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                            )}
                            {/* {canDelete && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(tab)}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            )} */}
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
                  No recipe collections found.
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

      {/* Dialogs */}
      {/* {canCreate && (
        <CreateTabDialog
          isOpen={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSuccess={fetchTabs}
        />
      )} */}
      {editTab && canEdit && (
        <EditTabDialog
          isOpen={isEditOpen}
          onOpenChange={setIsEditOpen}
          id={editTab?._id || null}
          onSuccess={fetchTabs}
        />
      )}
      {/* {canDelete && (
        <>
          {deleteTab && (
            <DeleteTabDialog
              isOpen={isDeleteOpen}
              onOpenChange={setIsDeleteOpen}
              id={deleteTab._id || null}
              onSuccess={fetchTabs}
            />
          )}
          {selectedMultiple.length > 0 && (
            <MultiDeleteTabDialog
              isOpen={isMultiDeleteOpen}
              onOpenChange={setIsMultiDeleteOpen}
              ids={selectedMultiple.map((tab) => tab._id)}
              onSuccess={fetchTabs}
            />
          )}
        </>
      )} */}
    </ProtectedPage>
  );
}
