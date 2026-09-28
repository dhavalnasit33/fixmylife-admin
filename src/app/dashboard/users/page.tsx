"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/shared/PageHeader";
import ProtectedPage from "@/components/shared/ProtectedPage";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
import apiService from "@/lib/apiService";
import type { User, Plan, PaginatedResponse, SingleResponse } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import UserTableToolbar, {
  type UserFilters,
} from "@/components/dashboard/users/UserTableToolbar";
import UserTableRowActions from "@/components/dashboard/users/UserTableRowActions";
import ClientFormattedDate from "@/components/shared/ClientFormattedDate";
import ViewUserDialog from "@/components/dashboard/users/ViewUserDialog";
import CreateUserDialog from "@/components/dashboard/users/CreateUserDialog";
import MultipleUsersDeleteDialog from "@/components/dashboard/users/MultipleUsersDeleteDialog";
import { Switch } from "@/components/ui/switch";
import { useSelector } from "react-redux";

const ITEMS_PER_PAGE = 10;

export default function UsersPage() {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<UserFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);

  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case "basic":
        return "Free";
      case "pro":
        return "Basic";
      case "pro_max":
        return "Premium";
      default:
        return plan;
    }
  };

  const getSubscriptionDisplay = (user: User) => {
    const display = user.subscription_display || getPlanDisplayName(user.plan);

    if (
      user.has_used_trial === true &&
      user.has_paid_once === true &&
      user.isDiscountEligible === true &&
      user.payment_option === "pay_now"
    ) {
      return (
        <span className="flex items-center gap-2">
          {display}
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 hover:bg-green-200"
          >
            Discount
          </Badge>
        </span>
      );
    }

    return display;
  };
  const [selectedUserIdForView, setSelectedUserIdForView] = useState<
    string | null
  >(null);
  const [isViewUserDialogOpen, setIsViewUserDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<
    { id: String; name: String }[]
  >([]);
  const [isMultipleUserRemoveDialogOpen, setIsMultipleUserRemoveDialogOpen] =
    useState(false);
  const [roleNames, setRoleNames] = useState<any[]>([]);
  const currentUser: User = useSelector((state: any) => state.user.user);
  const isAdmin = useSelector((state: any) => state.user.isAdmin);
  const canViewUsers = hasPermission("viewUserMenu");
  const canCreateUsers = hasPermission("createNewUser");
  const canEditUsers = hasPermission("editUser");
  const canDeleteUsers = hasPermission("deleteUser");
  const canAddToken = hasPermission("addToken");
  const canUpdateUserStatus = hasPermission("updateUserStatus");

  // const fetchRoleName = useCallback(async ()=>{
  //   try {
  //     const responce = await apiService<SingleResponse<any>>('/roleAndPermission/roleName')
  //     if (responce.success) {
  //       setRoleNames(responce.data)
  //     } else {
  //       toast({
  //         title: "Error",
  //         description: responce.message || 'Erro to get role name',
  //         variant:"destructive"
  //       })
  //     }
  //   }catch (error : any){
  //     toast({
  //       title: "Error fetch roll",
  //       description: error.message,
  //       variant:'destructive'
  //     })
  //   }
  // },[toast]);

  const handleForceLogout = async (userId: string) => {
    try {
      // Assuming your apiService automatically prepends '/api' to the URL
      const response = await apiService<SingleResponse<any>>(
        `/auth/force-logout/${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "User scheduled for logout.",
        });
      } else {
        throw new Error(response.message || "Force logout failed.");
      }
    } catch (error: any) {
      toast({
        title: "Error forcing logout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchPlans = useCallback(async () => {
    try {
      const response = await apiService<PaginatedResponse<Plan>>("/plans", {
        params: { limit: 100 },
      });
      if (response.success) {
        setAvailablePlans(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch plans for filtering.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error fetching plans",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    if (canViewUsers) {
      // Only fetch plans if user can view users page (implies filters might be used)
      fetchPlans();
    }
  }, [fetchPlans, canViewUsers]);

  const fetchUsers = useCallback(
    async (page = 1, currentFilters: UserFilters = {}) => {
      setIsLoading(true);
      try {
        const queryParams: Record<string, string | number | undefined> = {
          page,
          limit: ITEMS_PER_PAGE,
          search: currentFilters.search,
          plan: currentFilters.plan,
          status: currentFilters.status,
          role: currentFilters.role,
        };
        Object.keys(queryParams).forEach(
          (key) => queryParams[key] === undefined && delete queryParams[key],
        );

        const response = await apiService<PaginatedResponse<User>>("/users", {
          params: queryParams,
        });
        if (response.success) {
          setUsers(response.data);
          setCurrentPage(Number(response.pagination.current));
          setTotalPages(Number(response.pagination.pages));
          setTotalItems(response.pagination.total);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch users.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error fetching users",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  const handleStatusToggle = async (
    userId: string,
    newStatus: User["status"],
  ) => {
    try {
      const response = await apiService<SingleResponse<User>>(
        `/users/${userId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (response.success) {
        toast({
          title: "Success",
          description: `User status updated to ${newStatus}.`,
        });
        handleUserUpdated(); // Refresh the list
      } else {
        throw new Error(response.message || "Status update failed.");
      }
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (canViewUsers) {
      // Only fetch users if user can view users page
      fetchUsers(currentPage, filters);
      // fetchRoleName();
    } else {
      setIsLoading(false); // If no permission, stop loading
      setUsers([]);
    }
  }, [currentPage, filters, fetchUsers, canViewUsers]);

  const handleFilterChange = (newFilters: Partial<UserFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleUserUpdated = () => {
    if (canViewUsers) {
      fetchUsers(currentPage, filters);
    }
  };

  const openViewUserDialog = (userId: string) => {
    setSelectedUserIdForView(userId);
    setIsViewUserDialogOpen(true);
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const names = name.split(" ");
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const getStatusVariant = (
    status: User["status"],
  ): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "active":
        return "default";
      case "suspended":
        return "destructive";
      case "inactive":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const openMultipleUserRemoveDialog = () => {
    setIsMultipleUserRemoveDialogOpen(true);
  };

  const handleMultipleUserRemove = () => {
    fetchUsers(currentPage, filters);
    // fetchRoleName();

    setIsMultipleUserRemoveDialogOpen(false);
    setSelectedUsers([]);
  };

  function hasAdminRole(user: any) {
    return user.roles.some(
      (role: any) =>
        role.toLowerCase() === "admin" || role.toLowerCase() === "admin_user",
    );
  }

  const selectableUsers = users.filter((user) => !hasAdminRole(user));

  const toggleSelectAll = () => {
    if (selectedUsers.length === selectableUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(
        users
          .filter((user) => {
            const userRoles = user.roles.map((r) => r.toLowerCase());
            const currentRoles = currentUser.roles.map((r) => r.toLowerCase());

            if (userRoles.includes("admin")) return false;
            if (
              userRoles.includes("admin_user") &&
              !currentRoles.includes("admin")
            )
              return false;
            return true;
          })
          .map((user) => ({ id: user._id, name: user.name })),
      );
    }
  };
  console.log("🚀 ~ toggleSelectAll ~ selectedUsers:", selectedUsers.length);

  const toggleSelectOne = (id: String) => {
    const user = users.find((user) => user._id === id);
    setSelectedUsers((prev) =>
      prev.find((u) => u.id === id)
        ? prev.filter((u) => u.id !== id)
        : user
          ? [...prev, { id: user._id, name: user.name }]
          : prev,
    );
  };

  console.log(
    currentUser.roles.some((role) =>
      ["admin", "admin_user"].includes(role.trim().toLowerCase()),
    ),
  );

  return (
    <ProtectedPage requiredPermission="viewUserMenu">
      <PageHeader
        title="User Management"
        description="View, edit, and manage all users in the system."
        actionButtons={
          canCreateUsers && (
            <Button onClick={() => setIsCreateUserDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New User
            </Button>
          )
        }
      />

      <UserTableToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        availablePlans={availablePlans.map((p) => ({
          value: p.name,
          label: p.display_name,
        }))}
        openMultipleUserRemoveDialog={openMultipleUserRemoveDialog}
        selectedUsers={selectedUsers}
      />

      <div className="mt-4 w-full overflow-hidden rounded-md border shadow-sm bg-card">
        <Table className="min-w-[1400px] w-full">
          <TableHeader>
            <TableRow>
              {canDeleteUsers && (
                <TableHead className="w-[40px]">
                  <input
                    type="checkbox"
                    checked={
                      selectedUsers.length === selectableUsers.length &&
                      selectableUsers.length > 0
                    }
                    onChange={toggleSelectAll}
                    aria-label="Select all Tools"
                  />
                </TableHead>
              )}
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="hidden md:table-cell">
                User interests
              </TableHead>
              <TableHead className="hidden md:table-cell">Country</TableHead>
              <TableHead className="hidden lg:table-cell">
                Last Device
              </TableHead>
              <TableHead className="hidden md:table-cell">Plan</TableHead>

              {/* <-- NEW */}
              <TableHead className="hidden md:table-cell text-center">
                Onboarding %
              </TableHead>
              <TableHead className="hidden md:table-cell text-center">
                Activation %
              </TableHead>
              <TableHead className="hidden md:table-cell text-center">
                Paid Conversion %
              </TableHead>
              <TableHead className="hidden md:table-cell text-center">
                Tokens
              </TableHead>
              <TableHead className="hidden md:table-cell text-center">
                image
              </TableHead>
              <TableHead className="hidden md:table-cell text-center">
                video
              </TableHead>
              <TableHead className="hidden sm:table-cell text-center">
                Status
              </TableHead>
              {isAdmin && (
                <TableHead className="hidden lg:table-cell">Roles</TableHead>
              )}
              <TableHead className="hidden lg:table-cell whitespace-nowrap">
                Joined
              </TableHead>
              <TableHead className="hidden lg:table-cell whitespace-nowrap">
                Last Login
              </TableHead>
              {canViewUsers &&
                (canDeleteUsers ||
                  canEditUsers ||
                  canAddToken ||
                  canUpdateUserStatus) && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <TableRow key={`skeleton-user-${i}`}>
                  {canDeleteUsers && (
                    <TableCell>
                      <Skeleton className="h-10 w-10 rounded-full" />
                    </TableCell>
                  )}
                  <TableCell>
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-center">
                    <Skeleton className="h-4 w-12 mx-auto" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-center">
                    <Skeleton className="h-4 w-12 mx-auto" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-center">
                    <Skeleton className="h-4 w-12 mx-auto" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-center">
                    <Skeleton className="h-4 w-12 mx-auto" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-center">
                    <Skeleton className="h-4 w-12 mx-auto" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-center">
                    <Skeleton className="h-4 w-12 mx-auto" />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-center">
                    <Skeleton className="h-6 w-20 mx-auto rounded-full" />
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  )}
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  {canViewUsers &&
                    (canDeleteUsers ||
                      canEditUsers ||
                      canAddToken ||
                      canUpdateUserStatus) && (
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    )}
                </TableRow>
              ))
            ) : users.length > 0 ? (
              users.map((user) => {
                const isChecked = selectedUsers.some(
                  (selectedUser) => selectedUser.id === user._id,
                );
                return (
                  <TableRow key={user._id}>
                    {canDeleteUsers && (
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={
                            (() => {
                              const userRoles = user.roles.map((r) =>
                                r.toLowerCase(),
                              );
                              const currentRoles = currentUser.roles.map((r) =>
                                r.toLowerCase(),
                              );

                              if (userRoles.includes("admin")) return true;
                              if (
                                userRoles.includes("admin_user") &&
                                !currentRoles.includes("admin")
                              )
                                return true;
                              return false;
                            })() // ✅ Call the function immediately
                          }
                          onChange={() => toggleSelectOne(user._id)}
                          aria-label={`Select tool ${user.name}`}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={user.profile_picture || undefined}
                          alt={user.name}
                        />
                        <AvatarFallback>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {user.interests && user.interests.length > 0 ? (
                          user.interests.map((interest, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-[10px] py-0 px-1"
                            >
                              {interest}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            None
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {user.region || <span className="">Unknown</span>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {user?.devices && user?.devices?.length > 0 ? (
                        <div className="flex flex-col">
                          {/* Add the "capitalize" class here */}
                          <span className="font-medium capitalize">
                            {user?.devices[user?.devices?.length - 1]
                              ?.deviceType || "Unknown"}
                          </span>
                          <span className="text-xs">
                            {user?.devices[user?.devices?.length - 1]
                              ?.browser || "Unknown"}
                            {user?.devices[user?.devices?.length - 1]?.os
                              ? ` on ${user?.devices[user?.devices?.length - 1]?.os}`
                              : ""}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {getSubscriptionDisplay(user)}
                    </TableCell>

                    <TableCell className="hidden md:table-cell text-center">
                      {user.onboarding_completion_pct ?? 0}%
                    </TableCell>

                    <TableCell className="hidden md:table-cell text-center">
                      {user.activation_pct ?? 0}%
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-center">
                      {user.paid_conversion_pct ?? 0}%
                    </TableCell>

                    <TableCell className="hidden md:table-cell text-center">
                      {user.remaining_tokens}
                    </TableCell>

                   <TableCell className="hidden md:table-cell text-center">
                      {user.subscription_status === "trialing" || user.plan === "basic"
                        ? "-"
                        : user.image_credits}
                    </TableCell>

                    <TableCell className="hidden md:table-cell text-center">
                      {user.subscription_status === "trialing" || user.plan === "basic"
                        ? "-"
                        : user.video_credits}
                    </TableCell>
                    {/* <TableCell className="hidden sm:table-cell text-center">
                      <Badge
                        variant={getStatusVariant(user.status)}
                        className="capitalize"
                      >
                        {user.status}
                      </Badge>
                    </TableCell> */}
                    <TableCell className="hidden sm:table-cell text-center">
                      <Switch
                        checked={user.status === "active"}
                        onCheckedChange={(checked) =>
                          handleStatusToggle(
                            user._id,
                            checked ? "active" : "inactive",
                          )
                        }
                        disabled={
                          //   : user.roles.some(role => ["admin", "admin_user"].includes(role.trim().toLowerCase())
                          // !user.roles.some((role) => role.toLowerCase() === "admin")
                          (() => {
                            const userRoles = user.roles.map((r) =>
                              r.toLowerCase(),
                            );
                            const currentRoles = currentUser.roles.map((r) =>
                              r.toLowerCase(),
                            );

                            if (userRoles.includes("admin")) return true;
                            if (
                              userRoles.includes("admin_user") &&
                              !currentRoles.includes("admin")
                            )
                              return true;
                            return false;
                          })()
                        }
                        aria-label={`Toggle status for ${user.name}`}
                      />
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="hidden lg:table-cell">
                        {user.roles.join(", ")}
                      </TableCell>
                    )}
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap">
                      <ClientFormattedDate
                        dateInput={user.createdAt}
                        formatString="MMM d, yyyy"
                      />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap">
                      {user.lastLogin ? (
                        <ClientFormattedDate
                          dateInput={user.lastLogin}
                          formatString="MMM d, yyyy, hh:mm a"
                        />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    {canViewUsers &&
                      (canEditUsers ||
                        canDeleteUsers ||
                        canAddToken ||
                        canUpdateUserStatus) && (
                        <TableCell className="text-right">
                          <UserTableRowActions
                            user={user}
                            onUserUpdated={handleUserUpdated}
                            availablePlans={availablePlans}
                            onViewUser={() => openViewUserDialog(user._id)}
                            onForceLogout={
                              handleForceLogout
                            } /* <-- ADD THIS NEW PROP */
                          />
                        </TableCell>
                      )}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={18} className="text-center h-24">
                  No users found. Try adjusting filters.
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
            users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
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
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      {selectedUserIdForView && (
        <ViewUserDialog
          isOpen={isViewUserDialogOpen}
          onOpenChange={setIsViewUserDialogOpen}
          userId={selectedUserIdForView}
        />
      )}

      {isCreateUserDialogOpen && (
        <CreateUserDialog
          isOpen={isCreateUserDialogOpen}
          onOpenChange={setIsCreateUserDialogOpen}
          onSuccess={handleUserUpdated}
        />
      )}

      {selectedUsers && (
        <MultipleUsersDeleteDialog
          isOpen={isMultipleUserRemoveDialogOpen}
          onOpenChange={setIsMultipleUserRemoveDialogOpen}
          users={selectedUsers}
          onSuccess={handleMultipleUserRemove}
        />
      )}
    </ProtectedPage>
  );
}
