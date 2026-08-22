'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { updateAdminPermissionsSchema } from '@/types';
import type { RolePermissions, UpdateAdminPermissionsFormValues, AdminUser } from '@/types';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/lib/apiService';
import { useSelector } from 'react-redux';

interface Role {
  _id: string;
  roleName: string;
  permissions: RolePermissions;
}

interface EditAdminPermissionsFormProps {
  initialData: {
    role: string;
    extra_permission: RolePermissions;
    adminUser: AdminUser;
  };
  onSubmit: (values: UpdateAdminPermissionsFormValues & { extra_permission: RolePermissions }) => Promise<void>;
  isSubmitting: boolean;
  onCancel?: () => void;
}

export default function EditAdminPermissionsForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel
}: EditAdminPermissionsFormProps) {
  const { toast } = useToast();
  const form = useForm<UpdateAdminPermissionsFormValues>({
    resolver: zodResolver(updateAdminPermissionsSchema),
    defaultValues: {
      role: initialData.role
    }
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionState, setPermissionState] = useState<RolePermissions>({});
  const [defaultPermissionState, setDefaultPermissionState] = useState<RolePermissions>({});
  const [extraPermissions, setExtraPermissions] = useState<RolePermissions>({});
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState('');  

  const currentAdminUserId = useSelector((state: any) => state.user.user.id);

  const fetchRoles = useCallback(async () => {
    setIsLoadingRoles(true);
    try {
      const response = await apiService<{ success: boolean; data: Role[]; message?: string }>(
        `/roleAndPermission/${currentAdminUserId}`
      );
      if (response.success) {
        setRoles(response.data);
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to fetch roles.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Could not fetch roles.', variant: 'destructive' });
    } finally {
      setIsLoadingRoles(false);
    }
  }, [currentAdminUserId, toast]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Update permissions when role changes
  useEffect(() => {
    const selectedRole = roles.find(r => r._id === form.watch('role'));
    setSelectedRoles(selectedRole?.roleName);
    if (selectedRole) {
      setDefaultPermissionState(JSON.parse(JSON.stringify(selectedRole.permissions)));
      // Merge role default permissions with extra
      const mergedPermissions: RolePermissions = {};
      for (const menu in selectedRole.permissions) {
        mergedPermissions[menu] = { ...selectedRole.permissions[menu], ...(initialData.extra_permission?.[menu] || {}) };
      }
      setPermissionState(mergedPermissions);
    }
  }, [form.watch('role'), roles, initialData.extra_permission]);

  // Compute extra_permissions when permissionState changes
  useEffect(() => {
    const extras: RolePermissions = {};
    for (const menu in permissionState) {
      for (const perm in permissionState[menu]) {
        const current = permissionState[menu][perm];
        const original = defaultPermissionState?.[menu]?.[perm];
        if (current !== original) {
          if (!extras[menu]) extras[menu] = {};
          extras[menu][perm] = current;
        }
      }
    }
    setExtraPermissions(extras);
  }, [permissionState, defaultPermissionState]);

  const handleSubmit: SubmitHandler<UpdateAdminPermissionsFormValues> = async (data) => {
    await onSubmit({
      ...data,
      extra_permission: extraPermissions
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger disabled={isLoadingRoles}>
                    <SelectValue placeholder={isLoadingRoles ? 'Loading roles...' : 'Select a role'} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role._id} value={role._id}>
                      {role.roleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {Object.keys(permissionState).length > 0 && selectedRoles != 'Admin' && selectedRoles!=='Admin_user' && (
          <FormItem>
            <FormLabel className="text-base">Permissions</FormLabel>
            <FormDescription>
              Modify permission overrides. Changes from default will be saved as extra permissions.
            </FormDescription>
            <ScrollArea className="h-64 rounded-md border p-2">
              <div className="space-y-4">
                {Object.entries(permissionState).map(([menu, perms]) => (
                  <div key={menu}>
                    <div className="font-semibold mb-1">{menu.replace(/([A-Z])/g, ' $1').trim()}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* {Object.entries(perms).map(([perm, value]) => (
                        <div key={perm} className="flex items-center space-x-2">
                          <Checkbox
                            checked={!!value}
                            onCheckedChange={(checked) => {
                              setPermissionState(prev => {
                                const updatedMenu = {
                                  ...(prev[menu] || {}),
                                  [perm]: checked,
                                };

                                // Auto-enable ViewMenu if another permission is checked
                                if (
                                  checked &&
                                  perm !== 'ViewMenu' &&
                                  'ViewMenu' in updatedMenu
                                ) {
                                  updatedMenu['ViewMenu'] = true;
                                }

                                return {
                                  ...prev,
                                  [menu]: updatedMenu,
                                };
                              });
                            }}
                            disabled={isSubmitting}
                          />

                          <span className="text-sm">{perm.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</span>
                        </div>
                      ))} */}
                      {
                        Object.entries(perms).map(([perm, value]) => {
                          const isViewField = ["ViewMenu", "ViewOnly", "ViewAllData"].includes(perm);
                          const otherChecked = Object.entries(perms).some(
                            ([k, v]) => v && k !== perm && !["ViewMenu", "ViewOnly", "ViewAllData"].includes(k)
                          );
                          const isForced = isViewField && otherChecked;
                          return (
                            <div key={perm} className="flex items-center space-x-2">
                              <Checkbox
                                checked={isForced ? true : !!value}
                                onCheckedChange={(checked) => {
                                  setPermissionState(prev => {
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
                          );
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
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
