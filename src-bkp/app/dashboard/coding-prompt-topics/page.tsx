"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Edit, Trash2, Search, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import ProtectedPage from "@/components/shared/ProtectedPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import apiService from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { PaginatedResponse, SingleResponse, CodingPromptTopic } from "@/types";
import DeleteCodingPromptTopicDialog from "@/components/dashboard/coding-prompt-topics/DeleteCodingPromptTopicDialog";
import MultipleDeleteCodingPromptTopicDialog from "@/components/dashboard/coding-prompt-topics/MultipleDeleteCodingPromptTopicDialog";
// Reuse delete dialogs or create generic ones. For brevity, assuming generic logic here
// You can reuse DeletePromptDataDialog by passing correct props or duplicate it for "CodingPromptTopic"

const ITEMS_PER_PAGE = 10;

export default function CodingPromptTopicsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { hasPermission } = useAuth(); // Ensure you have permission strings in your config

    const [data, setData] = useState<CodingPromptTopic[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<CodingPromptTopic | null>(null);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    // Ensure selectedItems uses 'title' not 'name'
    const [selectedItems, setSelectedItems] = useState<{ id: string; title: string }[]>([]);
    // Permission checks (Update permission strings as per your Sidebar config)
    const canManage = hasPermission("viewCodingPromptTopicMenu"); // Or specific "viewCodingTopicMenu"
    const canCreate = hasPermission("createCodingPromptTopicMenu");
    const canEdit = hasPermission("editCodingPromptTopicMenu");
    const canDelete = hasPermission("deleteCodingPromptTopicMenu");
    const canManageStatus = hasPermission("codingPromptTopicMenuStatusChange");

    const fetchData = useCallback(async (page = 1, search = "") => {
        setIsLoading(true);
        try {
            // NOTE: Using the API endpoint we created in the backend step
            const response = await apiService<PaginatedResponse<CodingPromptTopic>>(
                "/coding-prompt-topics",
                { params: { page, limit: ITEMS_PER_PAGE, search, all: "true" } }
            );
            if (response.success) {
                setData(response.data);
                setCurrentPage(response.pagination.current);
                setTotalPages(response.pagination.pages);
                setTotalItems(response.pagination.total);
            }
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to fetch topics.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (canManage) fetchData(currentPage, searchTerm);
        else setIsLoading(false);
    }, [currentPage, searchTerm, fetchData, canManage]);

    const handleToggleActive = async (topic: CodingPromptTopic) => {
        try {
            const response = await apiService<SingleResponse<{ is_active: boolean }>>(
                `/coding-prompt-topics/${topic._id}/toggle`,
                { method: "PATCH" }
            );
            if (response.success) {
                toast({ title: "Success", description: "Status updated." });
                setData((prev) =>
                    prev.map((item) =>
                        item._id === topic._id ? { ...item, is_active: response.data.is_active } : item
                    )
                );
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await apiService(`/coding-prompt-topics/${id}`, { method: "DELETE" });
            toast({ title: "Deleted", description: "Topic deleted successfully" });
            fetchData(currentPage, searchTerm);
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    }

    const toggleSelectAll = () => {
        if (selectedItems.length === data.length) setSelectedItems([]);
        else setSelectedItems(data.map((item) => ({ id: item._id, title: item.title })));
    };

    const toggleSelectOne = (id: string, title: string) => {
        const isSelected = selectedItems.some((i) => i.id === id);
        if (isSelected) setSelectedItems((prev) => prev.filter((i) => i.id !== id));
        else setSelectedItems((prev) => [...prev, { id, title }]);
    };

    return (
        <ProtectedPage requiredPermission="viewCodingPromptTopicMenu">
            <PageHeader
                title="Coding Prompt Topics"
                description="Manage main coding topics and their sub-prompts."
                actionButtons={
                    canCreate && (
                        <Button onClick={() => router.push("/dashboard/coding-prompt-topics/create")}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Create New
                        </Button>
                    )
                }
            />

            <div className="mb-4 flex items-center justify-between gap-2">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search topics..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                {canDelete && (
                    <Button
                        variant="destructive"
                        onClick={() => setIsBulkDeleteDialogOpen(true)}
                        disabled={selectedItems.length === 0}
                    >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                    </Button>
                )}
            </div>

            <div className="rounded-md border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {/* <TableHead>Icon</TableHead> */}
                            {canDelete && (
                                <TableHead className="w-[40px]">
                                    <input
                                        type="checkbox"
                                        checked={
                                            selectedItems.length === data.length && data.length > 0
                                        }
                                        onChange={toggleSelectAll}
                                    />
                                </TableHead>
                            )}
                            <TableHead>Title</TableHead>
                            <TableHead className="hidden md:table-cell">Description</TableHead>
                            {/* <TableHead>Subtopics</TableHead> */}
                            <TableHead className="text-center">Active</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                            ))
                        ) : data.length > 0 ? (
                            data.map((item) => (
                                <TableRow key={item._id}>
                                    {canDelete && (
                                        <TableCell>
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.some((i) => i.id === item._id)}
                                                onChange={() => toggleSelectOne(item._id, item.title)}
                                            />
                                        </TableCell>
                                    )}
                                    {/* <TableCell>
                                        {item.icon ? (
                                            <img src={item.icon} alt={item.title} className="h-8 w-8 rounded object-cover" />
                                        ) : <div className="h-8 w-8 bg-muted rounded" />}
                                    </TableCell> */}
                                    <TableCell className="font-medium">{item.title}</TableCell>
                                    <TableCell className="hidden md:table-cell max-w-xs truncate text-muted-foreground">
                                        {item.description}
                                    </TableCell>
                                    {/* <TableCell>
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                                            {item.subtopics?.length || 0}
                                        </span>
                                    </TableCell> */}
                                    {canManageStatus && (
                                        <TableCell className="text-center">
                                            <Switch
                                                checked={item.is_active}
                                                onCheckedChange={() => handleToggleActive(item)}
                                                aria-label={`Toggle ${item.title} status`}
                                                disabled={!canEdit}
                                            />
                                        </TableCell>
                                    )}
                                    {(canEdit || canDelete) && (
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {canEdit && (
                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/coding-prompt-topics/${item._id}/edit`)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                    )}
                                                    {canDelete && (
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedItem(item);
                                                                setIsDeleteDialogOpen(true);
                                                            }}
                                                            className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={6} className="text-center h-24">No topics found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)}{" "}
                    to {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of{" "}
                    {totalItems} prompts
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || isLoading}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                        }
                        disabled={currentPage === totalPages || isLoading}
                    >
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>
            {canDelete && selectedItem && (
                <DeleteCodingPromptTopicDialog
                    isOpen={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    topic={selectedItem}
                    onSuccess={() => fetchData(currentPage, searchTerm)}
                />
            )}

            {canDelete && selectedItems.length > 0 && (
                <MultipleDeleteCodingPromptTopicDialog
                    isOpen={isBulkDeleteDialogOpen}
                    onOpenChange={setIsBulkDeleteDialogOpen}
                    topics={selectedItems}
                    onSuccess={() => {
                        fetchData(currentPage, searchTerm);
                        setSelectedItems([]);
                    }}
                />
            )}
            {/* Add Pagination Controls here (same as your other pages) */}
        </ProtectedPage>
    );
}