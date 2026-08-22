"use client";

import { useState, useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService";
import { useAuth } from "@/hooks/useAuth";
import { codingPromptTopicSchema, SingleResponse } from "@/types";
import { Edit } from "lucide-react";

interface RollAndPermissionCreateProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
}

const permissionTemplate = {
  UserMenu: {
    CreateNew: false,
    Edit: false,
    ViewMenu: false,
    Delete: false,
    AddToken: false,
    UpdateStatus: false,
  },
  ToolCategoriesMenu: {
    CreateNew: false,
    Edit: false,
    ViewMenu: false,
    Delete: false,
    StatusChange: false,
  },
  ToolsManagementMenu: {
    CreateNew: false,
    Edit: false,
    ViewMenu: false,
    Delete: false,
    StatusChange: false,
  },
  MarketingToolCategoriesMenu: {
    CreateNew: false,
    Edit: false,
    ViewMenu: false,
    Delete: false,
    StatusChange: false,
  },
  MarketingToolsManagementMenu: {
    CreateNew: false,
    Edit: false,
    ViewMenu: false,
    Delete: false,
    StatusChange: false,
  },
  LeadMagnetsMenu: {
    createNew: false,
    edit: false,
    viewMenu: false,
    delete: false,
    statusChange: false,
  },

  LeadMagnetCategoriesMenu: {
    CreateNew: false,
    Edit: false,
    ViewMenu: false,
    Delete: false,
    StatusChange: false,
  },

  HomeToolCategoriesMenu: {
    CreateNew: false,
    Edit: false,
    ViewMenu: false,
    Delete: false,
    StatusChange: false,
  },
  // ✅ ADDED: Home Tool Tag Menu
  HomeToolTagMenu: {
    CreateNew: false,
    Edit: false,
    ViewMenu: false,
    Delete: false,
    StatusChange: false,
  },
  // ✅ ADDED: Common Other Tools Menus
  WritingCommonOtherToolsManageMenu: {
    CreateNew: false,
    Edit: false,
    ViewMenu: false,
    Delete: false,
    StatusChange: false,
  },
  CareerCommonOtherToolsManageMenu: {
    CreateNew: false,
    Edit: false,
    ViewMenu: false,
    Delete: false,
    StatusChange: false,
  },
  TravelCommonOtherToolsManageMenu: {
    CreateNew: false,
    Edit: false,
    ViewMenu: false,
    Delete: false,
    StatusChange: false,
  },
  FoodCommonOtherToolsManageMenu: {
    CreateNew: false,
    Edit: false,
    ViewMenu: false,
    Delete: false,
    StatusChange: false,
  },
  HealthCommonOtherToolsManageMenu: {
    CreateNew: false,
    Edit: false,
    ViewMenu: false,
    Delete: false,
    StatusChange: false,
  },
  BusinessCommonOtherToolsManageMenu: {
    CreateNew: false,
    Edit: false,
    ViewMenu: false,
    Delete: false,
    StatusChange: false,
  },
  FinanceCommonOtherToolsManageMenu: {
    CreateNew: false,
    Edit: false,
    ViewMenu: false,
    Delete: false,
    StatusChange: false,
  },
  // ExtraCommonOtherToolsManageMenu: {
  //   CreateNew: false,
  //   Edit: false,
  //   ViewMenu: false,
  //   Delete: false,
  //   StatusChange: false,
  // },
  // NewsMenu: {
  //   CreateNew: false,
  //   Edit: false,
  //   ViewMenu: false,
  //   Delete: false,
  //   StatusChange: false,
  // },
  NewsCategoryMenu: {
    CreateNew: false,
    Edit: false,
    ViewMenu: false,
    Delete: false,
    StatusChange: false,
  },
  PagesMenu: {
    CreateNew: false,
    Edit: false,
    ViewMenu: false,
    Delete: false,
  },
  PageBuilderMenu: {
    // CreateNew: false,
    Edit: false,
    // ViewMenu: false,
    // Delete: false,
  },
  SystemLogsMenu: {
    ViewAllData: false,
  },
  ContactMenu: {
    ViewOnly: false,
    DeleteData: false,
  },
  SeoMenu: {
    Edit: false,
  },
  FaviconSettingMenu: {
    Edit: false,
  },
  DiscoverRecipesCategoriesMenu: {
    CreateNew: false,
    Edit: false,
    ViewMenu: false,
    Delete: false,
  },
  DiscoverRecipesCollectionsMenu: {
    CreateNew: false,
    Edit: false,
    ViewMenu: false,
    Delete: false,
    StatusChange: false,
  },
  DiscoverRecipesToolsMenu: {
    ViewMenu: false,
    Edit: false,
  },
  DiscoverDestinationsCategoriesMenu: {
    CreateNew: false,
    Edit: false,
    ViewMenu: false,
    Delete: false,
  },
  DiscoverDestinationsCollectionsMenu: {
    CreateNew: false,
    Edit: false,
    ViewMenu: false,
    Delete: false,
    StatusChange: false,
  },
  DiscoverDestinationsToolsMenu: {
    ViewMenu: false,
    Edit: false,
  },
  FindCompaniesMenu: {
    Edit: false,
  },
  CoverLetterGeneratorMenu: {
    Edit: false,
  },
  ResumeGeneratorMenu: {
    Edit: false,
  },
  JobProtectionMenu: {
    Edit: false,
  },
  JobAutomationCheckerMenu: {
    Edit: false,
  },
  OnlineIncomeMenu: {
    Edit: false,
  },
  BusinessNameGenerator: {
    Edit: false,
  },
  BusinessIdeasGenerator: {
    Edit: false,
  },
  InterviewPreparationMenu: {
    Edit: false,
  },
  EmailMenu: {
    Edit: false,
  },
  ParaphraseMenu: {
    Edit: false,
  },
  MessageMenu: {
    Edit: false,
  },
  CheckGrammarMenu: {
    Edit: false,
  },
  BlogPostMenu: {
    Edit: false,
  },
  SocialMediaMenu: {
    Edit: false,
  },
  TranslateContentMenu: {
    Edit: false,
  },
  WellnessMenu: {
    Edit: false,
  },
  TherapyMenu: {
    Edit: false,
  },
  WeightLossMenu: {
    Edit: false,
  },
  NutritionPlannerMenu: {
    Edit: false,
  },
  CalorieCalculatorMenu: {
    Edit: false,
  },
  SymptomCheckerMenu: {
    Edit: false,
  },
  SolutionsMenu: {
    Edit: false,
  },
  DocumentsMenu: {
    Edit: false,
  },
  ResearchMenu: {
    Edit: false,
  },
  MarketingMenu: {
    Edit: false,
  },
  FundingMenu: {
    Edit: false,
  },
  FinancialAdvisorMenu: {
    Edit: false,
  },
  SaveMoneyMenu: {
    Edit: false,
  },
  BudgetCalculatorMenu: {
    Edit: false,
  },
  RetirementCalculatorMenu: {
    Edit: false,
  },
  DebtReliefMenu: {
    Edit: false,
  },
  InvestingMenu: {
    Edit: false,
  },
  VisionBoardGeneratorMenu: {
    Edit: false,
  },
  LifeGoalsGeneratorMenu: {
    Edit: false,
  },
  NewYearsResolutionGeneratorMenu: {
    Edit: false,
  },
  // KeywordSearchMenu: {
  //   Edit: false,
  // },
  //  WebsiteSearchMenu: {
  //   Edit: false,
  // },
  promptCategoryMenu: {
    createNew: false,
    edit: false,
    viewMenu: false,
    delete: false,
    statusChange: false,
  },
  promptDataMenu: {
    createNew: false,
    edit: false,
    viewMenu: false,
    delete: false,
    statusChange: false,
  },
  codingPromptTopicSchema: {
    createNew: false,
    edit: false,
    viewMenu: false,
    delete: false,
    statusChange: false,
  },
  imageStyleMenu: {
    createNew: false,
    edit: false,
    viewMenu: false,
    delete: false,
    statusChange: false,
  },
  imagePromptMenu: {
    createNew: false,
    edit: false,
    viewMenu: false,
    delete: false,
    statusChange: false,
  },
  videoPromptMenu: {
    createNew: false,
    edit: false,
    viewMenu: false,
    delete: false,
    statusChange: false,
  },
  aiFilterMenu: {
    createNew: false,
    edit: false,
    viewMenu: false,
    delete: false,
    statusChange: false,
  },
  alternativeToolsMenu: {
    createNew: false,
    edit: false,
    viewMenu: false,
    delete: false,
    statusChange: false,
  },
};

