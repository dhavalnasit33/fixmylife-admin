// @/components/dashboard/admin-users/AssignAdminRoleDialog.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import AssignAdminRoleForm from './AssignAdminRoleForm';
import apiService from '@/lib/apiService';
import type { SingleResponse, AssignAdminRoleFormValues, AdminUser } from '@/types';
import { useToast } from '@/hooks/use-toast';


interface AssignAdminRoleDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
}

export default function AssignAdminRoleDialog({ isOpen, onOpenChange, onSuccess }: AssignAdminRoleDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: AssignAdminRoleFormValues) => {
    console.log("🚀 ~ handleSubmit ~ values:", values)
    setIsSubmitting(true);
    try {
      // The values object already contains userId, role, and extra_permissions
      // The backend API will need to understand how to combine base role permissions
      // with the provided extra_permissions.
      const payload: any = { // Send only necessary data to the backend
        role: values.role, // Backend expects roleId, not just "role"
        extra_permission: values.extra_permission,
      }

      const response = await apiService<SingleResponse<AdminUser>>(`/admin/users/${values.userId}/assign-role`, {
        method: 'POST',
        body: payload
      });

      if (response.success) {
        toast({ title: 'Success', description: response.message || 'Admin role assigned successfully.' });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to assign admin role.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl " >
        <DialogHeader>
          <DialogTitle>Assign Admin Role</DialogTitle>
          <DialogDescription>
            Select a user, assign a role, and define specific permissions.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[70vh] overflow-y-auto pr-2">
          <AssignAdminRoleForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}