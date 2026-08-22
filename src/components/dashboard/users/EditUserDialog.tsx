"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import UserForm from "./UserForm";
import apiService from "@/lib/apiService";
import type { User, SingleResponse, UserUpdateFormValues, Plan, EditUserFormValues } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface EditUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User | null;
  onSuccess: () => void;
  availablePlans: Plan[];
}

export default function EditUserDialog({
  isOpen,
  onOpenChange,
  user: initialUser,
  onSuccess,
  availablePlans,
}: EditUserDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<User | null>(initialUser);

  useEffect(() => {
    if (isOpen && initialUser) {
      setCurrentUserData(initialUser);
    } else if (!isOpen) {
      setCurrentUserData(null);
    }
  }, [isOpen, initialUser]);

  const handleSubmit = async (values: EditUserFormValues) => {
    if (!currentUserData?._id) return;
    const combinedName = `${values.firstName.trim()} ${values.lastName.trim()}`.trim();

    // Create payload without password if it's empty
    const payload = {
      ...values,
      name: combinedName,
    };

    // Remove password from payload if it's empty (optional field)
    if (!payload.password || payload.password.trim() === '') {
      delete payload.password;
    }
    setIsSubmitting(true);
    try {
      const response = await apiService<SingleResponse<User>>(
        `/users/${currentUserData._id}`,
        {
          method: "PUT",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.success) {
        toast({ title: "Success", description: "User updated successfully." });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update user.",
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
      setIsSubmitting(false);
    }
  };

  function isValidGender(
  gender: any
): gender is "male" | "female" | "other" {
  return gender === "male" || gender === "female" || gender === "other";
}
const splitName = (fullName: string) => {
  const parts = fullName.split(' ');
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
  };
};

const mappedUser =
  currentUserData === null
    ? null
    : {
        ...currentUserData,
        gender: isValidGender(currentUserData.gender)
          ? currentUserData.gender
          : undefined,
        profile_picture:
          currentUserData.profile_picture === null
            ? undefined
            : currentUserData.profile_picture,
        // Add these two fields for the form:
        ...splitName(currentUserData.name || ''),
      };



  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User: {mappedUser?.name}</DialogTitle>
          <DialogDescription>
            Modify the user&apos;s details below.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {mappedUser ? (
            <UserForm
              initialData={mappedUser}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => onOpenChange(false)}
              availablePlans={availablePlans}
              isEditMode={true}
            />
          ) : (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-8 w-20 ml-auto" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
