"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/shared/PageHeader";
import ProtectedPage from "@/components/shared/ProtectedPage";
import { Button } from "@/components/ui/button";
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
import {
  PlusCircle,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  Server,
  WandSparkles,
} from "lucide-react";
import apiService from "@/lib/apiService";
import type {
  AIProviderConfig,
  AIModel,
  SingleResponse,
  PaginatedResponse,
} from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import CreateAIProviderDialog from "@/components/dashboard/ai-providers/CreateAIProviderDialog";
import EditAIProviderDialog from "@/components/dashboard/ai-providers/EditAIProviderDialog";
import DeleteAIProviderDialog from "@/components/dashboard/ai-providers/DeleteAIProviderDialog";
import ViewAIProviderDialog from "@/components/dashboard/ai-providers/ViewAIProviderDialog";

import CreateAIModelDialog from "@/components/dashboard/ai-models/CreateAIModelDialog";
import EditAIModelDialog from "@/components/dashboard/ai-models/EditAIModelDialog";
import DeleteAIModelDialog from "@/components/dashboard/ai-models/DeleteAIModelDialog";
import ViewAIModelDialog from "@/components/dashboard/ai-models/ViewAIModelDialog";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AIProvidersPage() {
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const [providerConfigs, setProviderConfigs] = useState<AIProviderConfig[]>(
    []
  );
  const [isLoadingProviderConfigs, setIsLoadingProviderConfigs] =
    useState(true);
  const [
    isCreateProviderConfigDialogOpen,
    setIsCreateProviderConfigDialogOpen,
  ] = useState(false);
  const [isEditProviderConfigDialogOpen, setIsEditProviderConfigDialogOpen] =
    useState(false);
  const [
    isDeleteProviderConfigDialogOpen,
    setIsDeleteProviderConfigDialogOpen,
  ] = useState(false);
  const [isViewProviderConfigDialogOpen, setIsViewProviderConfigDialogOpen] =
    useState(false);
  const [selectedProviderConfigId, setSelectedProviderConfigId] = useState<
    string | null
  >(null);

  const [aiModels, setAiModels] = useState<AIModel[]>([]);
  const [isLoadingAiModels, setIsLoadingAiModels] = useState(true);
  const [isCreateAIModelDialogOpen, setIsCreateAIModelDialogOpen] =
    useState(false);
  const [isEditAIModelDialogOpen, setIsEditAIModelDialogOpen] = useState(false);
  const [isDeleteAIModelDialogOpen, setIsDeleteAIModelDialogOpen] =
    useState(false);
  const [isViewAIModelDialogOpen, setIsViewAIModelDialogOpen] = useState(false);
  const [selectedAIModelId, setSelectedAIModelId] = useState<string | null>(
    null
  );

  const canManageAIProviders = hasPermission("manage_ai_providers");

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

  const fetchAIModels = useCallback(async () => {
    setIsLoadingAiModels(true);
    try {
      const response = await apiService<PaginatedResponse<AIModel>>(
        "/ai-models"
      );
      if (response.success) {
        setAiModels(response.data || []);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch AI Models.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "An unexpected error occurred fetching AI models.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAiModels(false);
    }
  }, [toast]);

  useEffect(() => {
    if (canManageAIProviders) {
      fetchProviderConfigs();
      fetchAIModels();
    } else {
      setIsLoadingProviderConfigs(false);
      setProviderConfigs([]);
      setIsLoadingAiModels(false);
      setAiModels([]);
    }
  }, [fetchProviderConfigs, fetchAIModels, canManageAIProviders]);

  // --- AI Provider Config Handlers ---
  const handleToggleProviderConfigActive = async (config: AIProviderConfig) => {
    if (!canManageAIProviders) return;
    try {
      const response = await apiService<SingleResponse<{ is_active: boolean }>>(
        `/ai-providers/${config._id}/toggle`,
        { method: "PATCH" }
      );
      if (response.success) {
        toast({
          title: "Success",
          description: `Provider Config ${config.display_name} status updated.`,
        });
        fetchProviderConfigs();
        fetchAIModels();
      } else {
        toast({
          title: "Error",
          description: `Failed to update ${config.display_name} status.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const openViewProviderConfigDialog = (id: string) => {
    setSelectedProviderConfigId(id);
    setIsViewProviderConfigDialogOpen(true);
  };
  const openEditProviderConfigDialog = (id: string) => {
    if (!canManageAIProviders) return;
    setSelectedProviderConfigId(id);
    setIsEditProviderConfigDialogOpen(true);
  };
  const openDeleteProviderConfigDialog = (id: string) => {
    if (!canManageAIProviders) return;
    setSelectedProviderConfigId(id);
    setIsDeleteProviderConfigDialogOpen(true);
  };

  const onProviderConfigCreated = () => {
    fetchProviderConfigs();
    setIsCreateProviderConfigDialogOpen(false);
  };
  const onProviderConfigUpdated = () => {
    fetchProviderConfigs();
    fetchAIModels();
    setIsEditProviderConfigDialogOpen(false);
    setSelectedProviderConfigId(null);
  };
  const onProviderConfigDeleted = () => {
    fetchProviderConfigs();
    fetchAIModels();
    setIsDeleteProviderConfigDialogOpen(false);
    setSelectedProviderConfigId(null);
  };

  // --- AI Model Handlers ---
  const handleToggleAIModelActive = async (model: AIModel) => {
    if (!canManageAIProviders) return;
    try {
      const response = await apiService<SingleResponse<{ is_active: boolean }>>(
        `/ai-models/${model._id}/toggle`,
        { method: "PATCH" }
      );
      if (response.success) {
        toast({
          title: "Success",
          description: `Model ${model.model} status updated.`,
        });
        fetchAIModels();
      } else {
        toast({
          title: "Error",
          description: `Failed to update ${model.model} status.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const openViewAIModelDialog = (id: string) => {
    setSelectedAIModelId(id);
    setIsViewAIModelDialogOpen(true);
  };
  const openEditAIModelDialog = (id: string) => {
    if (!canManageAIProviders) return;
    setSelectedAIModelId(id);
    setIsEditAIModelDialogOpen(true);
  };
  const openDeleteAIModelDialog = (id: string) => {
    if (!canManageAIProviders) return;
    setSelectedAIModelId(id);
    setIsDeleteAIModelDialogOpen(true);
  };

  const onAIModelCreated = () => {
    fetchAIModels();
    setIsCreateAIModelDialogOpen(false);
  };
  const onAIModelUpdated = () => {
    fetchAIModels();
    setIsEditAIModelDialogOpen(false);
    setSelectedAIModelId(null);
  };
  const onAIModelDeleted = () => {
    fetchAIModels();
    setIsDeleteAIModelDialogOpen(false);
    setSelectedAIModelId(null);
  };

  const getProviderConfigDisplayName = (
    providerId: string | AIProviderConfig
  ): string => {
    if (typeof providerId === "object" && providerId !== null) {
      return providerId.display_name;
    }
    const found = providerConfigs.find((p) => p._id === providerId);
    return found ? found.display_name : "Unknown Provider";
  };

  return (
    <ProtectedPage requiredPermission="manage_ai_providers">
      <PageHeader
        title="AI Integration Management"
        description="Configure AI Provider settings and manage their specific Models."
      />

      <Card className="mb-8 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Server className="mr-3 h-6 w-6 text-primary" />
              AI Provider Configurations
            </CardTitle>
            <CardDescription className="mt-1">
              Base configurations for AI services (e.g., OpenAI, Google AI).
            </CardDescription>
          </div>
          {canManageAIProviders && (
            <Button onClick={() => setIsCreateProviderConfigDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Provider Config
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Display Name</TableHead>
                    <TableHead className="hidden md:table-cell">
                    Title
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Internal Name
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Description
                  </TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-right w-[100px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingProviderConfigs ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={`skeleton-provider-${i}`}>
                      <TableCell>
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-32" />
                        <div className="md:hidden mt-1">
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                        <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-5 w-40" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-6 w-10 mx-auto rounded-md" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : providerConfigs.length > 0 ? (
                  providerConfigs.map((config) => (
                    <TableRow key={config._id}>
                      <TableCell>
                        {config.image ? (
                          <img
                            src={config.image}
                            alt={`${config.display_name} logo`}
                            className="h-12 w-13 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-md bg-muted text-muted-foreground flex items-center justify-center text-xs">
                            N/A
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {config.display_name}
                        <div className="text-xs text-muted-foreground md:hidden">
                          {config.name} 
                        </div>
                      </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                        {config.title || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {config.name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm w-80">
                        {config.description || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={config.is_active}
                          onCheckedChange={() =>
                            handleToggleProviderConfigActive(config)
                          }
                          aria-label={`Toggle ${config.display_name} status`}
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
                            <DropdownMenuItem
                              onClick={() =>
                                openViewProviderConfigDialog(config._id)
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            {canManageAIProviders && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    openEditProviderConfigDialog(config._id)
                                  }
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    openDeleteProviderConfigDialog(config._id)
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
                    <TableCell colSpan={4} className="text-center h-24">
                      No AI provider configurations found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-xl flex items-center">
              <WandSparkles className="mr-3 h-6 w-6 text-primary" />
              AI Models
            </CardTitle>
            <CardDescription className="mt-1">
              Specific models linked to the provider configurations above.
            </CardDescription>
          </div>
          {canManageAIProviders && (
            <Button
              onClick={() => setIsCreateAIModelDialogOpen(true)}
              disabled={
                providerConfigs.filter((pc) => pc.is_active).length === 0
              }
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add AI Model
              {providerConfigs.filter((pc) => pc.is_active).length === 0 && (
                <span className="ml-1 text-xs">(No active providers)</span>
              )}
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model Identifier</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Provider Config
                  </TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-right w-[100px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingAiModels ? (
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
                ) : aiModels.length > 0 ? (
                  aiModels.map((model) => (
                    <TableRow key={model._id}>
                      <TableCell className="font-medium">
                        {model.model}
                        <div className="text-xs text-muted-foreground md:hidden">
                          {getProviderConfigDisplayName(model.ai_provider_id)}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {getProviderConfigDisplayName(model.ai_provider_id)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={model.is_active}
                          onCheckedChange={() =>
                            handleToggleAIModelActive(model)
                          }
                          aria-label={`Toggle ${model.model} status`}
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
                            <DropdownMenuItem
                              onClick={() => openViewAIModelDialog(model._id)}
                            >
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            {canManageAIProviders && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    openEditAIModelDialog(model._id)
                                  }
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    openDeleteAIModelDialog(model._id)
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
                    <TableCell colSpan={4} className="text-center h-24">
                      No AI models configured. Add an AI Provider Config first,
                      then add models to it.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* AI Provider Config Dialogs */}
      {canManageAIProviders && isCreateProviderConfigDialogOpen && (
        <CreateAIProviderDialog
          isOpen={isCreateProviderConfigDialogOpen}
          onOpenChange={setIsCreateProviderConfigDialogOpen}
          onSuccess={onProviderConfigCreated}
        />
      )}
      {selectedProviderConfigId &&
        canManageAIProviders &&
        isEditProviderConfigDialogOpen && (
          <EditAIProviderDialog
            isOpen={isEditProviderConfigDialogOpen}
            onOpenChange={setIsEditProviderConfigDialogOpen}
            providerConfigId={selectedProviderConfigId}
            onSuccess={onProviderConfigUpdated}
          />
        )}
      {selectedProviderConfigId &&
        canManageAIProviders &&
        isDeleteProviderConfigDialogOpen && (
          <DeleteAIProviderDialog
            isOpen={isDeleteProviderConfigDialogOpen}
            onOpenChange={setIsDeleteProviderConfigDialogOpen}
            provider={
              providerConfigs.find((p) => p._id === selectedProviderConfigId) ||
              null
            }
            onSuccess={onProviderConfigDeleted}
          />
        )}
      {selectedProviderConfigId && isViewProviderConfigDialogOpen && (
        <ViewAIProviderDialog
          isOpen={isViewProviderConfigDialogOpen}
          onOpenChange={setIsViewProviderConfigDialogOpen}
          providerConfigId={selectedProviderConfigId}
        />
      )}

      {/* AI Model Dialogs */}
      {canManageAIProviders && isCreateAIModelDialogOpen && (
        <CreateAIModelDialog
          isOpen={isCreateAIModelDialogOpen}
          onOpenChange={setIsCreateAIModelDialogOpen}
          onSuccess={onAIModelCreated}
          aiProviderConfigs={providerConfigs.filter((pc) => pc.is_active)}
        />
      )}
      {selectedAIModelId && canManageAIProviders && isEditAIModelDialogOpen && (
        <EditAIModelDialog
          isOpen={isEditAIModelDialogOpen}
          onOpenChange={setIsEditAIModelDialogOpen}
          aiModelId={selectedAIModelId}
          onSuccess={onAIModelUpdated}
          aiProviderConfigs={providerConfigs.filter((pc) => pc.is_active)}
        />
      )}
      {selectedAIModelId &&
        canManageAIProviders &&
        isDeleteAIModelDialogOpen && (
          <DeleteAIModelDialog
            isOpen={isDeleteAIModelDialogOpen}
            onOpenChange={setIsDeleteAIModelDialogOpen}
            aiModel={aiModels.find((m) => m._id === selectedAIModelId) || null}
            onSuccess={onAIModelDeleted}
          />
        )}
      {selectedAIModelId && isViewAIModelDialogOpen && (
        <ViewAIModelDialog
          isOpen={isViewAIModelDialogOpen}
          onOpenChange={setIsViewAIModelDialogOpen}
          aiModelId={selectedAIModelId}
          aiProviderConfigs={providerConfigs}
        />
      )}
    </ProtectedPage>
  );
}
