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

import type { DestinationTool } from "@/types"; // <-- create DestinationTool type in your types file
import ProtectedPage from "@/components/shared/ProtectedPage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import CreateDestinationToolDialog from "@/components/dashboard/destination-tool/CreateDestinationToolDialog";
import EditDestinationToolDialog from "@/components/dashboard/destination-tool/EditDestinationToolDialog";
import DeleteDestinationToolDialog from "@/components/dashboard/destination-tool/DeleteDestinationToolDialog";
import MultiDeleteDestinationToolDialog from "@/components/dashboard/destination-tool/MultiDeleteDestinationToolDialog";

const ITEMS_PER_PAGE = 10;

export default function DestinationToolsPage() {
  const { hasPermission } = useAuth();

  const [tools, setTools] = useState<DestinationTool[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMultiple, setSelectedMultiple] = useState<DestinationTool[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTool, setEditTool] = useState<DestinationTool | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTool, setDeleteTool] = useState<DestinationTool | null>(null);
  const [isMultiDeleteOpen, setIsMultiDeleteOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

 
  const canEdit = hasPermission("editDestinationsToolsMenu");
  
  const { toast } = useToast();

  const fetchTools = async () => {
    setIsLoading(true);
    try {
      const res = await apiService<{ success: boolean; data: DestinationTool[] }>(
        "/destination-tools",
        { params: { search: searchTerm } }
      );

      if (res && res.success) {
        setTools(res.data);
        setTotalItems(res.data.length);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (err) {
      toast({ title: "Error fetching destination tools", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, [searchTerm]);

  const handleEdit = (tool: DestinationTool) => {
    setEditTool(tool);
    setIsEditOpen(true);
  };

  const handleDelete = (tool: DestinationTool) => {
    setDeleteTool(tool);
    setIsDeleteOpen(true);
  };

  const toggleSelectOne = (tool: DestinationTool) => {
    setSelectedMultiple((prev) =>
      prev.some((n) => n._id === tool._id)
        ? prev.filter((n) => n._id !== tool._id)
        : [...prev, tool]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMultiple.length === tools.length) {
      setSelectedMultiple([]);
    } else {
      setSelectedMultiple(tools);
    }
  };

  return (
    <ProtectedPage requiredPermission="viewDestinationsToolsMenu">
      <PageHeader
        title="Destination Tools Management"
        description="Manage all destination tools: create, edit, or delete them as needed."
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
                <Plus className="mr-2 h-4 w-4" /> Add Destination Tool
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
            placeholder="Search Destination Tools..."
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
                    checked={selectedMultiple.length === tools.length}
                    onChange={toggleSelectAll}
                  />
                </TableHead>
              )} */}
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Fields</TableHead>
              {(canEdit) && <TableHead>Actions</TableHead>}
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
                  {(canEdit) && (
                    <TableCell>
                      <Skeleton className="h-5 w-64" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : tools.length > 0 ? (
              tools.map((tool) => {
                const isSelected = selectedMultiple.some(
                  (n) => n._id === tool._id
                );
                return (
                  <TableRow key={tool._id}>
                    {/* {canDelete && (
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(tool)}
                        />
                      </TableCell>
                    )} */}
                    <TableCell>{tool.title}</TableCell>
                    <TableCell>
                    
                      <div dangerouslySetInnerHTML={{ __html: tool.description?.trim() || "" }} />
                    </TableCell>
                  
                    <TableCell>
                      {tool.fields.map((f) => (
                        <div key={f.key}>
                          <strong>{f.label}</strong> ({f.type})
                        </div>
                      ))}
                    </TableCell>
                    {(canEdit) && (
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
                              <DropdownMenuItem onClick={() => handleEdit(tool)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                            )}
                            {/* {canDelete && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(tool)}
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
                  No destination tools found.
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
        <CreateDestinationToolDialog
          isOpen={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSuccess={fetchTools}
        />
      )} */}
      {editTool && canEdit && (
        <EditDestinationToolDialog
          isOpen={isEditOpen}
          onOpenChange={setIsEditOpen}
          id={editTool?._id || null}
          onSuccess={fetchTools}
        />
      )}
      {/* {canDelete && (
        <>
          {deleteTool && (
            <DeleteDestinationToolDialog
              isOpen={isDeleteOpen}
              onOpenChange={setIsDeleteOpen}
              id={deleteTool._id || null}
              onSuccess={fetchTools}
            />
          )}
          {selectedMultiple.length > 0 && (
            <MultiDeleteDestinationToolDialog
              isOpen={isMultiDeleteOpen}
              onOpenChange={setIsMultiDeleteOpen}
              ids={selectedMultiple.map((tool) => tool._id)}
              onSuccess={fetchTools}
            />
          )}
        </>
      )} */}
    </ProtectedPage>
  );
}