function renderPermissionCheckboxes(
  control: any,
  path: string,
  obj: any,
  watchPermissions: any
) {
  return Object.entries(obj).map(([key, value]) => {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof value === "boolean") {
      return (
        <div key={currentPath} className="flex items-center gap-2">
          <Controller
            name={currentPath}
            control={control}
            render={({ field }) => {
              const pathParts = currentPath.split(".");
              const menuKey = pathParts[1];
              const permissionKey = pathParts[2];

              const menuPermissions = watchPermissions?.[menuKey] || {};

              const isView =
                permissionKey === "ViewMenu" ||
                permissionKey === "ViewOnly" ||
                permissionKey === "ViewAllData";

              // Existing logic: Auto-check view if any other permission in same menu is checked
              const otherPermissionsChecked = Object.entries(
                menuPermissions
              ).some(
                ([perm, val]) =>
                  !["ViewMenu", "ViewOnly", "ViewAllData"].includes(perm) &&
                  val === true
              );

              const isSeoCreateNew =
                menuKey === "SeoMenu" && permissionKey === "CreateNew";
              const isSeoEditChecked = watchPermissions?.SeoMenu?.Edit === true;

              // Force checked if ViewMenu-type or SeoMenu CreateNew with Edit checked
              const forcedCheck =
                (isView && otherPermissionsChecked) ||
                (isSeoCreateNew && isSeoEditChecked);

              useEffect(() => {
                if (forcedCheck && !field.value) {
                  field.onChange(true);
                }
              }, [forcedCheck]);

              // Auto-uncheck SeoMenu.CreateNew when Edit is unchecked
              useEffect(() => {
                if (isSeoCreateNew && !isSeoEditChecked && field.value) {
                  field.onChange(false);
                }
              }, [isSeoEditChecked]);

              return (
                <>
                  <Checkbox
                    checked={forcedCheck ? true : field.value || false}
                    disabled={forcedCheck}
                    onCheckedChange={(checked) => field.onChange(checked)}
                  />
                  <label className="text-sm text-gray-700">
                    {permissionKey}
                  </label>
                </>
              );
            }}
          />
        </div>
      );
    } else if (typeof value === "object" && value !== null) {
      return (
        <div
          key={currentPath}
          className="h-full flex flex-col border border-gray-200 rounded-md py-4 px-2 bg-gray-50 shadow-sm"
        >
          <div className="font-medium text-gray-800 mb-4 text-base">{key}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-2">
            {renderPermissionCheckboxes(
              control,
              currentPath,
              value,
              watchPermissions
            )}
          </div>
        </div>
      );
    }

    return null;
  });
}

