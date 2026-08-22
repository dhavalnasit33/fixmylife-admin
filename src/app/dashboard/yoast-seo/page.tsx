// "use client";

// import { useState, useEffect, useCallback } from "react";
// import PageHeader from "@/components/shared/PageHeader";
// import ProtectedPage from "@/components/shared/ProtectedPage";
// import { Button } from "@/components/ui/button";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
//   MoreHorizontal,
//   Trash2,
//   ChevronLeft,
//   ChevronRight,
//   PlusCircle,
//   Edit,
// } from "lucide-react";
// import apiService from "@/lib/apiService";
// import type { YoastSeo, PaginatedResponse } from "@/types";
// import { useToast } from "@/hooks/use-toast";
// import { useAuth } from "@/hooks/useAuth";
// import { Skeleton } from "@/components/ui/skeleton";
// import DeleteYoastSeoDialog from "@/components/dashboard/yoast-seo/DeleteYoastSeoDialog";
// import MultipleDeleteYoastSeoDialog from "@/components/dashboard/yoast-seo/MultipleDeleteYoastSeoDialog";
// import CreateYoastSeoDialog from "@/components/dashboard/yoast-seo/CreateYoastSeoDialog";
// import EditYoastSeoDialog from "@/components/dashboard/yoast-seo/EditYoastSeoDialog";

// const ITEMS_PER_PAGE = 10;

// export default function YoastSeoPage() {
//   const { toast } = useToast();
//   const { hasPermission } = useAuth();
//   const [yoastRecords, setYoastRecords] = useState<YoastSeo[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalItems, setTotalItems] = useState(0);
//   const [selectedYoast, setSelectedYoast] = useState<YoastSeo | null>(null);
//   const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
//   const [selectedRecords, setSelectedRecords] = useState<
//     { id: string; title: string }[]
//   >([]);
//   const [isMultipleRemoveDialogOpen, setIsMultipleRemoveDialogOpen] =
//     useState(false);
//   const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
//   const [selectedEditRecord, setSelectedEditRecord] = useState<YoastSeo | null>(
//     null
//   );
//   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

//   const canManageRoles = hasPermission("manage_roles");

//   const fetchYoastRecords = useCallback(
//     async (page = 1) => {
//       setIsLoading(true);
//       try {
//         const response = await apiService<PaginatedResponse<YoastSeo>>(
//           "/yoast-seo",
//           {
//             params: { page, limit: ITEMS_PER_PAGE },
//           }
//         );
//         if (response.success) {
//           setYoastRecords(response.data);
//           setCurrentPage(response.pagination.current);
//           setTotalPages(response.pagination.pages);
//           setTotalItems(response.pagination.total);
//           setSelectedRecords([]);
//         } else {
//           toast({
//             title: "Error",
//             description: "Failed to fetch Yoast records.",
//             variant: "destructive",
//           });
//         }
//       } catch (error: any) {
//         toast({
//           title: "Error",
//           description: error.message || "Unexpected error.",
//           variant: "destructive",
//         });
//       } finally {
//         setIsLoading(false);
//       }
//     },
//     [toast]
//   );

//   useEffect(() => {
//     if (canManageRoles) {
//       fetchYoastRecords(currentPage);
//     } else {
//       setIsLoading(false);
//       setYoastRecords([]);
//     }
//   }, [fetchYoastRecords, canManageRoles, currentPage]);

//   const openRemoveDialog = (record: YoastSeo) => {
//     if (!canManageRoles) return;
//     setSelectedYoast(record);
//     setIsRemoveDialogOpen(true);
//   };

//   const handleRemoveSuccess = () => {
//     fetchYoastRecords(
//       yoastRecords.length === 1 && currentPage > 1
//         ? currentPage - 1
//         : currentPage
//     );
//     setIsRemoveDialogOpen(false);
//     setSelectedYoast(null);
//   };

//   const openMultipleRemoveDialog = () => {
//     if (!canManageRoles) return;
//     setIsMultipleRemoveDialogOpen(true);
//   };

//   const handleMultipleRemoveSuccess = () => {
//     fetchYoastRecords(
//       yoastRecords.length === 1 && currentPage > 1
//         ? currentPage - 1
//         : currentPage
//     );
//     setIsMultipleRemoveDialogOpen(false);
//     setSelectedRecords([]);
//   };

//   const handleSeoCreated = () => {
//     fetchYoastRecords(1);
//     setIsCreateDialogOpen(false);
//   };

