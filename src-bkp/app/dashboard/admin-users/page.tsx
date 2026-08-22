"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/shared/PageHeader";
import ProtectedPage from "@/components/shared/ProtectedPage";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  UserPlus,
  Edit,
  Trash2,
  UserRoundCog,
  UserPen,
  UserX,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import apiService from "@/lib/apiService";
import type {
  AdminUser,
  PaginatedResponse,
  roleAndPermission,
  SingleResponse,
} from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import AssignAdminRoleDialog from "@/components/dashboard/admin-users/AssignAdminRoleDialog";
import EditAdminPermissionsDialog from "@/components/dashboard/admin-users/EditAdminPermissionsDialog";
import RemoveAdminRoleDialog from "@/components/dashboard/admin-users/RemoveAdminRoleDialog";
import RollAndPermissionCreate from "@/components/dashboard/admin-users/Roll&PermisionCreateFrom";
// ✅ Import new form
import { useSelector } from "react-redux";
import EditRoleAndPermissionForm from "@/components/dashboard/admin-users/Roll&PermissionEditForm";
import RollAndPermissionDelete from "@/components/dashboard/admin-users/Roll&PermisionDeleteForm";
import { Input } from "@/components/ui/input";

const ITEMS_PER_PAGE = 10;

export default function AdminUsersPage() {
  const { toast } = useToast();
  const { hasPermission, user: currentUser } = useAuth();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isRollCreateDialogOpen, setIsRollCreateDialogOpen] = useState(false);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false); // ✅ New state
  const [isDeleteRoleDialogOpen, setIsDeleteRoleDialogOpen] = useState(false);
  const [selectedAdminUser, setSelectedAdminUser] = useState<AdminUser | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const canManageRoles = hasPermission("manage_roles");
  const users_id: any = useSelector((state: any) => state.user.user) || "";

  const fetchAdminUsers = useCallback(
    async (page = 1, search = "") => {
      if (!users_id?.id) {
        setAdminUsers([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const params: Record<string, string | number | boolean | undefined> = {
          page,
          limit: ITEMS_PER_PAGE,
        };
        if (search) params.search = search;
        const response = await apiService<PaginatedResponse<AdminUser>>(
          `/admin/users/${users_id.id}`,
          { params }
        );
        if (response.success) {
          setAdminUsers(response.data || []);
          setCurrentPage(response.pagination.current);
          setTotalPages(response.pagination.pages);
          setTotalItems(response.pagination.total);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch admin users.",
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
    [toast, users_id]
  );

  useEffect(() => {
    if (canManageRoles) {
      fetchAdminUsers(currentPage, searchTerm);
    } else {
      setIsLoading(false);
      setAdminUsers([]);
    }
  }, [fetchAdminUsers, canManageRoles, currentPage, searchTerm]);

  const handleAssignSuccess = () => {
    fetchAdminUsers(
      adminUsers.length == 1 && currentPage > 1 ? currentPage - 1 : currentPage,
      searchTerm
    );
    setIsAssignDialogOpen(false);
  };

  const handleEditSuccess = () => {
    fetchAdminUsers(
      adminUsers.length == 1 && currentPage > 1 ? currentPage - 1 : currentPage,
      searchTerm
    );
    setIsEditDialogOpen(false);
    setSelectedAdminUser(null);
  };

  const handleRemoveSuccess = () => {
    fetchAdminUsers(
      adminUsers.length == 1 && currentPage > 1 ? currentPage - 1 : currentPage,
      searchTerm
    );
    setIsRemoveDialogOpen(false);
    setSelectedAdminUser(null);
  };

  const handleRoleCreateSuccess = () => {
    fetchAdminUsers(
      adminUsers.length == 1 && currentPage > 1 ? currentPage - 1 : currentPage,
      searchTerm
    );
    setIsRollCreateDialogOpen(false);
  };

  const handelRoleEditSuccess = () => {
    fetchAdminUsers(
      adminUsers.length == 1 && currentPage > 1 ? currentPage - 1 : currentPage,
      searchTerm
    );
    setIsEditRoleDialogOpen(false);
  };

  const handelRoleDeleteSuccess = () => {
    fetchAdminUsers(
      adminUsers.length == 1 && currentPage > 1 ? currentPage - 1 : currentPage,
      searchTerm
    );
    setIsDeleteRoleDialogOpen(false);
  };

  const openEditDialog = (adminUserToEdit: AdminUser) => {
    if (!canManageRoles) return;
    setSelectedAdminUser(adminUserToEdit);
    setIsEditDialogOpen(true);
  };

  const openRemoveDialog = (adminUserToRemove: AdminUser) => {
    if (!canManageRoles) return;
    setSelectedAdminUser(adminUserToRemove);
    setIsRemoveDialogOpen(true);
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const names = name.split(" ");
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  return (
    <ProtectedPage requiredPermission="manage_roles">
      <PageHeader
        title="Admin Users Management"
        description="Manage users with administrative roles and permissions."
        actionButtons={
          canManageRoles && (
            <>
              {/* ✅ Dropdown button for role actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-violet-600 text-white hover:bg-violet-400">
                    <UserRoundCog className="mr-2 h-4 w-4" />
                    Role Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setIsRollCreateDialogOpen(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Role & Permission
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsEditRoleDialogOpen(true)}
                  >
                    <UserPen className="mr-2 h-4 w-4" />
                    Edit Role & Permission
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsDeleteRoleDialogOpen(true)}
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Delete Role & Permission
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={() => setIsAssignDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Admin Role
              </Button>
            </>
          )
        }
      />
      <div className="mb-4 flex flex-col  sm:flex-row sm:items-center justify-start md:justify-between gap-2">
        <div className="relative w-full max-w-sm sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search admin users by name/email/role.. "
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-8 w-full"
          />
        </div>
      </div>

      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden lg:table-cell">
                Assigned By
              </TableHead>
              {canManageRoles && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell>
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton className="h-6 w-20 rounded-full mx-auto" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-5 w-28" />
                  </TableCell>
                  {canManageRoles && (
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : adminUsers.length > 0 ? (
              adminUsers.map((adminUser) => (
                <TableRow key={adminUser._id}>
                  <TableCell>
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage
                        src={adminUser.user_id.profile_picture || undefined}
                        alt={adminUser.user_id.name}
                      />
                      <AvatarFallback>
                        {getInitials(adminUser.user_id.name)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{adminUser.user_id.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {adminUser.user_id.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {typeof adminUser.role === "string"
                        ? adminUser.role
                        : adminUser.role?.roleName ?? "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell ">
                    <Badge
                      variant={adminUser.is_active ? "default" : "secondary"}
                    >
                      {adminUser.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {adminUser.assigned_by.name}
                  </TableCell>
                  {canManageRoles && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={!canManageRoles}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">
                              Actions for {adminUser.user_id.name}
                            </span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditDialog(adminUser)}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit Permissions
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openRemoveDialog(adminUser)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Remove Admin
                            Role
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={canManageRoles ? 7 : 6}
                  className="text-center h-24"
                >
                  No admin users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* {totalPages > 1 && ( */}
      {totalItems > ITEMS_PER_PAGE && (
        <div className="mt-6 flex items-center justify-between px-4 pb-4">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems}{" "}
            users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
              className="disabled:cursor-not-allowed"
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
              className="disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* )} */}
      {/* ✅ Dialogs */}
      {canManageRoles && isAssignDialogOpen && (
        <AssignAdminRoleDialog
          isOpen={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          onSuccess={handleAssignSuccess}
        />
      )}

      {canManageRoles && selectedAdminUser && (
        <>
          <EditAdminPermissionsDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            adminUser={selectedAdminUser}
            onSuccess={handleEditSuccess}
          />
          <RemoveAdminRoleDialog
            isOpen={isRemoveDialogOpen}
            onOpenChange={setIsRemoveDialogOpen}
            adminUser={selectedAdminUser}
            onSuccess={handleRemoveSuccess}
          />
        </>
      )}

      {canManageRoles && isRollCreateDialogOpen && (
        <RollAndPermissionCreate
          isOpen={isRollCreateDialogOpen}
          onOpenChange={setIsRollCreateDialogOpen}
          onSuccess={handleRoleCreateSuccess}
        />
      )}

      {/* ✅ Edit Role & Permission Dialog */}
      {canManageRoles && isEditRoleDialogOpen && (
        <EditRoleAndPermissionForm
          isOpen={isEditRoleDialogOpen}
          onOpenChange={setIsEditRoleDialogOpen}
          onSuccess={handelRoleEditSuccess}
        />
      )}
      {canManageRoles && isDeleteRoleDialogOpen && (
        <RollAndPermissionDelete
          isOpen={isDeleteRoleDialogOpen}
          onOpenChange={setIsDeleteRoleDialogOpen}
          onSuccess={handelRoleDeleteSuccess}
        />
      )}
    </ProtectedPage>
  );
}
