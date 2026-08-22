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
import type { TrendingNews, PaginatedResponse, NewsCategory } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import ClientFormattedDate from "@/components/shared/ClientFormattedDate";

import CreateTrendingNewsDialog from "@/components/dashboard/trending-news/CreateTrendingNewsDialog";
import EditTrendingNewsDialog from "@/components/dashboard/trending-news/EditTrendingNewsDialog";
import DeleteTrendingNewsDialog from "@/components/dashboard/trending-news/DeleteTrendingNewsDialog";
import MultiDeleteTrendingNewsDialog from "@/components/dashboard/trending-news/MultiDeleteTrendingNewsDialog";
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

const ITEMS_PER_PAGE = 10;

export default function TrendingNewsPage() {
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const [newsList, setNewsList] = useState<TrendingNews[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  // const canViewNewsMenu = hasPermission('viewNewsMenu');
  const canCreateNewsMenu = hasPermission('createNewNewsMenu');
  const canEditNewsMenu = hasPermission('editNewsMenu');
  const canDeleteNewsMenu = hasPermission('deleteNewsMenu');
  const canUpdateStatusNewsMenu = hasPermission('newsMenuStatusChange');

  const [selectedNews, setSelectedNews] = useState<TrendingNews | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMultiple, setSelectedMultiple] = useState<TrendingNews[]>([]);
  const [isMultipleDeleteDialogOpen, setIsMultipleDeleteDialogOpen] =
    useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [toolCategories, setToolCategories] = useState<NewsCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

  const fetchTrendingNews = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiService<PaginatedResponse<TrendingNews>>(
        "/trending-news",
        {
          params: {
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            search: searchTerm || undefined,
            category_id:
              selectedCategoryId !== "all" ? selectedCategoryId : undefined,
          },
        }
      );
      if (response.success) {
        setNewsList(response.data);
        setTotalItems(response.pagination.total);
        setTotalPages(response.pagination.pages);
        setCurrentPage(response.pagination.current);
      } else {
        toast({
          title: "Error",
          description: "Failed to load trending news.",
          variant: "destructive",
        });
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
  }, [toast, currentPage, searchTerm, selectedCategoryId]);

  useEffect(() => {
    fetchTrendingNews();
  }, [fetchTrendingNews]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiService<PaginatedResponse<NewsCategory>>(
          "/news-categories",
          {
            params: { limit: 1000, is_active: true },
          }
        );
        if (response.success) {
          setToolCategories(response.data);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch tool categories.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch tool categories.",
          variant: "destructive",
        });
      }
    };
    fetchCategories();
  }, [toast]);

  const toggleSelectOne = (news: TrendingNews) => {
    setSelectedMultiple((prev) =>
      prev.some((n) => n._id === news._id)
        ? prev.filter((n) => n._id !== news._id)
        : [...prev, news]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMultiple.length === newsList.length) {
      setSelectedMultiple([]);
    } else {
      setSelectedMultiple(newsList);
    }
  };

  const openEditDialog = (news: TrendingNews) => {
    setSelectedNews(news);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (news: TrendingNews) => {
    setSelectedNews(news);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = () => {
    fetchTrendingNews();
    setSelectedNews(null);
    setIsDeleteDialogOpen(false);
  };

  const handleMultipleDeleteSuccess = () => {
    fetchTrendingNews();
    setSelectedMultiple([]);
    setIsMultipleDeleteDialogOpen(false);
  };

  const handleCategoryFilterChange = (value: string) => {
    setSelectedCategoryId(value);
    setCurrentPage(1);
  };

  const handleToggleDisplayOnHome = async (news: TrendingNews) => {
    const newDisplayValue = !news.displayOnHomePage;

    // Optimistic update local state immediately
    setNewsList((prevList) =>
      prevList.map((item) =>
        item._id === news._id
          ? { ...item, displayOnHomePage: newDisplayValue }
          : item
      )
    );

    try {
      const response = await apiService<{
        success: boolean;
        data: TrendingNews;
      }>(`/trending-news/${news._id}/display`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayOnHomePage: newDisplayValue }),
      });

      if (!response.success) {
        throw new Error("Failed to update display status");
      } else {
        // Update with server response for accuracy
        setNewsList((prevList) =>
          prevList.map((item) => (item._id === news._id ? response.data : item))
        );
      }
    } catch (error: any) {
      // Revert UI on failure
      setNewsList((prevList) =>
        prevList.map((item) =>
          item._id === news._id
            ? { ...item, displayOnHomePage: news.displayOnHomePage }
            : item
        )
      );
      toast({
        title: "Error",
        description: error.message || "Could not update display status",
        variant: "destructive",
      });
    }
  };

  return (
    <ProtectedPage requiredPermission="viewNewsMenu">
      <PageHeader
        title="Trending News"
        description="Manage all trending news articles"
        actionButtons={
          <div className="flex gap-2">
            {selectedMultiple.length > 0 && canDeleteNewsMenu && (
              <Button
                variant="destructive"
                onClick={() => setIsMultipleDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
              </Button>
            )}
            {
              canCreateNewsMenu &&
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add News
              </Button>
            }
          </div>
        }
      />

      <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search news by title"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8 w-full"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="mr-2 h-4 w-4" /> Filter by Category
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60 p-0">
            <div className="p-2">
              <Label htmlFor="category-filter" className="text-sm font-medium">
                Category
              </Label>
              <Select
                value={selectedCategoryId}
                onValueChange={handleCategoryFilterChange}
              >
                <SelectTrigger id="category-filter" className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {toolCategories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      <span>
                        {Array(category.level)
                          // .fill("│  ") // vertical bars for intermediate levels
                          .join("")}
                        {category.level ? "└─ " : ""}
                        {category.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {
                canDeleteNewsMenu &&
                <TableHead>
                  <input
                    type="checkbox"
                    checked={selectedMultiple.length === newsList.length}
                    onChange={toggleSelectAll}
                  />
                </TableHead>
              }
              <TableHead>Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              {canUpdateStatusNewsMenu && <TableHead>Display on Home</TableHead>}
              <TableHead>Created Date</TableHead>
              {(canEditNewsMenu || canDeleteNewsMenu) && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: ITEMS_PER_PAGE }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`}>
                  {
                    canDeleteNewsMenu && <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                  }
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  {
                    canUpdateStatusNewsMenu && <TableCell>
                      <Skeleton className="h-5 w-64" />
                    </TableCell>
                  }
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  {
                    (canEditNewsMenu || canDeleteNewsMenu) && <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  }
                </TableRow>
              ))
            ) : newsList.length > 0 ? (
              newsList.map((news) => {
                const isSelected = selectedMultiple.some(
                  (n) => n._id === news._id
                );
                return (
                  <TableRow key={news._id}>
                    {
                      canDeleteNewsMenu && <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(news)}
                        />
                      </TableCell>
                    }
                    <TableCell>
                      {news.image ? (
                        <img
                          src={news.image}
                          alt={news.title}
                          className="h-12 object-cover"
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm italic">
                          No image
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{news.title}</TableCell>
                    <TableCell className="w-80">
                      <div
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-word', // wrap long words properly
                        }}
                        className="line-clamp-2 text-sm text-muted-foreground"
                        dangerouslySetInnerHTML={{
                          __html: news.description || "",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {news.category_id?.length > 0 ? (
                        <span className="text-sm text-muted-foreground">
                          {news.category_id
                            .map((cat: any) =>
                              typeof cat === "string"
                                ? toolCategories.find((c) => c._id === cat)
                                  ?.name || "Unknown"
                                : cat?.name
                            )
                            .join(", ")}
                        </span>
                      ) : (
                        <span className="italic text-muted-foreground text-sm">
                          No category
                        </span>
                      )}
                    </TableCell>
                    {
                      canUpdateStatusNewsMenu &&
                      <TableCell>
                        <Switch
                          checked={news.displayOnHomePage}
                          onCheckedChange={() => handleToggleDisplayOnHome(news)}
                        />
                      </TableCell>
                    }
                    <TableCell>
                      <ClientFormattedDate
                        dateInput={news.createdAt}
                        formatString="MMM d, yyyy"
                      />
                    </TableCell>
                    {
                      (canDeleteNewsMenu || canEditNewsMenu) &&
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">
                                Actions for {news.title}
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {
                              canEditNewsMenu &&
                              <DropdownMenuItem
                                onClick={() => openEditDialog(news)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            }
                            {
                              canDeleteNewsMenu &&
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(news)}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            }
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    }
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-4"
                >
                  No trending news found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
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
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {
        canCreateNewsMenu &&
        <CreateTrendingNewsDialog
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={fetchTrendingNews}
          toolCategories={toolCategories}
        />
      }

      {selectedNews && (
        <>
          {
            canEditNewsMenu &&
            <EditTrendingNewsDialog
              isOpen={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
              id={selectedNews?._id ?? null}
              onSuccess={fetchTrendingNews}
              toolCategories={toolCategories}
            />
          }
          {
            canDeleteNewsMenu &&
            <DeleteTrendingNewsDialog
              isOpen={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
              id={selectedNews?._id ?? null}
              onSuccess={handleDeleteSuccess}
            />
          }

        </>
      )}

      {selectedMultiple.length > 0 && canDeleteNewsMenu && (
        <MultiDeleteTrendingNewsDialog
          isOpen={isMultipleDeleteDialogOpen}
          onOpenChange={setIsMultipleDeleteDialogOpen}
          ids={selectedMultiple.map((n) => n._id)}
          onSuccess={handleMultipleDeleteSuccess}
        />
      )}
    </ProtectedPage>
  );
}
