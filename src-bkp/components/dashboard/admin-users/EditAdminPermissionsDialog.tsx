'use client';

import { useState } from 'react'; // No need for useEffect now that initial permissions flattening is gone
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import EditAdminPermissionsForm from './EditAdminPermissionsForm';
import apiService from '@/lib/apiService';
import type { AdminUser, SingleResponse, UpdateAdminPermissionsFormValues } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface EditAdminPermissionsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  adminUser: AdminUser | null;
  onSuccess: () => void;
}

// REMOVE flattenPermissions and unflattenPermissions utility functions
// as they are no longer needed.

export default function EditAdminPermissionsDialog({ isOpen, onOpenChange, adminUser, onSuccess }: EditAdminPermissionsDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: UpdateAdminPermissionsFormValues & { extra_permission: any }) => {
    if (!adminUser?._id) return;
    setIsSubmitting(true);
    try {
      const payload: any = {
        role: values.role,
        extra_permission: values.extra_permission,
      }

      const response = await apiService<SingleResponse<AdminUser>>(`/admin/users/${adminUser._id}`, {
        method: 'PUT',
        body: payload
      });

      if (response.success) {
        toast({ title: 'Success', description: response.message || 'Admin role updated successfully.' });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to update admin role.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare initial data for the form: role, extra_permission, and adminUser
  const initialFormRole = adminUser?.role?._id || '';
  const initialExtraPermission : any = adminUser?.extra_permission || {};

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Admin Role for {adminUser?.user_id.name}</DialogTitle>
          <DialogDescription>
            Change the assigned role for this admin user. Permissions will be set by the chosen role, with extra permissions as needed.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[70vh] overflow-y-auto pr-2">
          {adminUser && (
            <EditAdminPermissionsForm
              initialData={{ role: initialFormRole, extra_permission: initialExtraPermission, adminUser }}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => onOpenChange(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}