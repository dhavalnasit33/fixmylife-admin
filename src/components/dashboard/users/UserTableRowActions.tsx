"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  UserCog,
  CheckSquare,
  Eye,
  LogOut,
} from "lucide-react";
import type { User, Plan } from "@/types";
import { useAuth } from "@/hooks/useAuth";

import EditUserDialog from "./EditUserDialog";
import DeleteUserDialog from "./DeleteUserDialog";
import AddTokensDialog from "./AddTokensDialog";
import UpdateUserStatusDialog from "./UpdateUserStatusDialog";
import { useSelector } from "react-redux";
// ViewUserDialog is opened from the page level, so not directly triggered here if that's the pattern.
// If you want ViewUserDialog triggered from here, uncomment and pass onViewUser.

interface UserTableRowActionsProps {
  user: User;
  onUserUpdated: () => void;
  availablePlans: Plan[];
  onViewUser: () => void; // Callback to open ViewUserDialog from parent
  onForceLogout?: (userId: string) => void;
}

export default function UserTableRowActions({
  user,
  onUserUpdated,
  availablePlans,
  onViewUser,
  onForceLogout,
}: UserTableRowActionsProps) {
  const { hasPermission } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddTokensDialogOpen, setIsAddTokensDialogOpen] = useState(false);
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] =
    useState(false);
  // const userData: User = useSelector((state: any) => state.user.user);
  // const isAdmin: Boolean = userData.roles.includes('Admin') || userData.roles.includes('Admin_user');
  const currentUser: User = useSelector((state: any) => state.user.user);

  // const [isViewUserDialogOpen, setIsViewUserDialogOpen] = useState(false); // Managed by parent

  const canViewThisUser = hasPermission("viewUserMenu");
  const canEditThisUser = hasPermission("editUser");
  const canDeleteThisUser = hasPermission("deleteUser");
  const canAddToken = hasPermission("addToken");
  const canUpdateUserStatus = hasPermission("updateUserStatus");

  // const hasAnyActionPermission = canViewThisUser || canEditThisUser || canDeleteThisUser;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={
              !canViewThisUser &&
              (!canEditThisUser ||
                !canDeleteThisUser ||
                !canAddToken ||
                !canUpdateUserStatus)
            }
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">User Actions for {user.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions for {user.name}</DropdownMenuLabel>

          {canViewThisUser && ( // View action is primary
            <DropdownMenuItem onClick={onViewUser}>
              <Eye className="mr-2 h-4 w-4" /> View Details
            </DropdownMenuItem>
          )}

          {(canEditThisUser ||
            canDeleteThisUser ||
            !canAddToken ||
            !canUpdateUserStatus) &&
            canViewThisUser && <DropdownMenuSeparator />}

          {canViewThisUser &&
            (canEditThisUser || canAddToken || canUpdateUserStatus) && (
              <>
                {canEditThisUser && (
                  <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit User Details
                  </DropdownMenuItem>
                )}
                {/* {
                canAddToken && (
                    <DropdownMenuItem onClick={() => setIsAddTokensDialogOpen(true)}>
                    <UserCog className="mr-2 h-4 w-4" /> Add Tokens
                  </DropdownMenuItem> 
                )
              }
              {
                canUpdateUserStatus && (
                   <DropdownMenuItem onClick={() => setIsUpdateStatusDialogOpen(true)}>
                    <CheckSquare className="mr-2 h-4 w-4" /> Update Status
                  </DropdownMenuItem> 
                )
              } */}
              </>
            )}

          {canViewThisUser && canDeleteThisUser && <DropdownMenuSeparator />}

          {canDeleteThisUser &&
            !user.roles.some((role) => role.toLowerCase() === "admin") && (
              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                disabled={
                  // user.roles.some(role => ["admin", "admin_user"].includes(role.trim().toLowerCase())  )
                  (() => {
                    const userRoles = user.roles.map((r) => r.toLowerCase());
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
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete User
              </DropdownMenuItem>
            )}

          <DropdownMenuItem
            onClick={() => onForceLogout && onForceLogout(user._id)}
            disabled={user.roles.some((role) => role.toLowerCase() === "admin")}
            className="text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" /> Force Logout
          </DropdownMenuItem>

          {!canViewThisUser && (
            <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {isEditDialogOpen && canEditThisUser && (
        <EditUserDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          user={user}
          onSuccess={onUserUpdated}
          availablePlans={availablePlans}
        />
      )}
      {isDeleteDialogOpen && canDeleteThisUser && (
        <DeleteUserDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          user={user}
          onSuccess={onUserUpdated}
        />
      )}
      {/* {isAddTokensDialogOpen && canAddToken && (
        <AddTokensDialog
          isOpen={isAddTokensDialogOpen}
          onOpenChange={setIsAddTokensDialogOpen}
          userId={user._id}
          userName={user.name}
          onSuccess={onUserUpdated}
        />
      )} */}
      {isUpdateStatusDialogOpen && canUpdateUserStatus && (
        <UpdateUserStatusDialog
          isOpen={isUpdateStatusDialogOpen}
          onOpenChange={setIsUpdateStatusDialogOpen}
          user={user}
          onSuccess={onUserUpdated}
        />
      )}
      {/* ViewUserDialog is now triggered by parent via onViewUser prop 
      {isViewUserDialogOpen && canViewThisUser && user && (
         <ViewUserDialog
            isOpen={isViewUserDialogOpen}
            onOpenChange={setIsViewUserDialogOpen}
            userId={user._id}
         />
      )}
      */}
    </>
  );
}
