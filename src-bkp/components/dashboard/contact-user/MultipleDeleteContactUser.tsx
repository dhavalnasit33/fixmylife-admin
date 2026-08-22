'use client';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService";
import { SingleResponse } from "@/types";
import { useState } from "react";

interface MultipleDeleteContactUserDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void; 
    contactUserName: { id: string; name: string }[] | any;
    onSuccess: () => void;
}

export default function MultipleDeleteContactUserDialog({ isOpen, onOpenChange, contactUserName, onSuccess }: MultipleDeleteContactUserDialogProps) { 
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {

        if (contactUserName.length === 0) return;
        setIsDeleting(true);
        try {
            const response = await apiService<SingleResponse<null>>('/contact-user', {
                method: 'DELETE',
                body: contactUserName,
            });
            if (response.success) {
                toast({ title: 'Success', description: response.message || 'Contact users delelted Sucessfully.' });
                onSuccess();
                onOpenChange(false);
            } else {
                toast({ title: 'Error', description: response.message || 'Failed to delete selected contacts.', variant: 'destructive' });
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Failed to delele contact users', variant: 'destructive' });
        } finally {
            setIsDeleting(false);
        }
    }
    if (!contactUserName) return null;

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the following contacts:&nbsp;
                        {Array.isArray(contactUserName) && contactUserName.map((user: any, index: number) => (
                            <span key={user.id}>
                                &quot;<strong>{user.name}</strong>&quot;{index !== contactUserName.length - 1 ? ', ' : ''}
                            </span>
                        ))}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting} onClick={() => onOpenChange(false)} > Cancel </AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {isDeleting ? 'Deleting...' : 'Yes, delete category'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )

}