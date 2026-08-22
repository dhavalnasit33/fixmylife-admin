'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AssignAdminRoleFormValues, User, PaginatedResponse, RolePermissions } from '@/types';
import { assignAdminRoleSchema } from '@/types';
// import { ALL_PERMISSIONS } from '@/config'; // ALL_ROLES_ARRAY is removed as roles are fetched
import apiService from '@/lib/apiService';
import { CheckIcon, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSelector } from 'react-redux';

interface AssignAdminRoleFormProps {
	onSubmit: (values: AssignAdminRoleFormValues) => Promise<void>;
	isSubmitting: boolean;
	onCancel?: () => void;
}

interface Role {
	_id: string;
	roleName: string;
	permissions: RolePermissions;
}

function AssignAdminRoleForm({ onSubmit, isSubmitting, onCancel }: AssignAdminRoleFormProps) {
	const { toast } = useToast();
	const form = useForm<AssignAdminRoleFormValues>({
		resolver: zodResolver(assignAdminRoleSchema),
		defaultValues: {
			userId: '',
			role: '',
		},
	});

	const [users, setUsers] = useState<User[]>([]);
	const [isLoadingUsers, setIsLoadingUsers] = useState(false);
	const [openUserCombobox, setOpenUserCombobox] = useState(false);
	const [userSearchQuery, setUserSearchQuery] = useState("");
	const [selectedUserDetails, setSelectedUserDetails] = useState<User | null>(null);
	const [selectedRoles, setSelectedRoles] = useState<string>(''); // ✅ allow empty string fallback
	const [roles, setRoles] = useState<Role[]>([]);
	const [isLoadingRoles, setIsLoadingRoles] = useState(false);

	// Permission state — allow partial so {} is valid
	const [permissionState, setPermissionState] = useState<Partial<RolePermissions>>({});
	const [defaultPermissionState, setDefaultPermissionState] = useState<Partial<RolePermissions>>({});
	const [extraPermissions, setExtraPermissions] = useState<Partial<RolePermissions>>({});

	// You need a way to get the created_by_user_id. This is a placeholder.
	const currentAdminUserId = useSelector((state: any) => state.user.user.id); // REPLACE WITH ACTUAL ADMIN USER ID

	const fetchUsers = useCallback(async (query: string) => {
		setIsLoadingUsers(true);
		try {
			const response = await apiService<PaginatedResponse<User>>('/users', {
				params: { search: query, limit: 100, status: 'active' },
			});
			if (response.success) {
				setUsers(response.data);
			} else {
				setUsers([]);
				toast({ title: "Error", description: response.message || "Failed to fetch users.", variant: "destructive" });
			}
		} catch (error: any) {
			setUsers([]);
			toast({ title: "Error", description: error.message || "Could not fetch users.", variant: "destructive" });
		} finally {
			setIsLoadingUsers(false);
		}
	}, [toast]);

	const fetchRoles = useCallback(async () => {
		setIsLoadingRoles(true);
		try {
			const response = await apiService<{ success: boolean; data: Role[]; message?: string }>(`/roleAndPermission/${currentAdminUserId}`);
			if (response.success) {
				setRoles(response.data);
			} else {
				setRoles([]);
				toast({ title: "Error", description: response.message || "Failed to fetch roles.", variant: "destructive" });
			}
		} catch (error: any) {
			setRoles([]);
			toast({ title: "Error", description: error.message || "Could not fetch roles.", variant: "destructive" });
		} finally {
			setIsLoadingRoles(false);
		}
	}, [currentAdminUserId, toast]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (userSearchQuery.length > 0 || (openUserCombobox && userSearchQuery.length === 0)) {
        fetchUsers(userSearchQuery);
      } else if (!openUserCombobox) {
        // Don't clear users here, so the list remains if combobox is simply reopened
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [userSearchQuery, fetchUsers, openUserCombobox]);

  useEffect(() => {
    // Fetch initial list when combobox opens and search is empty
    if (openUserCombobox && userSearchQuery === "" && users.length === 0) {
      fetchUsers("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openUserCombobox, userSearchQuery, users.length, fetchUsers]);

  useEffect(() => {
    fetchRoles(); // Fetch roles on component mount
  }, [fetchRoles]);

	useEffect(() => {
		const selectedRoleId = form.watch("role");
		const selectedRole = roles.find(r => r._id === selectedRoleId);
		setSelectedRoles(selectedRole?.roleName ?? ''); // ✅ fallback to empty string
		if (selectedRole) {
			setPermissionState(JSON.parse(JSON.stringify(selectedRole.permissions)));
			setDefaultPermissionState(JSON.parse(JSON.stringify(selectedRole.permissions)));
			setExtraPermissions({});
		} else {
			setPermissionState({});
			setDefaultPermissionState({});
			setExtraPermissions({});
		}
	}, [form.watch("role"), roles]);

	useEffect(() => {
		const extras: Partial<RolePermissions> = {};
		(Object.keys(permissionState) as Array<keyof RolePermissions>).forEach(menu => {
			extras[menu] = {};
			Object.keys(permissionState[menu] || {}).forEach(perm => {
				if (
					defaultPermissionState[menu] &&
					(permissionState[menu] as any)?.[perm] !== (defaultPermissionState[menu] as any)?.[perm]
				) {
					(extras[menu] as any)[perm] = (permissionState[menu] as any)?.[perm];
				}
			});
			if (Object.keys(extras[menu] as any).length === 0) {
				delete extras[menu];
			}
		});
		setExtraPermissions(extras);
	}, [permissionState, defaultPermissionState]);

	const handleSubmit: SubmitHandler<AssignAdminRoleFormValues> = async (data) => {
		await onSubmit({
			...data,
			extra_permission: extraPermissions as RolePermissions, // cast to full type for submit
		});
		if (!isSubmitting) {
			setSelectedUserDetails(null);
		}
	};

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem className="">
              <FormLabel>Select User</FormLabel>
              <Popover open={openUserCombobox} onOpenChange={setOpenUserCombobox}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between overflow-y-auto",
                        !selectedUserDetails && "text-muted-foreground"
                      )}
                    >
                      {selectedUserDetails
                        ? `${selectedUserDetails.name}`
                        : "Select user..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command shouldFilter={false}> {/* We handle filtering via API */}
                    <CommandInput
                      placeholder="Search user by email or name..."
                      value={userSearchQuery}
                      onValueChange={setUserSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {isLoadingUsers ? "Loading users..." : "No user found."}
                      </CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-48 overflow-auto ">

                          {users.map((user) =>
                            !user.roles.some(role => ["admin", "admin_user"].includes(role.trim().toLowerCase())) && (
                              <CommandItem
                                key={user._id}
                                value={user._id}
                                onSelect={() => {
                                  form.setValue("userId", user._id);
                                  setSelectedUserDetails(user);
                                  setUserSearchQuery("");
                                  setOpenUserCombobox(false);
                                }}
                              >
                                <CheckIcon
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    user._id === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {user.name}{user.roles.includes("Admin") ? "(Admin)" : ""}

                              </CommandItem>
                            )
                          )}
                          {isLoadingUsers && users.length === 0 && <CommandItem disabled>Loading...</CommandItem>}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>Select the user to assign an admin role.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger disabled={isLoadingRoles}>
                    <SelectValue placeholder={isLoadingRoles ? "Loading roles..." : "Select a role"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles.length === 0 && !isLoadingRoles ? (
                    <SelectItem disabled value="">No roles available</SelectItem>
                  ) : (
                    <>
                      {/* <SelectItem value='Admin'>Admin</SelectItem> */}
                      {
                        roles.map((role) => (
                          <SelectItem key={role._id} value={role._id}>{role.roleName}</SelectItem>
                        ))
                      }
                    </>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Permissions Section */}
        {form.watch("role") && Object.keys(permissionState).length > 0 && selectedRoles !== 'Admin_user' && selectedRoles !== 'Admin' && (
          <FormItem>
            <div className="mb-4">
              <FormLabel className="text-base">Permissions</FormLabel>
              <FormDescription>
                Select or update permissions for this role. Changes will be sent as extra permissions.
              </FormDescription>
            </div>
            <ScrollArea className="h-64 rounded-md border p-2">
              <div className="space-y-4">
                {Object.entries(permissionState).map(([menu, perms]) => (
                  <div key={menu} className="mb-2">
                    <div className="font-semibold mb-1">{menu.replace(/([A-Z])/g, ' $1').trim()}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

											{
												Object.entries(perms).map(([perm, value]) => {
													const isViewField = ["ViewMenu", "ViewOnly", "ViewAllData"].includes(perm);
													const otherChecked = Object.entries(perms).some(
														([k, v]) => v && k !== perm && !["ViewMenu", "ViewOnly", "ViewAllData"].includes(k)
													);
													const isForced = isViewField && otherChecked;
													return (
														<div key={perm} className="flex flex-row items-center space-x-2">
															<Checkbox
																checked={isForced ? true : !!value}
																onCheckedChange={(checked) => {
																	setPermissionState((prev : any )=> {
																		const updatedMenu = {
																			...(prev[menu] || {}),
																			[perm]: checked,
																		};

                                    if (checked && !isViewField) {
                                      const viewKey = Object.keys(perms).find(k =>
                                        ["ViewMenu", "ViewOnly", "ViewAllData"].includes(k)
                                      );
                                      if (viewKey) {
                                        updatedMenu[viewKey] = true;
                                      }
                                    }

                                    return {
                                      ...prev,
                                      [menu]: updatedMenu,
                                    };
                                  });
                                }}
                                disabled={isForced || isSubmitting}
                              />
                              <span className="text-sm">
                                {perm.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}
                              </span>
                            </div>
                          )
                        })
                      }
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </FormItem>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && <Button type="button" variant="outline" onClick={() => { setSelectedUserDetails(null); if (onCancel) onCancel(); }} disabled={isSubmitting}>Cancel</Button>}
          <Button type="submit" disabled={isSubmitting || !form.watch("userId")}>
            {isSubmitting ? 'Assigning...' : 'Assign Role'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default AssignAdminRoleForm;