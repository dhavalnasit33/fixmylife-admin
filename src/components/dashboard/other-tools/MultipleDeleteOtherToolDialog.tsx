'use client';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService";
import { useState } from "react";

interface MultipleDeleteToolDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    tools: { id: String, name: String }[];
    onSuccess: () => void;
    apiEndpoint: string; // e.g. "/writing-tools"
}

export default function MultipleDeleteOtherToolDialog({ 
    isOpen, 
    onOpenChange, 
    tools, 
    onSuccess, 
    apiEndpoint 
}: MultipleDeleteToolDialogProps) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!tools || tools.length === 0) return;
        setIsDeleting(true);
        try {
            const response = await apiService<{ success: boolean; message: string }>(apiEndpoint, {
                method: 'DELETE',
                body: tools // Expecting array of objects with id
            });
            
            if (response.success) {
                toast({title: 'Success', description: response.message || 'Tools deleted successfully.'});
                onSuccess();
                onOpenChange(false);
            } else {
                toast({title: 'Error', description: response.message || 'Failed to delete tools.', variant:"destructive"});
            }
        } catch (error: any) {
            toast({title:'Error', description: error.message || 'Failed to delete tools.', variant:"destructive"});
        } finally {
            setIsDeleting(false);
        }
    }

    if (!tools) return null;

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange} >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the following tools: &nbsp;
                        <div className="mt-2 max-h-[100px] overflow-y-auto text-sm">
                            {tools.map((item, index) => (
                                <span key={`${item.id}-${index}`}>
                                    &quot;<strong>{item.name}</strong>&quot;{index !== tools.length - 1 ? ", " : ""}
                                </span>
                            ))}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting} onClick={()=> onOpenChange(false)} >Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {isDeleting ? 'Deleting...' : 'Yes, delete selected'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}