//   const toggleSelectAll = () => {
//     if (selectedRecords.length === yoastRecords.length) {
//       setSelectedRecords([]);
//     } else {
//       setSelectedRecords(
//         yoastRecords.map((r) => ({
//           id: r._id,
//           title: r.seo_title || "Untitled",
//         }))
//       );
//     }
//   };

//   const toggleSelectOne = (record: YoastSeo) => {
//     setSelectedRecords((prev) => {
//       const exists = prev.find((r) => r.id === record._id);
//       if (exists) {
//         return prev.filter((r) => r.id !== record._id);
//       } else {
//         return [
//           ...prev,
//           { id: record._id, title: record.seo_title || "Untitled" },
//         ];
//       }
//     });
//   };

//   return (
//     <ProtectedPage requiredPermission="manage_roles">
//       <PageHeader
//         title="Yoast SEO Management"
//         description="Manage SEO records"
//         actionButtons={
//           <div className="flex gap-2">
//             {selectedRecords.length > 0 && (
//               <Button variant="destructive" onClick={openMultipleRemoveDialog}>
//                 <Trash2 className="mr-2 h-4 w-4" /> Delete
//               </Button>
//             )}
//             {canManageRoles && (
//               <Button onClick={() => setIsCreateDialogOpen(true)}>
//                 <PlusCircle className="mr-2 h-4 w-4" />
//                 Create SEO Record
//               </Button>
//             )}
//           </div>
//         }
//       />

