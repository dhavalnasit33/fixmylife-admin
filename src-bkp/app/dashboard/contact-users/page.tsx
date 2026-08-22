"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/shared/PageHeader";
import ProtectedPage from "@/components/shared/ProtectedPage";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  MoreHorizontal,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
} from "lucide-react";
import apiService from "@/lib/apiService";
import type {
  ContactUser,
  PaginatedResponse,
} from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import DeleteContactUserDialog from "@/components/dashboard/contact-user/DeleteContactUser";
import MultipleDeleteContactUserDialog from "@/components/dashboard/contact-user/MultipleDeleteContactUser";
import ClientFormattedDate from "@/components/shared/ClientFormattedDate";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";


const ITEMS_PER_PAGE = 5;

export default function ContactUsersPage() {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [contactUsers, setContactUsers] = useState<ContactUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(
    null
  );
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [selectedContactUser, setSelectedContactUser] =
    useState<ContactUser | null>(null);

  const [selectedUsers, setSelectedUsers] = useState<
    { id: string; name: string }[]
  >([]);
  const [isMultipleRemoveDialogOpen, setIsMultipleRemoveDialogOpen] =
    useState(false);

  const staticCategories = [
  { _id: "Support", name: "Support" },
  { _id: "Feedback", name: "Feedback" },
  { _id: "Partnership", name: "Partnership" },
  { _id: "Other", name: "Other" },
];

const [toolCategories, setToolCategories] = useState(staticCategories);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | undefined
  >(undefined);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);

  const canManageContactUser = hasPermission('viewOnlyContactMenu');
  const canDeleteContactUser = hasPermission('deleteContactData')

  const fetchContactUsers = useCallback(
    async (page = 1, search = "", category = "") => {
      setIsLoading(true);
      try {
        const params: Record<string, string | number | boolean | undefined> = {
          page,
          limit: ITEMS_PER_PAGE,
        };
        if (search) params.search = search;
        if (category) params.category = category;

        const response = await apiService<PaginatedResponse<ContactUser>>(
          "/contact-user",
          {
            params,
          }
        );
        if (response.success) {
          setContactUsers(response.data);
          setCurrentPage(response.pagination.current);
          setTotalPages(response.pagination.pages);
          setTotalItems(response.pagination.total);
          setSelectedUsers([]);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch contact users.",
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
    if (canManageContactUser) {
      fetchContactUsers(currentPage, searchTerm, selectedCategoryId || '');
    } else {
      setIsLoading(false);
      setContactUsers([]);
    }
  }, [fetchContactUsers, canManageContactUser, currentPage, searchTerm, selectedCategoryId]);

  const toggleExpandedMessage = (id: string) => {
    setExpandedMessageId((prevId) => (prevId === id ? null : id));
  };

  const openRemoveDialog = (contactUserToRemove: ContactUser) => {
    if (!canManageContactUser && !canDeleteContactUser) return;
    setSelectedContactUser(contactUserToRemove);
    setIsRemoveDialogOpen(true);
  };

  const handleRemoveSuccess = () => {
    fetchContactUsers(
      contactUsers.length === 1 && currentPage > 1
        ? currentPage - 1
        : currentPage,
      searchTerm,
      selectedCategoryId || ""
    );
    setIsRemoveDialogOpen(false);
    setSelectedContactUser(null);
  };

  const openMultipleRemoveDialog = () => {
    if (!canManageContactUser || !canDeleteContactUser) return;
    setIsMultipleRemoveDialogOpen(true);
  };

  const handleMultipleRemoveSuccess = () => {
    fetchContactUsers(
      contactUsers.length === 1 && currentPage > 1
        ? currentPage - 1
        : currentPage,
      searchTerm,
      selectedCategoryId || ""
    );
    setIsMultipleRemoveDialogOpen(false);
    setSelectedUsers([]);
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const names = name.split(" ");
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === contactUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(
        contactUsers.map((user) => ({ id: user._id, name: user.name }))
      );
    }
  };

  const toggleSelectOne = (id: string) => {
    const user = contactUsers.find((user) => user._id === id);
    setSelectedUsers((prev) =>
      prev.find((u) => u.id === id)
        ? prev.filter((u) => u.id !== id)
        : user
          ? [...prev, { id: user._id, name: user.name }]
          : prev
    );
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId === "all" ? undefined : categoryId);
    setCurrentPage(1);
  };

  return (
    <ProtectedPage requiredPermission="viewOnlyContactMenu">
      <PageHeader title="Contact Users Management" description="Manage users"
        actionButtons={
          selectedUsers.length > 0 && canDeleteContactUser && (
            <Button
              variant="destructive"
              onClick={openMultipleRemoveDialog}
              disabled={selectedUsers.length <= 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Contact
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-col  sm:flex-row sm:items-center justify-start md:justify-between gap-2">
        <div className="relative w-full max-w-sm sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search contact users by name/email/subject "
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-8 w-full"
          />
        </div>
        <div className="flex flex-row gap-2  items-center">
          <Popover
            open={isFilterPopoverOpen}
            onOpenChange={setIsFilterPopoverOpen}
          >
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="mr-2 h-4 w-4" /> Filter by Issue Category
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-0">
              <div className="p-2 max-h-64 overflow-y-auto">
                <div>
                  <button
                    className={`block w-full text-left px-2 py-1 rounded ${selectedCategoryId === undefined ||
                        selectedCategoryId === "all"
                        ? "bg-indigo-500 text-white"
                        : "hover:bg-[#29a383] hover:text-white"
                      }`}
                    onClick={() => {
                      handleCategoryFilterChange("all");
                      setIsFilterPopoverOpen(false); // close on selection
                    }}
                  >
                    All Categories
                  </button>
                  {toolCategories.map((category) => (
                    <button
                      key={category._id}
                      className={`block w-full text-left px-2 py-1 rounded ${selectedCategoryId === category._id
                          ? "bg-indigo-500 text-white"
                          : "hover:bg-[#29a383] hover:text-white"
                        }`}
                      onClick={() => {
                        handleCategoryFilterChange(category._id);
                        setIsFilterPopoverOpen(false); // close on selection
                      }}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="rounded-md border w-full shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {canDeleteContactUser && (
                <TableHead className="w-[40px]">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === contactUsers.length && contactUsers.length > 0}
                    onChange={toggleSelectAll}
                    aria-label="Select all contact users"
                  />
                </TableHead>
              )}
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className=" ">Issue Category</TableHead>
              <TableHead className=" ">Subject</TableHead>
              <TableHead className=" ">Message</TableHead>
              <TableHead className=" ">Date & Time</TableHead>
              {canManageContactUser && canDeleteContactUser && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>

                  {canDeleteContactUser && <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>}
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className=" "><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell className=" "><Skeleton className="h-6 w-20 rounded-full mx-auto" /></TableCell>
                  <TableCell className=" "><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell className=""><Skeleton className="h-4 w-20" /></TableCell>
                  {canManageContactUser && canDeleteContactUser && <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>}
                </TableRow>
              )))
              : contactUsers.length > 0 ? (
                contactUsers.map(contactUser => {
                  const isExpanded = expandedMessageId === contactUser._id;
                  const isChecked = selectedUsers.some(user => user.id === contactUser._id);
                  return (
                    <TableRow key={contactUser._id}>
                      {
                        canDeleteContactUser && (
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectOne(contactUser._id)}
                              aria-label={`Select contact user ${contactUser.name}`}
                            />
                          </TableCell>
                        )
                      }
                      <TableCell>
                        <Avatar className="h-10 w-10 border">
                          <AvatarFallback>{getInitials(contactUser?.name)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell><div className="font-medium">{contactUser?.name}</div></TableCell>
                      <TableCell><div className="text-xs text-muted-foreground">{contactUser?.email}</div></TableCell>
                      <TableCell><Badge variant="outline" className="bg-indigo-600 text-gray-200">{contactUser?.issueCategory}</Badge></TableCell>
                      <TableCell className="  text-xs text-muted-foreground max-w-80">{contactUser?.subject || '-'}</TableCell>
                      <TableCell className="  text-xs text-muted-foreground max-w-xs">
                        {contactUser?.message ? (
                          <>
                            <div className={isExpanded ? '' : 'line-clamp-2 overflow-hidden'}>
                              {contactUser.message}
                            </div>
                            <button className="text-blue-600 hover:underline text-xs mt-1" onClick={() => toggleExpandedMessage(contactUser._id)}>
                              {isExpanded ? 'View Less' : 'View More'}
                            </button>
                          </>
                        ) : '-'}
                      </TableCell>
                      <TableCell className=" flex flex-col text-sm text-muted-foreground">
                        <ClientFormattedDate dateInput={contactUser.createdAt} formatString="MMM d, yyyy" />
                        {/* showing time with am and pm */}
                        <ClientFormattedDate dateInput={contactUser.createdAt} formatString="h:mm a" />
                      </TableCell>
                      {canManageContactUser && canDeleteContactUser && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openRemoveDialog(contactUser)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Remove Contact User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              ) : ( 
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm py-4 text-muted-foreground">
                    No contact users found.
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>

     
      </div>
   {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between px-4 pb-4">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of{" "}
              {totalItems} users
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
      {selectedContactUser && (
        <DeleteContactUserDialog
          isOpen={isRemoveDialogOpen}
          onOpenChange={setIsRemoveDialogOpen}
          contact={selectedContactUser}
          onSuccess={handleRemoveSuccess}
        />
      )}

      {selectedUsers.length > 0 && (
        <MultipleDeleteContactUserDialog
          isOpen={isMultipleRemoveDialogOpen}
          onOpenChange={setIsMultipleRemoveDialogOpen}
          contactUserName={selectedUsers}
          onSuccess={handleMultipleRemoveSuccess}
        />
      )}

    </ProtectedPage>
  );
}
