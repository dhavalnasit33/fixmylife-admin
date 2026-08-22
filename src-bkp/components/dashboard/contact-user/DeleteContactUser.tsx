'use client';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService";
import { ContactUser, SingleResponse } from "@/types";
import { useState } from "react";

interface DeleteContactUserDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    contact: ContactUser | any;
    onSuccess: () => void;
}
export default function DeleteContactUserDialog({ isOpen, onOpenChange, contact, onSuccess }: DeleteContactUserDialogProps) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const handleDelete = async () => {
        console.log("🚀 ~ DeleteContactUserDialog ~ contact:", contact._id)
        
        if (!contact?._id) return ;
        setIsDeleting(true);
        try {
            const responce  = await apiService<SingleResponse<null>>(
                `/contact-user/${contact._id}`, {
                    method: "DELETE",
                });
            if (responce.success) {
                toast({title: 'Success', description: responce.message || 'Contact user delelted Sucessfully.' });
                onSuccess();
                onOpenChange(false);
            }else {
                toast({ title: 'Error', description: responce.message || 'Failed to delete contact user category ', variant: 'destructive' });
            }
        } catch (error : any) {
            toast({title: 'Error', description: error.message || 'Failed to delete contact user category ', variant: 'destructive' });
        } finally {
            setIsDeleting(false);
        }
    }

    if (!contact) return null;
    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the contact.
                        &quot;<strong>{contact.name}</strong>&quot;.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting} onClick={() => onOpenChange(false)}> Cancel </AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {isDeleting ? 'Deleting...' : 'Yes, delete category'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}