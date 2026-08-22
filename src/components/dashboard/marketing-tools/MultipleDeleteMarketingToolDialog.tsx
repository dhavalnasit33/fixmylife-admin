'use client';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService";
import { SingleResponse } from "@/types"; 
import { useState } from "react";

interface MultipleDeleteToolDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    tool: { id: String, name: String }[] | any;
    onSuccess: () => void;
}


export default function MultipleDeleteMarketingToolDialog({ isOpen, onOpenChange, tool, onSuccess }: MultipleDeleteToolDialogProps) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        console.log(tool)
        if (tool.length === 0) return ;
        setIsDeleting(true);
        try {
            const response = await apiService<SingleResponse<null>>('/marketing-tools',{
                method: 'DELETE',
                body: tool
            });
            if (response.success) {
                toast({title: 'Success', description: response.message || 'Tools are deleted Sucessfully.'});
                onSuccess();
                onOpenChange(false);
            }else {
                toast({title: 'Error', description: response.message || 'Failed to deleting tools.', variant:"destructive"});
            }
        } catch (error: any) {
            toast({title:'Error', description: error.message || 'Failed to deleting tools.', variant:"destructive"});
        }finally {
            setIsDeleting(false);
        }
    }
    if (!tool) return null;
    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange} >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete following tools: &nbsp;
                        {Array.isArray(tool) &&
                            tool.map((item, index) => (
                                <span key={item.id}>
                                    &quot; <strong>{item?.name}</strong>&quot; {index !== tool.length - 1 ? ", " : ""}
                                </span>
                        ))}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting} onClick={()=> onOpenChange(false)} >Cancel</AlertDialogCancel>
                    <AlertDialogAction  onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {isDeleting ? 'Deleting...' : 'Yes, delete category'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}