'use client';

import { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService";
import { useAuth } from "@/hooks/useAuth";
import { SingleResponse, roleAndPermission } from "@/types";
import { useSelector } from "react-redux";

interface Props {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSuccess: () => void;
}

export default function EditRoleAndPermissionForm({ isOpen, onOpenChange, onSuccess }: Props) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [roles, setRoles] = useState<roleAndPermission[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState<string>("");
    const [initialPermissions, setInitialPermissions] = useState<any>({});

    const { control, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: {
            roleId: "",
            roleName: "",
            permissions: {},
        },
        mode: "onChange",
    });
    const currentAdminUserId = useSelector((state: any) => state.user.user.id);

    const watchPermissions = useWatch({ control, name: "permissions" });

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const res = await apiService<SingleResponse<roleAndPermission[]>>(`/roleAndPermission/${currentAdminUserId}`);
                if (res.success) {
                    setRoles(res.data || []);
                } else {
                    toast({ title: "Error", description: "Failed to fetch roles", variant: "destructive" });
                }
            } catch (error: any) {
                toast({ title: "Error", description: error.message || "Unexpected error", variant: "destructive" });
            }
        };

        if (isOpen) {
            fetchRoles();
        }
    }, [isOpen]);

    const handleRoleSelect = (roleId: string) => {
        setSelectedRoleId(roleId);
        const selected = roles.find((r) => r._id === roleId);
        if (selected) {
            const cleanPermissions = JSON.parse(JSON.stringify(selected.permissions || {}));
            setValue("roleId", selected._id);
            setValue("roleName", selected.roleName);
            setValue("permissions", cleanPermissions);
            setInitialPermissions(cleanPermissions);
        }
    };

    const renderPermissionCheckboxes = ( control: any, path: string, obj: any, watchPermissions: any ) => {
        return Object.entries(obj).map(([key, value]) => {
            const currentPath = path ? `${path}.${key}` : key;

            if (typeof value === "boolean") {
                return (
                    <div key={currentPath} className="flex items-center gap-2">
                        <Controller
                            name={currentPath}
                            control={control}
                            render={({ field }) => {
                                const pathParts = currentPath.split(".");
                                const menuKey = pathParts[1];
                                const permissionKey = pathParts[2];

                                const menuPermissions = watchPermissions?.[menuKey] || {};

                                const isView =
                                    permissionKey === "ViewMenu" ||
                                    permissionKey === "ViewOnly" ||
                                    permissionKey === "ViewAllData";

                                const otherChecked = Object.entries(menuPermissions).some(
                                    ([perm, val]) =>
                                        !["ViewMenu", "ViewOnly", "ViewAllData"].includes(perm) &&
                                        val === true
                                );

                                const isSeoCreateNew =
                                    menuKey === "SeoMenu" && permissionKey === "CreateNew";
                                const isSeoEditChecked =
                                    watchPermissions?.SeoMenu?.Edit === true;

                                const forcedCheck =
                                    (isView && otherChecked) ||
                                    (isSeoCreateNew && isSeoEditChecked);

                                // Auto-check
                                useEffect(() => {
                                    if (forcedCheck && !field.value) {
                                        field.onChange(true);
                                    }
                                }, [forcedCheck]);

                                // Auto-uncheck CreateNew if Edit is unchecked
                                useEffect(() => {
                                    if (
                                        isSeoCreateNew &&
                                        !isSeoEditChecked &&
                                        field.value
                                    ) {
                                        field.onChange(false);
                                    }
                                }, [isSeoEditChecked]);

                                return (
                                    <>
                                        <Checkbox
                                            checked={forcedCheck ? true : !!field.value}
                                            disabled={forcedCheck}
                                            onCheckedChange={(checked) =>
                                                field.onChange(checked)
                                            }
                                        />
                                        <label className="text-sm text-gray-700">
                                            {permissionKey}
                                        </label>
                                    </>
                                );
                            }}
                        />
                    </div>
                );
            } else if (typeof value === "object" && value !== null) {
                return (
                    <div
                        key={currentPath}
                        className=" h-full flex flex-col  border  border-gray-200 rounded-md py-4 px-2 bg-gray-50 shadow-sm "
                    >
                        <div className="font-medium text-gray-800 text-base mb-4">{key}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-2">
                            {renderPermissionCheckboxes(
                                control,
                                currentPath,
                                value,
                                watchPermissions
                            )}
                        </div>
                    </div>
                );
            }

            return null;
        });
    };

    const onSubmit = async (data: any) => {
        if (!data.roleId) return;
        setIsSubmitting(true);
        try {
            const response = await apiService<SingleResponse<null>>(`/roleAndPermission/update`, {
                method: "PUT",
                body: {
                    role_id: data.roleId,
                    role_name: data.roleName,
                    permissions: data.permissions,
                    updated_by_user_id: currentAdminUserId,
                },
            });

            if (response.success) {
                toast({ title: "Success", description: "Permissions updated successfully." });
                onSuccess();
                onOpenChange(false);
                reset();
            } else {
                toast({ title: "Error", description: response.message, variant: "destructive" });
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Unexpected error", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-7xl bg-white rounded-lg p-6">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold text-gray-800">
                        Edit Role & Permissions
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-600 mt-1 mb-4">
                        Select a role to update its name and permissions.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[72vh] overflow-y-auto px-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
                        <Select onValueChange={handleRoleSelect} value={selectedRoleId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a role..." />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    role.roleName !== 'Admin_user' && role.roleName !== 'Admin' &&
                                    <SelectItem key={role._id} value={role._id}>
                                        {role.roleName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedRoleId && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                                <Controller
                                    name="roleName"
                                    control={control}
                                    rules={{
                                        maxLength: {
                                            value: 50,
                                            message: "Role name must be 50 characters or less",
                                        },
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <Input placeholder="Role Name" {...field} maxLength={50} />
                                            <span className="text-sm text-gray-500 float-end mt-1">
                                                {watch("roleName")?.length || 0}/50 characters
                                            </span>
                                            {fieldState.error && (
                                                <p className="text-sm text-red-500 mt-1">{fieldState.error.message}</p>
                                            )}
                                        </>
                                    )}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Permissions
                                </label>
                                <div className=" border grid grid-cols-1 lg:grid-cols-3 gap-2 border-gray-200 rounded-md p-4 max-h-[500px] overflow-y-auto bg-white items-stretch ">
                                    {renderPermissionCheckboxes(control, "permissions", initialPermissions, watchPermissions)}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                reset();
                                onOpenChange(false);
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !selectedRoleId} className="bg-purple-600 text-white hover:bg-purple-700">
                            {isSubmitting ? "Saving..." : "Update Role"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
