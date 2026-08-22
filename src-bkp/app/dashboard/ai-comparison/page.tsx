"use client";

import CreateAIProviderComparisonDialog from "@/components/dashboard/ai-comparison/CreateAIProviderComparison";
import DeleteAIProviderComparisonDialog from "@/components/dashboard/ai-comparison/DeleteAIProviderComparisonDialog";
import EditAIProviderComparisonDialog from "@/components/dashboard/ai-comparison/EditAIProviderComparisonDialog";
import PageHeader from "@/components/shared/PageHeader";
import ProtectedPage from "@/components/shared/ProtectedPage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import apiService from "@/lib/apiService";
import {
  AIProviderComparison,
  AIProviderConfig,
  PaginatedResponse,
  SingleResponse,
} from "@/types";
import {
  BrainCircuit,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Filter,
  MoreHorizontal,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const ITEMS_PER_PAGE = 10;

export default function AIComparisonPage() {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const canManageAIProviders = hasPermission("manage_ai_providers");
  const [isLoadingAiProviderComparisons, setIsLoadingAiProviderComparisons] =
    useState(false);
  const [
    isCreateProviderConmparisonConfigDialogOpen,
    setIsCreateProviderConmparisonConfigDialogOpen,
  ] = useState(false);
  const [
    isEditProviderComparisonConfigDialogOpen,
    setIsEditProviderComparisonConfigDialogOpen,
  ] = useState(false);
  const [
    isDeleteProviderComparisonConfigDialogOpen,
    setIsDeleteProviderComparisonConfigDialogOpen,
  ] = useState(false);
  const [aiproviderComparisonsConfigs, setAiProviderComparisonsConfigs] =
    useState<AIProviderComparison[]>([]);
  const [
    selectedProviderComparisonConfigId,
    setSelectedProviderComparisonConfigId,
  ] = useState<string | null>(null);
  const [
    selectedProviderComparisonConfig,
    setSelectedProviderComparisonConfig,
  ] = useState<AIProviderComparison | null>(null);
  const [selectedModelFilter, setSelectedModelFilter] = useState<string>("all");
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [allProviderComparisons, setAllProviderComparisons] = useState<
    AIProviderComparison[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [providerConfigs, setProviderConfigs] = useState<AIProviderConfig[]>(
    []
  );
  const [isLoadingProviderConfigs, setIsLoadingProviderConfigs] =
    useState(true);
  const fetchAIProviderComparisionConfigs = useCallback(
    async (page = 1, modelId?: string) => {
      setIsLoadingAiProviderComparisons(true);

      try {
        const params: Record<string, string | number | boolean | undefined> = {
          page,
          limit: ITEMS_PER_PAGE,
          filterModelTitle: modelId === "all" ? undefined : modelId,
        };

        const response = await apiService<
          PaginatedResponse<AIProviderComparison>
        >("/ai-comparison", { params });

        if (response.success) {
          setAllProviderComparisons(response.data || []);
          setAiProviderComparisonsConfigs(response.data || []);
          setCurrentPage(response.pagination.current);
          setTotalPages(response.pagination.pages);
          setTotalItems(response.pagination.total);
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to fetch AI comparisons",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Error fetching AI comparisons",
          variant: "destructive",
        });
      } finally {
        setIsLoadingAiProviderComparisons(false);
      }
    },
    [toast]
  );

  const fetchProviderConfigs = useCallback(async () => {
    setIsLoadingProviderConfigs(true);
    try {
      const response = await apiService<PaginatedResponse<AIProviderConfig>>(
        "/ai-providers"
      );
      if (response.success) {
        setProviderConfigs(response.data || []);
      } else {
        toast({
          title: "Error",
          description:
            response.message || "Failed to fetch AI Provider Configurations.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message ||
          "An unexpected error occurred fetching provider configs.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProviderConfigs(false);
    }
  }, [toast]);

  useEffect(() => {
    if (canManageAIProviders) {
      fetchAIProviderComparisionConfigs(currentPage);
      fetchProviderConfigs();
    } else {
      setIsLoadingAiProviderComparisons(false);
      setAiProviderComparisonsConfigs([]);
    }
  }, [canManageAIProviders, fetchAIProviderComparisionConfigs, currentPage]);

  const handleToggleProviderComparisonConfigActive = async (
    config: AIProviderComparison
  ) => {
    if (!canManageAIProviders) return;
    try {
      const responce = await apiService<SingleResponse<{ is_active: boolean }>>(
        `/ai-comparison/${config._id}/toggle`,
        { method: "PATCH" }
      );
      if (responce.success) {
        toast({
          title: "Success",
          description: `AI provider comparison ${config.firstModel.title} VS ${config.secondModel.title} status updated successfully`,
        });
        fetchAIProviderComparisionConfigs(currentPage);
      } else {
        toast({
          title: "Error",
          description:
            responce.message ||
            `Failed to toggle AI provider comparison ${config.firstModel.title} VS ${config.secondModel.title} status`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message ||
          "An unexpected error occurred while toggling AI provider comparison config active",
        variant: "destructive",
      });
    }
  };

  const onProviderComparisonConfigCreated = () => {
    fetchAIProviderComparisionConfigs(currentPage);
    setIsCreateProviderConmparisonConfigDialogOpen(false);
  };

  const openEditProviderComparisonConfigDialog = (id: string) => {
    if (!canManageAIProviders) return;
    setSelectedProviderComparisonConfigId(id);
    setIsEditProviderComparisonConfigDialogOpen(true);
  };

  const openDeleteProviderComparisonConfigDialog = (
    data: AIProviderComparison
  ) => {
    if (!canManageAIProviders) return;
    setSelectedProviderComparisonConfig(data);
    setIsDeleteProviderComparisonConfigDialogOpen(true);
  };

  const onProviderComparisonConfigUpdated = () => {
    fetchAIProviderComparisionConfigs(currentPage);
    setIsEditProviderComparisonConfigDialogOpen(false);
  };

  const onProviderComparisonConfigDeleted = () => {
    fetchAIProviderComparisionConfigs(
      aiproviderComparisonsConfigs.length == 1 && currentPage > 1
        ? currentPage - 1
        : currentPage
    );
    setIsDeleteProviderComparisonConfigDialogOpen(false);
  };

  useEffect(() => {
    const filtered =
      selectedModelFilter === "all"
        ? allProviderComparisons
        : allProviderComparisons.filter(
            (config) => config.firstModel._id === selectedModelFilter
          );
    setAiProviderComparisonsConfigs(filtered);
  }, [selectedModelFilter, allProviderComparisons]);

  const uniqueModelNames = Array.from(
    new Set(providerConfigs.map((config) => config.title))
  ).sort();

  return (
    <ProtectedPage requiredPermission="manage_ai_providers">
      <PageHeader
        title="AI Comparison Management"
        description="Configure AI Provider with AI Comparison"
        actionButtons={
          canManageAIProviders && (
            <Button
              onClick={() =>
                setIsCreateProviderConmparisonConfigDialogOpen(true)
              }
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add AI Comparison
            </Button>
          )
        }
      />
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-end gap-2">
        <div className="flex flex-row gap-2 items-center">
          {/* Filter by Model */}
          <Popover
            open={isFilterPopoverOpen}
            onOpenChange={setIsFilterPopoverOpen}
          >
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                Filter by Model
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-2 max-h-72 overflow-y-auto">
              <button
                onClick={() => {
                  setSelectedModelFilter("all");
                  setCurrentPage(1);
                  setIsFilterPopoverOpen(false);
                  fetchAIProviderComparisionConfigs(1, undefined);
                }}
                className={`block w-full text-left px-2 py-1 rounded  ${
                  selectedModelFilter === "all"
                    ? "bg-indigo-500 text-white"
                    : "hover:bg-[#29a383] hover:text-white"
                }`}
              >
                <span className="flex flex-row gap-2 items-center">
                  {selectedModelFilter === "all" ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : (
                    <span className="h-4 w-4 inline-block" />
                  )}
                  All Models
                </span>
              </button>
              {uniqueModelNames
                .filter((modelName) => modelName !== "Perplexity")
                .map((modelName) => (
                  <button
                    key={`model-${modelName}`}
                    onClick={() => {
                      const selectedConfig = providerConfigs.find(
                        (p) => p.title === modelName
                      );
                      if (selectedConfig?._id) {
                        setSelectedModelFilter(selectedConfig._id);
                        setCurrentPage(1);
                        setIsFilterPopoverOpen(false);
                        fetchAIProviderComparisionConfigs(
                          1,
                          selectedConfig._id
                        );
                      }
                    }}
                    className={`block w-full text-left px-2 py-1 rounded ${
                      selectedModelFilter ===
                      providerConfigs.find((p) => p.title == modelName)?._id
                        ? "bg-indigo-500 text-white"
                        : "hover:bg-[#29a383] hover:text-white"
                    }`}
                  >
                    <span className="flex flex-row gap-2 items-center">
                      {selectedModelFilter ===
                      providerConfigs.find((p) => p.title === modelName)
                        ?._id ? (
                        <Check className="h-4 w-4 text-white" />
                      ) : (
                        <span className="h-4 w-4 inline-block" />
                      )}
                      {modelName}
                    </span>
                  </button>
                ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 🧠 AI Comparison Table */}
      <div className="rounded-md border w-full shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Created By</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingAiProviderComparisons ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={`skeleton-model-${i}`}>
                  <TableCell>
                    <Skeleton className="h-5 w-36" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-5 w-28" />
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="h-6 w-10 mx-auto rounded-md" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : aiproviderComparisonsConfigs.length > 0 ? (
              aiproviderComparisonsConfigs.map((config) => (
                <TableRow key={config._id}>
                  <TableCell className="font-medium">
                    {config.firstModel.title} vs {config.secondModel.title}
                    <div className="text-xs text-muted-foreground md:hidden">
                      {config.firstModel.name}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {config.created_by_user_id.name}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={config.is_active}
                      onCheckedChange={() =>
                        handleToggleProviderComparisonConfigActive(config)
                      }
                      aria-label={`Toggle ${config.firstModel.title} status`}
                      disabled={!canManageAIProviders}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canManageAIProviders && (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                openEditProviderComparisonConfigDialog(
                                  config._id
                                )
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                openDeleteProviderComparisonConfigDialog(config)
                              }
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-sm py-4 text-muted-foreground"
                >
                  No AI provider comparisons found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination shown only if needed */}
      {totalItems > ITEMS_PER_PAGE && (
        <div className="mt-6 flex items-center justify-between px-4 pb-4">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems}{" "}
            comparisons
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoadingAiProviderComparisons}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={
                currentPage === totalPages || isLoadingAiProviderComparisons
              }
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {canManageAIProviders && isCreateProviderConmparisonConfigDialogOpen && (
        <CreateAIProviderComparisonDialog
          isOpen={isCreateProviderConmparisonConfigDialogOpen}
          onOpenChange={setIsCreateProviderConmparisonConfigDialogOpen}
          onSuccess={onProviderComparisonConfigCreated}
        />
      )}

      {canManageAIProviders && isEditProviderComparisonConfigDialogOpen && (
        <EditAIProviderComparisonDialog
          isOpen={isEditProviderComparisonConfigDialogOpen}
          onOpenChange={setIsEditProviderComparisonConfigDialogOpen}
          aiProviderComparisonConfig={selectedProviderComparisonConfigId}
          onSuccess={onProviderComparisonConfigUpdated}
        />
      )}

      {canManageAIProviders && isDeleteProviderComparisonConfigDialogOpen && (
        <DeleteAIProviderComparisonDialog
          isOpen={isDeleteProviderComparisonConfigDialogOpen}
          onOpenChange={setIsDeleteProviderComparisonConfigDialogOpen}
          aiProviderComparison={selectedProviderComparisonConfig}
          onSuccess={onProviderComparisonConfigDeleted}
        />
      )}
    </ProtectedPage>
  );
}
