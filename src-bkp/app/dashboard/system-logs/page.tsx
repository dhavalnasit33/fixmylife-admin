"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Heart,
  HeartIcon,
  Search,
  Filter,
  Trash2,
  CalendarIcon,
  Download,
  Eye,
} from "lucide-react";

import PageHeader from "@/components/shared/PageHeader";
import ProtectedPage from "@/components/shared/ProtectedPage";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import apiService from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { ChatHistory, ChatHistoryResponse } from "@/types";
import DeleteChatHistoryDialog from "@/components/dashboard/system-logs/DeleteChatHistoryDialog";
import MultipleDeleteChatHistoryDialog from "@/components/dashboard/system-logs/MultipleDeleteChatHistoryDialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import * as XLSX from "xlsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import ViewChatHistoryDialog from "@/components/dashboard/system-logs/ViewChatHistoryDialog";

const ITEMS_PER_PAGE = 10;

const filterOptions = [
  { label: "All", value: "all" },
  { label: "Favorites", value: "favorites" },
  { label: "Archived", value: "archived" },
];

export default function ChatHistoryPage() {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
 

  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedChat, setSelectedChat] = useState<ChatHistory | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [viewChatId, setViewChatId] = useState<string | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const startDate = dateRange?.from
    ? new Date(dateRange.from).toISOString()
    : "";
  const endDate = dateRange?.to ? new Date(dateRange.to).toISOString() : "";

  const [selectedChats, setSelectedChats] = useState<ChatHistory[]>([]);
  const [isMultiDeleteDialogOpen, setIsMultiDeleteDialogOpen] = useState(false);

  const fetchChats = useCallback(
    async (page = 1, search = "", filterType = "all") => {
      setIsLoading(true);
      try {
        const params: any = {
          page,
          limit: ITEMS_PER_PAGE,
          startDate,
          endDate,
        };
        if (search) params.search = search;
        if (filterType === "favorites") params.favorite = "true";
        else if (filterType === "archived") params.archived = "true";
        else params.archived = "false";

        const response = await apiService<ChatHistoryResponse>(
          "/chat-history/admin-or-user",
          {
            params,
          }
        );

        if (response.success) {
          setChats(response.data);
          setCurrentPage(response.pagination.current);
          setTotalPages(response.pagination.pages);
          setTotalItems(response.pagination.total);
        } else {
          toast({
            title: "Error",
            description: "Failed to load chat history.",
            variant: "destructive",
          });
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "An error occurred.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast, startDate, endDate]
  );

  useEffect(() => {
   
      fetchChats(currentPage, searchTerm, filter);
  }, [
    fetchChats,
    currentPage,
    searchTerm,
    filter,
    startDate,
    endDate,
  ]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };


  const handleDownloadExcel = async () => {
    const params: any = {
      limit: 1000, // or higher if needed
      search: searchTerm,
      startDate,
      endDate,
    };

    if (filter === "favorites") params.favorite = "true";
    else if (filter === "archived") params.archived = "true";
    else params.archived = "false";

    try {
      const response = await apiService<ChatHistoryResponse>("/chat-history/admin-or-user", {
        params,
      });

      if (!response.success) throw new Error("Failed to download data");

      const rows = response.data.map((chat) => ({
        Title: chat.title,
        "Total Messages": chat.total_messages,
        "Total Tokens": chat.total_tokens_used,
        "Last Activity": new Date(chat.last_activity).toLocaleString(),
        "Created At": new Date(chat.createdAt).toLocaleString(),
        Favorite: chat.is_favorite ? "Yes" : "No",
        User: chat.user_id?.name || "Unknown",
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Chat History");

      XLSX.writeFile(workbook, "chat_history_report.xlsx");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate report.",
        variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider>
      <ProtectedPage>
        <PageHeader
          title="Chat History"
          description="View user chat sessions, token usage, and timestamps."
        />

        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-8"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[240px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {/* Export */}
            <Button variant="outline" onClick={handleDownloadExcel}>
              <Download className="mr-2 h-4 w-4" /> Export to Excel
            </Button>

            {/* Bulk Delete */}
            {selectedChats.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setIsMultiDeleteDialogOpen(true)}
              >
                Delete Selected ({selectedChats.length})
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-md border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedChats(chats);
                      } else {
                        setSelectedChats([]);
                      }
                    }}
                    checked={selectedChats.length === chats.length}
                  />
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell text-center">
                  Messages
                </TableHead>
                <TableHead className="hidden md:table-cell text-center">
                  Tokens
                </TableHead>
                <TableHead className="hidden lg:table-cell">User</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Created At
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Last Activity
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell>
                      <Skeleton className="h-5 w-40" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-center">
                      <Skeleton className="h-5 w-12 mx-auto" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-center">
                      <Skeleton className="h-5 w-12 mx-auto" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : chats.length > 0 ? (
                chats.map((chat) => (
                  <TableRow key={chat._id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedChats([...selectedChats, chat]);
                          } else {
                            setSelectedChats(
                              selectedChats.filter((c) => c._id !== chat._id)
                            );
                          }
                        }}
                        checked={selectedChats.some((c) => c._id === chat._id)}
                      />
                    </TableCell>
                    <TableCell className="flex items-center gap-2 max-w-[500px] overflow-hidden">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className="truncate cursor-pointer text-black"
                            onClick={() => {
                              setViewChatId(chat._id);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            {chat.title}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          className="max-w-xs w-[400px] max-h-[400px] overflow-auto text-sm break-words text-center"
                          side="top"
                        >
                          <p>{chat.title}</p>
                        </TooltipContent>
                      </Tooltip>
                      {/* {chat.is_favorite ? (
                        <Heart className="w-4 h-4 text-red-500 flex-shrink-0" />
                      ) : (
                        <HeartIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )} */}
                    </TableCell>

                    <TableCell className="hidden sm:table-cell text-center">
                      {chat.total_messages}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-center">
                      {chat.total_tokens_used}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {chat.user_id?.name || "Unknown"}
                    </TableCell>

                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {format(new Date(chat.createdAt), "PPpp")}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {format(new Date(chat.last_activity), "PPpp")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setViewChatId(chat._id);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedChat(chat);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    No chat history found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <DeleteChatHistoryDialog
            isOpen={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            chat={selectedChat}
            onSuccess={() => fetchChats(currentPage, searchTerm, filter)}
          />

          <MultipleDeleteChatHistoryDialog
            isOpen={isMultiDeleteDialogOpen}
            onOpenChange={setIsMultiDeleteDialogOpen}
            chats={selectedChats.map((chat) => ({
              id: chat._id,
              title: chat.title,
            }))}
            onSuccess={() => {
              setSelectedChats([]);
              fetchChats(currentPage, searchTerm, filter);
            }}
          />
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} • Total Chats: {totalItems}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
        <ViewChatHistoryDialog
          isOpen={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          chatId={viewChatId}
        />
      </ProtectedPage>
    </TooltipProvider>
  );
}