export default function RollAndPermissionCreate({
  isOpen,
  onOpenChange,
  onSuccess,
}: RollAndPermissionCreateProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      roleName: "",
      permissions: permissionTemplate,
    },
    mode: "onChange",
  });

  const watchPermissions = watch("permissions");

  const onSubmit = async (data: any) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a role.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        roleName: data.roleName,
        permissions: data.permissions,
        created_by_user_id: user._id, // ✅ use _id from your type
      };
      console.log("🚀 ~ onSubmit ~ payload:", payload);

      const response = await apiService<SingleResponse<null>>(
        "/roleAndPermission",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload), // ✅ stringify the body
        }
      );

      if (response.success) {
        toast({
          title: "Success",
          description:
            response.message || `Role "${data.roleName}" created successfully.`,
        });
        onSuccess();
        onOpenChange(false);
        reset();
      } else {
        toast({
          title: "Error",
          description:
            response.message || "Failed to create role and permissions.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl bg-white rounded-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-800">
            Create Role & Permissions
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 mt-1 mb-4">
            Define a new role and assign specific permissions.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-2 overflow-y-auto max-h-[72vh] px-2"
        >
          <div>
            <label
              htmlFor="roleName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Role Name
            </label>
            <Controller
              name="roleName"
              control={control}
              rules={{
                required: true,
                maxLength: {
                  value: 50,
                  message: "Role name must be 50 characters or less",
                },
              }}
              render={({ field }) => (
                <>
                  <Input
                    id="roleName"
                    placeholder="Enter role name"
                    {...field}
                    maxLength={50}
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-500 float-end mt-1">
                    {field.value?.length || 0}/50 characters
                  </span>
                </>
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions
            </label>
            <div className="border grid grid-cols-1 lg:grid-cols-3 gap-2 border-gray-200 rounded-md p-4 max-h-[500px] overflow-y-auto bg-white items-stretch">
              {renderPermissionCheckboxes(
                control,
                "permissions",
                permissionTemplate,
                watchPermissions
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              {isSubmitting ? "Creating..." : "Create Role"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
