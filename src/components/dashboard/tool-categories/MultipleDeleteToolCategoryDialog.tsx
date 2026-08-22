'use client';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService";
import { SingleResponse } from "@/types";
import { useState } from "react";

interface MultipleDeleteToolCategoryDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    categories: { id: String, name: String }[] | any;
    onSuccess: () => void;
}

export default function MultipleDeleteToolCategoryDialog({ isOpen, onOpenChange, categories, onSuccess }: MultipleDeleteToolCategoryDialogProps) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

     const handleDelete = async () => {
        console.log(categories);
        if (categories.length == 0) return;
        setIsDeleting(true);
        try {
            const responce = await apiService<SingleResponse<null>>('/tool-categories', {
                method: 'DELETE',
                body : categories
            })
            if (responce.success) {
                toast({title: 'Success', description: responce.message || 'Tool Categories are deleted Sucessfully.'});
                onSuccess();
                onOpenChange(false);
            } else {
                toast({title: 'Error', description: responce.message || 'Failed to deleting Tool Categories.', variant: "destructive"})
            }
        } catch (error : any) {
            toast({title:'Error', description: error.message || 'Failed to deleting Tool Category.', variant:"destructive" })
        }finally {
            setIsDeleting(false);
        }
    }

    if (!categories) return null;
    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        <span>
                            This action cannot be undone. This will permanently delete following tool categories: &nbsp;
                            {Array.isArray(categories) &&
                                categories.map((item, index) => (
                                    <span key={item.id}>
                                        &quot; <strong>{item?.name}</strong>&quot; {index !== categories.length - 1 ? ", " : ""}
                                    </span>
                                ))
                            }
                        </span>
                        <span>  Note : If a category is associated with tools, the removal of the category from a tool is handled by the server.  </span>
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