//       <div className="rounded-md border shadow-sm">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead className="w-[40px]">
//                 <input
//                   type="checkbox"
//                   checked={
//                     selectedRecords.length === yoastRecords.length &&
//                     yoastRecords.length > 0
//                   }
//                   onChange={toggleSelectAll}
//                   aria-label="Select all"
//                 />
//               </TableHead>
//               <TableHead>SEO Title</TableHead>
//               <TableHead>SEO Keyphrase</TableHead>
//               <TableHead>Meta Description</TableHead>
//               {canManageRoles && (
//                 <TableHead className="text-right">Actions</TableHead>
//               )}
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {isLoading ? (
//               Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
//                 <TableRow key={`skeleton-${i}`}>
//                   <TableCell>
//                     <Skeleton className="h-5 w-5" />
//                   </TableCell>
//                   <TableCell>
//                     <Skeleton className="h-5 w-32" />
//                   </TableCell>
//                   <TableCell>
//                     <Skeleton className="h-5 w-24" />
//                   </TableCell>
//                   <TableCell>
//                     <Skeleton className="h-5 w-40" />
//                   </TableCell>
//                   {canManageRoles && (
//                     <TableCell className="text-right">
//                       <Skeleton className="h-8 w-8 ml-auto" />
//                     </TableCell>
//                   )}
//                 </TableRow>
//               ))
//             ) : yoastRecords.length > 0 ? (
//               yoastRecords.map((record) => {
//                 const isChecked = selectedRecords.some(
//                   (r) => r.id === record._id
//                 );
//                 return (
//                   <TableRow key={record._id}>
//                     <TableCell>
//                       <input
//                         type="checkbox"
//                         checked={isChecked}
//                         onChange={() => toggleSelectOne(record)}
//                       />
//                     </TableCell>
//                     <TableCell>{record.seo_title || "-"}</TableCell>
//                     <TableCell>{record.seo_keyphrase || "-"}</TableCell>
//                     <TableCell>{record.meta_description || "-"}</TableCell>
//                     {canManageRoles && (
//                       <TableCell className="text-right">
//                         <DropdownMenu>
//                           <DropdownMenuTrigger asChild>
//                             <Button variant="ghost" size="icon">
//                               <MoreHorizontal className="h-4 w-4" />
//                               <span className="sr-only">Actions</span>
//                             </Button>
//                           </DropdownMenuTrigger>
//                           <DropdownMenuContent align="end">
//                             <DropdownMenuItem
//                               onClick={() => {
//                                 setSelectedEditRecord(record);
//                                 setIsEditDialogOpen(true);
//                               }}
//                             >
//                               <Edit className="mr-2 h-4 w-4" /> Edit
//                             </DropdownMenuItem>
//                             <DropdownMenuItem
//                               onClick={() => openRemoveDialog(record)}
//                               className="text-destructive"
//                             >
//                               <Trash2 className="mr-2 h-4 w-4" /> Delete
//                             </DropdownMenuItem>
//                           </DropdownMenuContent>
//                         </DropdownMenu>
//                       </TableCell>
//                     )}
//                   </TableRow>
//                 );
//               })
//             ) : (
//               <TableRow>
//                 <TableCell
//                   colSpan={5}
//                   className="text-center text-sm py-4 text-muted-foreground"
//                 >
//                   No Yoast SEO records found.
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>

//         {totalPages > 1 && (
//           <div className="mt-6 flex items-center justify-between px-4 pb-4">
//             <p className="text-sm text-muted-foreground">
//               Showing{" "}
//               {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)} to{" "}
//               {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of{" "}
//               {totalItems} records
//             </p>
//             <div className="flex items-center gap-2">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
//                 disabled={currentPage === 1 || isLoading}
//               >
//                 <ChevronLeft className="h-4 w-4 mr-1" /> Previous
//               </Button>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() =>
//                   setCurrentPage((prev) => Math.min(totalPages, prev + 1))
//                 }
//                 disabled={currentPage === totalPages || isLoading}
//               >
//                 Next <ChevronRight className="h-4 w-4 ml-1" />
//               </Button>
//             </div>
//           </div>
//         )}
//       </div>

//       {selectedYoast && (
//         <DeleteYoastSeoDialog
//           isOpen={isRemoveDialogOpen}
//           onOpenChange={setIsRemoveDialogOpen}
//           item={selectedYoast}
//           onSuccess={handleRemoveSuccess}
//         />
//       )}

//       {selectedRecords.length > 0 && (
//         <MultipleDeleteYoastSeoDialog
//           isOpen={isMultipleRemoveDialogOpen}
//           onOpenChange={setIsMultipleRemoveDialogOpen}
//           selectedItems={selectedRecords}
//           onSuccess={handleMultipleRemoveSuccess}
//         />
//       )}

//       {isCreateDialogOpen && (
//         <CreateYoastSeoDialog
//           isOpen={isCreateDialogOpen}
//           onOpenChange={setIsCreateDialogOpen}
//           onSuccess={handleSeoCreated}
//         />
//       )}

//       {selectedEditRecord && (
//         <EditYoastSeoDialog
//           isOpen={isEditDialogOpen}
//           onOpenChange={(open) => {
//             setIsEditDialogOpen(open);
//             if (!open) setSelectedEditRecord(null);
//           }}
//           seo={selectedEditRecord}
//           onSuccess={() => {
//             fetchYoastRecords(currentPage);
//             setIsEditDialogOpen(false);
//             setSelectedEditRecord(null);
//           }}
//         />
//       )}
//     </ProtectedPage>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import YoastSeoForm from "@/components/dashboard/yoast-seo/YoastSeoForm";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService";
import type { SingleResponse, YoastSeo, YoastSeoFormValues } from "@/types";
import { yoastSeoSchema } from "@/types";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import ProtectedPage from '@/components/shared/ProtectedPage';

export default function CreateOrUpdateYoastSeoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [seoId, setSeoId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<YoastSeoFormValues>({
    resolver: zodResolver(yoastSeoSchema),
    defaultValues: {
      seo_keyphrase: "",
      seo_title: "",
      meta_description: "",
      cover_image: "",
      page_description: "",
    },
  });

  useEffect(() => {
    const fetchSeo = async () => {
      try {
        const res = await apiService<SingleResponse<YoastSeo[]>>("/yoast-seo");
        const record = res.data?.[0];
        if (res.success && record) {
          form.reset(record);
          setSeoId(record._id);
        }
      } catch (error) {
        console.error("Failed to fetch SEO record", error);
      }
    };
    fetchSeo();
  }, [form]);

  const handleSubmit = async (values: YoastSeoFormValues) => {
    console.log("Submitted values", values);
    setIsSubmitting(true);
    try {
      const method = seoId ? "PUT" : "POST";
      const url = seoId ? `/yoast-seo/${seoId}` : "/yoast-seo";

      const res = await apiService<SingleResponse<YoastSeo>>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.success) {
        toast({
          title: "Success",
          description: res.message || `SEO ${seoId ? "updated" : "created"}.`,
        });
        router.push("/dashboard");
      } else {
        toast({
          title: "Error",
          description: res.message || "Operation failed.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Unexpected error.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedPage requiredPermission='editSeoMenu'>
      <div className="w-full p-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">
              {seoId ? "Update SEO Record" : "Create SEO Record"}
            </h2>
            <p className="text-muted-foreground mb-6">
              Fill in the SEO metadata for the page.
            </p>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                <YoastSeoForm isSubmitting={isSubmitting} />

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? seoId
                        ? "Updating..."
                        : "Creating..."
                      : seoId
                        ? "Update"
                        : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}
