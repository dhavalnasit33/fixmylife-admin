
'use client';

import { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import ProtectedPage from '@/components/shared/ProtectedPage';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, CheckCircle, Star } from 'lucide-react';
import apiService from '@/lib/apiService';
import type { Plan, SingleResponse } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import CreatePlanDialog from '@/components/dashboard/plans/CreatePlanDialog';
import EditPlanDialog from '@/components/dashboard/plans/EditPlanDialog';
import DeletePlanDialog from '@/components/dashboard/plans/DeletePlanDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function PlansPage() {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const canManagePlans = hasPermission('manage_plans');

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiService<SingleResponse<Plan[]>>('/plans');
      if (response.success) {
        setPlans(response.data || []);
      } else {
        toast({ title: 'Error', description: response.message || 'Failed to fetch plans.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if(canManagePlans) {
        fetchPlans();
    } else {
        setIsLoading(false);
        setPlans([]);
    }
  }, [fetchPlans, canManagePlans]);

  const handleToggleActive = async (plan: Plan) => {
    if (!canManagePlans) {
      toast({ title: 'Permission Denied', description: 'You do not have permission to manage plans.', variant: 'destructive'});
      return;
    }
    try {
      const response = await apiService<SingleResponse<{ is_active: boolean }>>(`/plans/${plan._id}/toggle`, {
        method: 'PATCH',
      });
      if (response.success) {
        toast({ title: 'Success', description: `Plan ${plan.display_name} status updated.` });
        setPlans(prev => prev.map(p => p._id === plan._id ? { ...p, is_active: response.data.is_active } : p));
      } else {
        toast({ title: 'Error', description: `Failed to update ${plan.display_name} status.`, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    }
  };

  const openEditDialog = (plan: Plan) => {
    if (!canManagePlans) return;
    setSelectedPlan(plan);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (plan: Plan) => {
    if (!canManagePlans) return;
    setSelectedPlan(plan);
    setIsDeleteDialogOpen(true);
  };

  const onPlanCreated = () => {
    fetchPlans();
    setIsCreateDialogOpen(false);
  };

  const onPlanUpdated = () => {
    fetchPlans();
    setIsEditDialogOpen(false);
    setSelectedPlan(null);
  };
  
  const onPlanDeleted = () => {
    fetchPlans();
    setIsDeleteDialogOpen(false);
    setSelectedPlan(null);
  };

  return (
    <ProtectedPage requiredPermission="manage_plans">
      <PageHeader 
        title="Subscription Plans" 
        description="Manage service plans and features."
        actionButtons={
          canManagePlans && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Plan
            </Button>
          )
        }
      />
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={`skeleton-plan-${i}`} className="flex flex-col">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="flex-grow space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan._id} 
              className={cn(
                "flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300",
                plan.popular ? "border-primary border-2 ring-2 ring-primary/20" : ""
              )}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-headline text-primary">{plan.display_name}</CardTitle>
                  {plan.popular && <Badge variant="default" className="bg-accent text-accent-foreground text-xs"><Star className="mr-1 h-3 w-3 fill-current" /> Popular</Badge>}
                </div>
                <CardDescription className="text-2xl font-semibold">
                  ${plan.price.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">/{plan.currency}</span>
                </CardDescription>
                <p className="text-sm text-muted-foreground">{plan.token_limit} tokens/month</p>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                <ul className="space-y-1.5 text-sm">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex flex-col items-start space-y-3 border-t pt-4">
                <div className="flex items-center justify-between w-full">
                    <span className="text-sm text-muted-foreground">Active Status:</span>
                    <Switch
                        checked={plan.is_active}
                        onCheckedChange={() => handleToggleActive(plan)}
                        aria-label={`Toggle ${plan.display_name} status`}
                        disabled={!canManagePlans}
                    />
                </div>
                {canManagePlans && (
                  <div className="flex space-x-2 w-full">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(plan)} className="flex-1">
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(plan)} className="flex-1">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No subscription plans configured yet.
          </CardContent>
        </Card>
      )}

      {canManagePlans && isCreateDialogOpen && (
        <CreatePlanDialog 
          isOpen={isCreateDialogOpen} 
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={onPlanCreated}
        />
      )}

      {canManagePlans && selectedPlan && (
        <>
          <EditPlanDialog
            isOpen={isEditDialogOpen}
            onOpenChange={(isOpen) => {
              setIsEditDialogOpen(isOpen);
              if (!isOpen) setSelectedPlan(null);
            }}
            plan={selectedPlan}
            onSuccess={onPlanUpdated}
          />
          <DeletePlanDialog
            isOpen={isDeleteDialogOpen}
            onOpenChange={(isOpen) => {
              setIsDeleteDialogOpen(isOpen);
              if (!isOpen) setSelectedPlan(null);
            }}
            plan={selectedPlan}
            onSuccess={onPlanDeleted}
          />
        </>
      )}
    </ProtectedPage>
  );
}
