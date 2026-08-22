'use client';

import { useState } from 'react';
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
import apiService from '@/lib/apiService';
import type { AdminUser, SingleResponse } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface RemoveAdminRoleDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  adminUser: AdminUser | null;
  onSuccess: () => void;
}

export default function RemoveAdminRoleDialog({
  isOpen,
  onOpenChange,
  adminUser,
  onSuccess
}: RemoveAdminRoleDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRemove = async () => {
    if (!adminUser?._id) return;
    setIsDeleting(true);
    try {
      const response = await apiService<SingleResponse<null>>(`/admin/users/${adminUser._id}`, {
        method: 'DELETE'
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: response.message || `Admin role removed from ${adminUser.user_id.name}.`
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to remove admin role.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!adminUser) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will remove the admin role from user&nbsp;
            <strong>{adminUser.user_id.name}</strong> (
            <strong>{adminUser.role.roleName}</strong>).
            They will revert to a standard user if they have no other admin roles.
          </AlertDialogDescription>
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
            {isDeleting ? 'Removing...' : 'Yes, remove admin role'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
