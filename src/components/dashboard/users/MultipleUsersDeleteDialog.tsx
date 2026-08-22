'use client';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService";
import { SingleResponse } from "@/types";
import { useState } from "react";

interface MultipleUsersDeleteDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    users: { id: String, name: String }[] | any;
    onSuccess: () => void;
}

export default function MultipleUsersDeleteDialog({isOpen, onOpenChange, users, onSuccess}: MultipleUsersDeleteDialogProps) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        console.log(users);
        if (users.length === 0)  return ;
        setIsDeleting(true);
        try {
            const responce = await apiService<SingleResponse<null>>('/users',{
                method:'DELETE',
                body: users
            });
            if (responce.success) {
                toast({title:'Success', description: responce.message || 'Users are deleted successfully.'});
                onSuccess();
                onOpenChange(false);
            }

        } catch (error: any) {
            toast({title: 'Error', description: error.message || 'Failed to deleting users.', variant:'destructive'});
        } finally {
            setIsDeleting(false);
        }
    }

    if (!users) return null;
    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete following Users: &nbsp;
                        {Array.isArray(users) &&
                            users.map((item, index) => (
                                <span key={item.id}>
                                    &quot; <strong>{item?.name}</strong>&quot; {index !== users.length - 1 ? ", " : ""}
                                </span>
                        ))}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting} onClick={ () => onOpenChange(false) } > Cancel </AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                       { isDeleting ? 'Deleting...' : 'Yes, delete category'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )    
}
