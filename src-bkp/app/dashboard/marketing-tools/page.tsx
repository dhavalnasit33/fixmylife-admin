"use client";
MarketingToolsPage
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import apiService from "@/lib/apiService";
import type {
  MarketingCategory,
  MarketingTool,
  PaginatedResponse,
  SingleResponse,
} from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import MarketingDeleteToolDialog from "@/components/dashboard/marketing-tools/MarketingDeleteToolDialog";
import MultipleDeleteMarketingCategoryDialog from "@/components/dashboard/marketing-categories/MultipleDeleteMarketingCategoryDialog";
import MultipleDeleteMarketingToolDialog from "@/components/dashboard/marketing-tools/MultipleDeleteMarketingToolDialog";

const ITEMS_PER_PAGE = 10;

export default function MarketingToolsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [tools, setTools] = useState<MarketingTool[]>([]);
  const [toolCategories, setToolCategories] = useState<
    (MarketingCategory & { level?: number })[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | undefined
  >(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<MarketingTool | null>(null);
  const [selectedTools, setSelectedTools] = useState<
    { id: String; name: String }[]
  >([]);
  const [isMultipleToolRemoveDialogOpen, setIsMultipleToolRemoveDialogOpen] =
    useState(false);

  const canManageTools = hasPermission("viewMarketingToolsMenu");
  const canCreateNewTools = hasPermission("createMarketingTools");
  const canEditToolManagement = hasPermission("editMarketingTools");
  const canDeleteToolManagement = hasPermission("deleteMarketingTools");
  const canManageToolStatus = hasPermission("marketingToolsStatusChange");

  const fetchToolCategories = useCallback(async () => {
    try {
      const response = await apiService<PaginatedResponse<MarketingCategory>>(
        "/marketing-categories",
        { params: { limit: 1000, is_active: true } }
      );

      if (response.success) {
        interface CategoryNode extends MarketingCategory {
          children?: CategoryNode[];
          level?: number;
        }

        const categoryMap = new Map<string, CategoryNode>();

        // Step 1: Map all categories
        response.data.forEach((cat) => {
          categoryMap.set(cat._id, { ...cat, children: [], level: 0 });
        });

        const roots: CategoryNode[] = [];

        // Step 2: Build tree
        categoryMap.forEach((cat) => {
          const parentId =
            typeof cat.parent === "object" && cat.parent !== null
              ? cat.parent._id
              : typeof cat.parent === "string"
              ? cat.parent
              : null;

          if (parentId && categoryMap.has(parentId)) {
            const parent = categoryMap.get(parentId)!;
            cat.level = (parent.level || 0) + 1;
            parent.children!.push(cat);
          } else {
            cat.level = 0;
            roots.push(cat);
          }
        });

        // Step 3: Flatten tree
        const orderedCategories: CategoryNode[] = [];

        const traverse = (node: CategoryNode) => {
          orderedCategories.push(node);
          node.children?.forEach((child) => traverse(child));
        };

        roots.forEach((root) => traverse(root));

        setToolCategories(orderedCategories);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch tool categories for filter.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message ||
          "An unexpected error occurred while fetching categories.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    if (canManageTools) {
      fetchToolCategories();
    }
  }, [fetchToolCategories, canManageTools]);

  const fetchTools = useCallback(
    async (page = 1, search = "", categoryId = "") => {
      setIsLoading(true);
      try {
        const params: Record<string, string | number | boolean | undefined> = {
          page,
          limit: ITEMS_PER_PAGE,
        };
        if (search) params.search = search;
        if (categoryId) params.category_id = categoryId;

        const response = await apiService<PaginatedResponse<MarketingTool>>("/marketing-tools/admin", {
          params,
        });
        if (response.success) {
          setTools(response.data);
          // setCurrentPage(response.pagination.current);
          setTotalPages(response.pagination.pages);
          setTotalItems(response.pagination.total);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch tools.",
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

  const handelMultipleToolRemoveSuccess = () => {
    fetchTools(
      tools.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage,
      searchTerm,
      selectedCategoryId
    );
    setIsMultipleToolRemoveDialogOpen(false);
    setSelectedTools([]);
  };

  const onToolDeleted = () => {
    fetchTools(
      tools.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage,
      searchTerm,
      selectedCategoryId
    );
    setIsDeleteDialogOpen(false);
    setSelectedTool(null);
  };

  useEffect(() => {
    if (canManageTools) {
      fetchTools(currentPage, searchTerm, selectedCategoryId);
    } else {
      setIsLoading(false);
      setTools([]);
    }
  }, [currentPage, searchTerm, selectedCategoryId, fetchTools, canManageTools]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId === "all" ? undefined : categoryId);
    setCurrentPage(1);
  };

  const handleToggleActive = async (tool: MarketingTool) => {
    if (!canManageTools && !canManageToolStatus) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to edit tools.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await apiService<SingleResponse<{ is_active: boolean }>>(
        `/marketing-tools/${tool._id}/toggle`,
        {
          method: "PATCH",
        }
      );
      if (response.success) {
        toast({
          title: "Success",
          description: `Tool ${tool.name} status updated.`,
        });
        setTools((prev) =>
          prev.map((t) =>
            t._id === tool._id
              ? { ...t, is_active: response.data.is_active }
              : t
          )
        );
      } else {
        toast({
          title: "Error",
          description: `Failed to update ${tool.name} status.`,
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

  const handleTogglePopular = async (tool: MarketingTool) => {
  if (!canManageTools) {
    toast({
      title: "Permission Denied",
      description: "You do not have permission to edit tools.",
      variant: "destructive",
    });
    return;
  }

  try {
    const response = await apiService<SingleResponse<{ is_popular: boolean }>>(
      `/marketing-tools/${tool._id}/toggle-popular`,
      {
        method: "PATCH",
      }
    );

    if (response.success) {
      toast({
        title: "Success",
        description: `Tool ${tool.name} popular status updated.`,
      });

      setTools((prev) =>
        prev.map((t) =>
          t._id === tool._id ? { ...t, is_popular: response.data.is_popular } : t
        )
      );
    } else {
      toast({
        title: "Error",
        description: `Failed to update ${tool.name} popular status.`,
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


  const openDeleteDialog = (tool: MarketingTool) => {
    if (!canManageTools && !canDeleteToolManagement) return;
    setSelectedTool(tool);
    setIsDeleteDialogOpen(true);
  };


  const openMultipleToolRemoveDialog = () => {
    if (!canManageTools) return;
    setIsMultipleToolRemoveDialogOpen(true);
  };
  const toggleSelectAll = () => {
    if (selectedTools.length == tools.length) {
      setSelectedTools([]);
    } else {
      setSelectedTools(
        tools.map((tool) => ({ id: tool._id, name: tool.name }))
      );
    }
  };

  const toggleSelectOne = (id: String) => {
    const tool = tools.find((tool) => tool._id === id);

    setSelectedTools((prev) =>
      prev.find((u) => u.id === id)
        ? prev.filter((u) => u.id !== id)
        : tool
        ? [...prev, { id: tool._id, name: tool.name }]
        : prev
    );
  };

  return (
    <ProtectedPage requiredPermission="viewMarketingToolsMenu">
      <PageHeader
        title="Marketing Tools Management"
        description="Create, configure, and manage AI Marketing tools."
        actionButtons={
          canManageTools &&
          canCreateNewTools && (
            <Button onClick={() => router.push("/dashboard/marketing-tools/create")}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Marketing New Tool
              {!toolCategories.length && (
                <span className="ml-2 text-xs">(Create a category first)</span>
              )}
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search Marketing tools by name/description..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-8 w-full"
          />
        </div>
        <div className="flex flex-row gap-2 items-center">
          {canDeleteToolManagement && (
            <Button
              variant="destructive"
              onClick={openMultipleToolRemoveDialog}
              disabled={selectedTools.length <= 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Marketing Tools
            </Button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="mr-2 h-4 w-4" /> Filter by Marketing Category
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-0">
              <div className="p-2">
                <Label
                  htmlFor="category-filter"
                  className="text-sm font-medium"
                >
                  Category
                </Label>
                <Select
                  value={selectedCategoryId || "all"}
                  onValueChange={handleCategoryFilterChange}
                >
                  <SelectTrigger id="category-filter" className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {toolCategories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        <div
                          style={{
                            paddingLeft: `${(category.level ?? 0) * 16}px`,
                          }}
                        >
                          {`${
                            category.level
                              ? "└" + "─ ".repeat(category.level)
                              : ""
                          }${category.name}`}
                        </div>
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
              {canDeleteToolManagement && (
                <TableHead className="w-[40px]">
                  <input
                    type="checkbox"
                    checked={
                      selectedTools.length === tools.length && tools.length > 0
                    }
                    onChange={toggleSelectAll}
                    aria-label="Select all Tools"
                  />
                </TableHead>
              )}
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
           
              {canManageTools && canManageToolStatus && (
  <>
    <TableHead className="text-center">Active</TableHead>
    <TableHead className="text-center">Popular</TableHead>
  </>
)}

              {canManageTools &&
                (canEditToolManagement || canDeleteToolManagement) && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <TableRow key={`skeleton-tool-${i}`}>
                  {canDeleteToolManagement && (
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                  )}
                  <TableCell className="text-center">
                    <Skeleton className="h-5 w-10 mx-auto" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-center">
                    <Skeleton className="h-5 w-12 mx-auto" />
                  </TableCell>
                  {canManageTools && canManageToolStatus && (
                    <TableCell className="text-center">
                      <Skeleton className="h-5 w-10 mx-auto" />
                        <Skeleton className="h-5 w-10 mx-auto" />
                    </TableCell>
                  )}
                  {canManageTools &&
                    (canEditToolManagement || canDeleteToolManagement) && (
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    )}
                </TableRow>
              ))
            ) : tools.length > 0 ? (
              tools.map((tool) => {
                const isChecked = selectedTools.some(
                  (selectedtool) => selectedtool.id === tool._id
                );
                return (
                  <TableRow key={tool._id}>
                    {canDeleteToolManagement && (
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(tool._id)}
                          aria-label={`Select tool ${tool.name}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      <div>{tool.name}</div>
                      <div className="text-xs text-muted-foreground md:hidden">
                        {tool.category_id?.name || "Uncategorized"}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {(() => {
                        const categoryId = tool.category_id;

                        // Handle null or undefined
                        if (!categoryId) {
                          return "Uncategorized";
                        }

                        // Handle array of strings or objects
                        if (Array.isArray(categoryId)) {
                          const categoryNames = categoryId
                            .map((item, index) => {
                              const catId =
                                typeof item === "string"
                                  ? item
                                  : typeof item === "object" && item !== null
                                  ? item._id
                                  : "";

                              const category = toolCategories.find(
                                (c) => c._id === catId
                              );
                              return category ? (
                                <span key={catId}>
                                  {category.name}
                                  {index < categoryId.length - 1 ? ", " : ""}
                                </span>
                              ) : null;
                            })
                            .filter(Boolean);

                          return categoryNames.length > 0
                            ? categoryNames
                            : "Uncategorized";
                        }

                        // Handle single object
                        if (typeof categoryId === "object") {
                          return categoryId.name || "Uncategorized";
                        }

                        // Handle single string ID
                        if (typeof categoryId === "string") {
                          const category = toolCategories.find(
                            (c) => c._id === categoryId
                          );
                          return category ? category.name : "Uncategorized";
                        }

                        return "Uncategorized";
                      })()}
                    </TableCell>

                   
                    {canManageTools && canManageToolStatus && (
  <>
    <TableCell className="text-center">
      <Switch
        checked={tool.is_active}
        onCheckedChange={() => handleToggleActive(tool)}
        aria-label={`Toggle ${tool.name} status`}
        disabled={!canManageTools}
      />
    </TableCell>

    <TableCell className="text-center">
      <Switch
        checked={tool.is_popular}
        onCheckedChange={() => handleTogglePopular(tool)}
        aria-label={`Toggle ${tool.name} popular status`}
        disabled={!canManageTools}
      />
    </TableCell>
  </>
)}

                    {canManageTools &&
                      (canDeleteToolManagement || canEditToolManagement) && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={!canManageTools}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">
                                  Actions for {tool.name}
                                </span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canEditToolManagement && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/marketing-tools/${tool._id}/edit`
                                    )
                                  }
                                  disabled={!canManageTools}
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                              )}
                              {canDeleteToolManagement && (
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(tool)}
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                  disabled={!canManageTools}
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
                  colSpan={canManageTools ? 10 : 4}
                  className="text-center h-24"
                >
                  No marketing tools found. Try adjusting filters or creating a new marketing tool.
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
      
            {canManageTools && selectedTool && (
              <>
  
                <MarketingDeleteToolDialog
                  isOpen={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                  tool={selectedTool}
                  onSuccess={onToolDeleted}
                />
              </>
            )}
      
            {canManageTools && selectedTools && (
              <MultipleDeleteMarketingToolDialog
                isOpen={isMultipleToolRemoveDialogOpen}
                onOpenChange={setIsMultipleToolRemoveDialogOpen}
                tool={selectedTools}
                onSuccess={handelMultipleToolRemoveSuccess}
              />
            )}
    </ProtectedPage>
  );
}
