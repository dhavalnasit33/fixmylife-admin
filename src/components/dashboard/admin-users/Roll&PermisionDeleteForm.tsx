'use client'

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import apiService from "@/lib/apiService";
import { roleAndPermission, SingleResponse } from "@/types";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
    Select,
    SelectContent,
    SelectTrigger,
    SelectValue,
    SelectItem
} from "@/components/ui/select";

interface RollandPermissionDeleteProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSuccess: () => void;
}

export default function RollAndPermissionDelete({
    isOpen,
    onOpenChange,
    onSuccess
}: RollandPermissionDeleteProps) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const { user } = useAuth();
    const currentAdminUserId = useSelector((state: any) => state.user.user.id);
    const [roles, setRoles] = useState<roleAndPermission[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState<string>("");

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
    };

    const handleRemove = async () => {
        if (!selectedRoleId || selectedRoleId === '') {
            toast({ title: 'Error', description: 'Please select a role to delete' });
            onOpenChange(false);
            onSuccess();
            return;
        }
        setIsDeleting(true);
        try {
            const response = await apiService<SingleResponse<null>>(`/roleAndPermission/${selectedRoleId}`, {
                method: "DELETE",
            });
            if (response.success) {
                toast({ title: "Success", description: "Role and permissions deleted successfully." });
                onSuccess();
                onOpenChange(false);
            } else {
                toast({ title: "Error", description: response.message, variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Unexpected error", variant: "destructive" });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-xl bg-white rounded-lg p-6">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-semibold text-gray-800">
                        Delete Role & Permissions
                    </AlertDialogTitle>

                    {/* ✅ Proper usage without div inside <p> */}
                    <AlertDialogDescription className="text-sm text-gray-600 mt-1 mb-4">
                        Select a role to delete.
                    </AlertDialogDescription>

                    {/* ✅ Moved outside AlertDialogDescription */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
                        <Select onValueChange={handleRoleSelect} value={selectedRoleId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a role..." />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role: any) => (
                                    role.roleName !== 'Admin_user' &&
                                    <SelectItem key={role._id} value={role._id}>
                                        {role.roleName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting} onClick={() => onOpenChange(false)}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleRemove}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? 'Removing...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
