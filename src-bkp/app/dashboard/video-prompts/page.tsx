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
  Filter,
  Search,
  Video,
} from "lucide-react";
import apiService from "@/lib/apiService";
import type {
  PaginatedResponse,
  VideoPrompt,
  SingleResponse,
  ImageStyle,
} from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import DeleteVideoPromptDialog from "@/components/dashboard/video-prompts/DeleteVideoPromptDialog";
import MultipleDeleteVideoPromptDialog from "@/components/dashboard/video-prompts/MultipleDeleteVideoPromptDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ITEMS_PER_PAGE = 10;

export default function VideoPromptsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const [data, setData] = useState<VideoPrompt[]>([]);
  const [styles, setStyles] = useState<ImageStyle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string>("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VideoPrompt | null>(null);
  const [selectedItems, setSelectedItems] = useState<
    { id: string; name: string }[]
  >([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  // Permissions
  const canManage = hasPermission("viewVideoPromptMenu");
  const canCreate = hasPermission("createVideoPromptMenu");
  const canEdit = hasPermission("editVideoPromptMenu");
  const canDelete = hasPermission("deleteVideoPromptMenu");
  const canManageStatus = hasPermission("videoPromptMenuStatusChange");

  // Fetch Styles for Filter
  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const res =
          await apiService<SingleResponse<ImageStyle[]>>("/image-styles/all/video/admin");
        if (res.success) setStyles(res.data);
      } catch (error) {
        console.error("Failed to fetch styles");
      }
    };
    if (canManage) fetchStyles();
  }, [canManage]);

  // Fetch Data (Video Prompts)
  const fetchData = useCallback(
    async (page = 1, styleId = "all", search = "") => {
      setIsLoading(true);
      try {
        const params: any = {
          page,
          limit: ITEMS_PER_PAGE,
          search: search,
        };

        if (styleId !== "all") params.style = styleId;

        const response = await apiService<PaginatedResponse<VideoPrompt>>(
          "/video-prompts",
          { params },
        );

        if (response.success) {
          setData(response.data);
          setCurrentPage(response.pagination.current);
          setTotalPages(response.pagination.pages);
          setTotalItems(response.pagination.total);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to fetch data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  // Trigger fetch when dependencies change
  useEffect(() => {
    if (canManage) {
      const timer = setTimeout(() => {
        fetchData(currentPage, selectedStyle, searchTerm);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [currentPage, selectedStyle, searchTerm, fetchData, canManage]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === data.length) setSelectedItems([]);
    else
      setSelectedItems(
        data.map((item) => ({ id: item._id, name: "Video Prompt" })),
      );
  };

  const toggleSelectOne = (id: string) => {
    const isSelected = selectedItems.some((i) => i.id === id);
    if (isSelected) setSelectedItems((prev) => prev.filter((i) => i.id !== id));
    else setSelectedItems((prev) => [...prev, { id, name: "Video Prompt" }]);
  };

  const handleToggleStatus = async (prompt: VideoPrompt) => {
    if (!canManageStatus) return;
    try {
      const response = await apiService<SingleResponse<{ is_active: boolean }>>(
        `/video-prompts/${prompt._id}/toggle`,
        { method: "PATCH" }
      );
      if (response.success) {
        toast({ title: "Success", description: "Status updated." });
        setData((prev) =>
          prev.map((item) =>
            item._id === prompt._id
              ? { ...item, is_active: response.data.is_active }
              : item
          )
        );
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <ProtectedPage requiredPermission="viewVideoPromptMenu">
      <PageHeader
        title="Video Prompts"
        description="Manage your AI video generation prompts."
        actionButtons={
          canCreate && (
            <Button
              onClick={() => router.push("/dashboard/video-prompts/create")}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Create New
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-8"
            />
          </div>

          <div className="w-full md:w-[200px]">
            <Select
              value={selectedStyle}
              onValueChange={(val) => {
                setSelectedStyle(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by Style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Styles</SelectItem>
                {styles.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
                      selectedItems.length === data.length && data.length > 0
                    }
                    onChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>Thumbnail</TableHead>
              <TableHead>Style</TableHead>
              <TableHead className="hidden md:table-cell">Short Prompt</TableHead>
              {/* <TableHead className="hidden lg:table-cell">Full Prompt</TableHead> */}
              <TableHead>Video</TableHead>
              <TableHead className="text-center">Active</TableHead>
              {(canEdit || canDelete) && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-16 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : data.length > 0 ? (
              data.map((item) => (
                <TableRow key={item._id}>
                  {canDelete && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedItems.some((i) => i.id === item._id)}
                        onChange={() => toggleSelectOne(item._id)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <img
                      src={item.image}
                      alt="Thumbnail"
                      className="h-16 w-16 rounded object-contain border bg-muted/30"
                    />
                  </TableCell>
                  <TableCell>
                    {typeof item.style === "object"
                      ? item.style.name
                      : "Unknown"}
                  </TableCell>
                  <TableCell
                    className="hidden md:table-cell max-w-[150px] truncate text-sm"
                    title={item.short_video_prompt}
                  >
                    {item.short_video_prompt}
                  </TableCell>
                  {/* <TableCell
                    className="hidden lg:table-cell max-w-[200px] truncate text-muted-foreground text-sm"
                    title={item.video_prompt}
                  >
                    {item.video_prompt}
                  </TableCell> */}
                  <TableCell>
                    <a href={item.video} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-500 hover:underline">
                      <Video className="mr-1 h-3 w-3" /> Source
                    </a>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={() => handleToggleStatus(item)}
                      disabled={!canManageStatus}
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
                                router.push(
                                  `/dashboard/video-prompts/${item._id}/edit`,
                                )
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedItem(item);
                                setIsDeleteDialogOpen(true);
                              }}
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
                <TableCell colSpan={7} className="text-center h-24">
                  No video prompts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalItems > ITEMS_PER_PAGE && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems}{" "}
            prompts
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

      {canDelete && selectedItem && (
        <DeleteVideoPromptDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          prompt={selectedItem}
          onSuccess={() => fetchData(currentPage, selectedStyle, searchTerm)}
        />
      )}
      {canDelete && selectedItems.length > 0 && (
        <MultipleDeleteVideoPromptDialog
          isOpen={isBulkDeleteDialogOpen}
          onOpenChange={setIsBulkDeleteDialogOpen}
          prompts={selectedItems}
          onSuccess={() => {
            fetchData(currentPage, selectedStyle, searchTerm);
            setSelectedItems([]);
          }}
        />
      )}
    </ProtectedPage>
  );
}
