"use client";

import type { ReactNode } from "react";
import React, { createContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import type {
  User,
  AuthResponse,
  SingleResponse,
  AdminUser,
  RolePermissions,
} from "@/types";
import type { Permission, Role } from "@/config";
import apiService from "@/lib/apiService";
import {
  getToken,
  setToken,
  removeToken,
  getUser as getStoredUser,
  setUser as setStoredUser,
  removeUser as removeStoredUser,
} from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "@/lib/redux/user/user";
import {
  PermissionState,
  setPermissions,
} from "@/lib/redux/permission/permissionSlice";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: Role) => boolean;
  adminUser: AdminUser[] | null;
}

// ✅ Make sure User type has optional id
declare module "@/types" {
  interface User {
    id?: string;
  }
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setAuthTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser[] | null>(null);
  const newRolePermissions = {
    userMenu: {
      createNew: false,
      edit: false,
      viewMenu: false,
      delete: false,
      addToken: false,
      updateStatus: false,
    },
    toolCategoriesMenu: {
      createNew: false,
      edit: false,
      viewMenu: false,
      delete: false,
      statusChange: false,
    },
    toolsManagementMenu: {
      createNew: false,
      edit: false,
      viewMenu: false,
      delete: false,
      statusChange: false,
    },
    marketingToolCategoriesMenu: {
      createNew: false,
      edit: false,
      viewMenu: false,
      delete: false,
      statusChange: false,
    },
    marketingToolsManagementMenu: {
      createNew: false,
      edit: false,
      viewMenu: false,
      delete: false,
      statusChange: false,
    },
    homeToolCategoriesMenu: {
      createNew: false,
      edit: false,
      viewMenu: false,
      delete: false,
      statusChange: false,
    },
    homeToolTagMenu: {
      createNew: false,
      edit: false,
      viewMenu: false,
      delete: false,
      statusChange: false,
    },
    writingCommonOtherToolsManageMenu: {
      createNew: false,
      edit: false,
      viewMenu: false,
      delete: false,
      statusChange: false,
    },
    careerCommonOtherToolsManageMenu: {
      createNew: false,
      edit: false,
      viewMenu: false,
      delete: false,
      statusChange: false,
    },
    travelCommonOtherToolsManageMenu: {
      createNew: false,
      edit: false,
      viewMenu: false,
      delete: false,
      statusChange: false,
    },
    foodCommonOtherToolsManageMenu: {
      createNew: false,
      edit: false,
      viewMenu: false,
      delete: false,
      statusChange: false,
    },
    healthCommonOtherToolsManageMenu: {
      createNew: false,
      edit: false,
      viewMenu: false,
      delete: false,
      statusChange: false,
    },
    businessCommonOtherToolsManageMenu: {
      createNew: false,
      edit: false,
      viewMenu: false,
      delete: false,
      statusChange: false,
    },
    financeCommonOtherToolsManageMenu: {
      createNew: false,
      edit: false,
      viewMenu: false,
      delete: false,
      statusChange: false,
    },
    // extraCommonOtherToolsManageMenu: {
    //   createNew: false,
    //   edit: false,
    //   viewMenu: false,
    //   delete: false,
    //   statusChange: false,
    // },
    // newsMenu: {
    //   createNew: false,
    //   edit: false,
    //   viewMenu: false,
    //   delete: false,
    //   statusChange: false,
    // },
    newsCategoryMenu: {
      createNew: false,
      edit: false,
      viewMenu: false,
      delete: false,
      statusChange: false,
    },
    pagesMenu: {
      createNew: false,
      edit: false,
      viewMenu: false,
      delete: false,
    },
    pageBuilderMenu: {
      // createNew: false,
      edit: false,
      // viewMenu: false,
      // delete: false,
    },
    systemLogsMenu: { viewAllData: false },
    contactMenu: { viewOnly: false, deleteData: false },
    seoMenu: { edit: false },
    faviconSettingMenu: { edit: false },
    discoverRecipesCategoriesMenu: {
      createNew: false,
      edit: false,
      viewMenu: false,
      delete: false,
    },
    discoverRecipesCollectionsMenu: {
      createNew: false,
      edit: false,
      viewMenu: false,
      delete: false,
      statusChange: false,
    },
    discoverRecipesToolsMenu: {
      viewMenu: false,
      edit: false,
    },
    discoverDestinationsCategoriesMenu: {
      createNew: false,
      edit: false,
      viewMenu: false,
      delete: false,
    },
    discoverDestinationsCollectionsMenu: {
      createNew: false,
      edit: false,
      viewMenu: false,
      delete: false,
      statusChange: false,
    },
    discoverDestinationsToolsMenu: {
      viewMenu: false,
      edit: false,
    },
    findCompaniesMenu: {
      edit: false,
    },
    coverLetterGeneratorMenu: {
      edit: false,
    },
    resumeGeneratorMenu: {
      edit: false,
    },
    jobProtectionMenu: {
      edit: false,
    },
    jobAutomationCheckerMenu: {
      edit: false,
    },
    onlineIncomeMenu: {
      edit: false,
    },
    businessNameGenerator: {
      edit: false,
    },
    businessIdeasGenerator: {
      edit: false,
    },
    interviewPreparationMenu: {
      edit: false,
    },
    emailMenu: {
      edit: false,
    },
    paraphraseMenu: {
      edit: false,
    },
    messageMenu: {
      edit: false,
    },
    checkGrammarMenu: {
      edit: false,
    },
    blogPostMenu: {
      edit: false,
    },
    socialMediaMenu: {
      edit: false,
    },
    translateContentMenu: {
      edit: false,
    },
    wellnessMenu: {
      edit: false,
    },
    therapyMenu: {
      edit: false,
    },
    weightLossMenu: {
      edit: false,
    },
    nutritionPlannerMenu: {
      edit: false,
    },
    calorieCalculatorMenu: {
      edit: false,
    },
    symptomCheckerMenu: {
      edit: false,
    },
    solutionsMenu: {
      edit: false,
    },
    documentsMenu: {
      edit: false,
    },
    researchMenu: {
      edit: false,
    },
    marketingMenu: {
      edit: false,
    },
    fundingMenu: {
      edit: false,
    },
    financialAdvisorMenu: {
      edit: false,
    },
    saveMoneyMenu: {
      edit: false,
    },
    budgetCalculatorMenu: {
      edit: false,
    },
    retirementCalculatorMenu: {
      edit: false,
    },
    debtReliefMenu: {
      edit: false,
    },
    investingMenu: {
      edit: false,
    },
    VisionBoardGeneratorMenu: {
      edit: false,
    },
    LifeGoalsGeneratorMenu: {
      edit: false,
    },
    NewYearsResolutionGeneratorMenu: {
      edit: false,
    },
    //    KeywordSearchMenu: {
    //   edit: false,
    // },
    //  WebsiteSearchMenu: {
    //    edit: false,
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
    codingPromptTopicMenu: {
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
    leadMagnetsMenu: {
      createNew: false,
      edit: false,
      viewMenu: false,
      delete: false,
      statusChange: false,
    },
    leadMagnetCategoriesMenu: {
      createNew: false,
      edit: false,
      viewMenu: false,
      delete: false,
      statusChange: false,
    },
  };
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const dispatch = useDispatch();

  const pascalToCamelCase = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(pascalToCamelCase);
    } else if (obj !== null && typeof obj === "object") {
      return Object.keys(obj).reduce((acc, key) => {
        const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
        acc[camelKey] = pascalToCamelCase(obj[key]);
        return acc;
      }, {} as any);
    }
    return obj;
  };

  const fetchUserPermissions = useCallback(
    async (userId: string) => {
      if (!userId) return;
      try {
        const response = await apiService<SingleResponse<AdminUser[]>>(
          `/admin/users-admin/${userId}`,
          {
            method: "GET",
          }
        );

        if (response.success && response.data) {
          const roles: RolePermissions =
            response.data[0]?.role?.permissions || {};
          setAdminUser(response.data);

          const camelCasePermissions = pascalToCamelCase(roles);

          // Create a properly structured permissions object that matches your Redux state
          const mappedPermissions: PermissionState = {
            userMenu: {
              createNew: camelCasePermissions.userMenu?.createNew || false,
              edit: camelCasePermissions.userMenu?.edit || false,
              viewMenu: camelCasePermissions.userMenu?.viewMenu || false,
              delete: camelCasePermissions.userMenu?.delete || false,
              addToken: camelCasePermissions.userMenu?.addToken || false,
              updateStatus:
                camelCasePermissions.userMenu?.updateStatus || false,
            },
            toolCategoriesMenu: {
              createNew:
                camelCasePermissions.toolCategoriesMenu?.createNew || false,
              edit: camelCasePermissions.toolCategoriesMenu?.edit || false,
              viewMenu:
                camelCasePermissions.toolCategoriesMenu?.viewMenu || false,
              delete: camelCasePermissions.toolCategoriesMenu?.delete || false,
              statusChange:
                camelCasePermissions.toolCategoriesMenu?.statusChange || false,
            },
            toolsManagementMenu: {
              createNew:
                camelCasePermissions.toolsManagementMenu?.createNew || false,
              edit: camelCasePermissions.toolsManagementMenu?.edit || false,
              viewMenu:
                camelCasePermissions.toolsManagementMenu?.viewMenu || false,
              delete: camelCasePermissions.toolsManagementMenu?.delete || false,
              statusChange:
                camelCasePermissions.toolsManagementMenu?.statusChange || false,
            },
            marketingToolCategoriesMenu: {
              createNew:
                camelCasePermissions.marketingToolCategoriesMenu?.createNew ||
                false,
              edit:
                camelCasePermissions.marketingToolCategoriesMenu?.edit || false,
              viewMenu:
                camelCasePermissions.marketingToolCategoriesMenu?.viewMenu ||
                false,
              delete:
                camelCasePermissions.marketingToolCategoriesMenu?.delete ||
                false,
              statusChange:
                camelCasePermissions.marketingToolCategoriesMenu
                  ?.statusChange || false,
            },
            marketingToolsManagementMenu: {
              createNew:
                camelCasePermissions.marketingToolsManagementMenu?.createNew ||
                false,
              edit:
                camelCasePermissions.marketingToolsManagementMenu?.edit ||
                false,
              viewMenu:
                camelCasePermissions.marketingToolsManagementMenu?.viewMenu ||
                false,
              delete:
                camelCasePermissions.marketingToolsManagementMenu?.delete ||
                false,
              statusChange:
                camelCasePermissions.marketingToolsManagementMenu
                  ?.statusChange || false,
            },
            homeToolCategoriesMenu: {
              createNew:
                camelCasePermissions.homeToolCategoriesMenu?.createNew || false,
              edit: camelCasePermissions.homeToolCategoriesMenu?.edit || false,
              viewMenu:
                camelCasePermissions.homeToolCategoriesMenu?.viewMenu || false,
              delete:
                camelCasePermissions.homeToolCategoriesMenu?.delete || false,
              statusChange:
                camelCasePermissions.homeToolCategoriesMenu?.statusChange ||
                false,
            },

            homeToolTagMenu: {
              createNew:
                camelCasePermissions.homeToolTagMenu?.createNew || false,
              edit: camelCasePermissions.homeToolTagMenu?.edit || false,
              viewMenu: camelCasePermissions.homeToolTagMenu?.viewMenu || false,
              delete: camelCasePermissions.homeToolTagMenu?.delete || false,
              statusChange:
                camelCasePermissions.homeToolTagMenu?.statusChange || false,
            },
            writingCommonOtherToolsManageMenu: {
              createNew:
                camelCasePermissions.writingCommonOtherToolsManageMenu
                  ?.createNew || false,
              edit:
                camelCasePermissions.writingCommonOtherToolsManageMenu?.edit ||
                false,
              viewMenu:
                camelCasePermissions.writingCommonOtherToolsManageMenu
                  ?.viewMenu || false,
              delete:
                camelCasePermissions.writingCommonOtherToolsManageMenu
                  ?.delete || false,
              statusChange:
                camelCasePermissions.writingCommonOtherToolsManageMenu
                  ?.statusChange || false,
            },
            careerCommonOtherToolsManageMenu: {
              createNew:
                camelCasePermissions.careerCommonOtherToolsManageMenu
                  ?.createNew || false,
              edit:
                camelCasePermissions.careerCommonOtherToolsManageMenu?.edit ||
                false,
              viewMenu:
                camelCasePermissions.careerCommonOtherToolsManageMenu
                  ?.viewMenu || false,
              delete:
                camelCasePermissions.careerCommonOtherToolsManageMenu?.delete ||
                false,
              statusChange:
                camelCasePermissions.careerCommonOtherToolsManageMenu
                  ?.statusChange || false,
            },
            travelCommonOtherToolsManageMenu: {
              createNew:
                camelCasePermissions.travelCommonOtherToolsManageMenu
                  ?.createNew || false,
              edit:
                camelCasePermissions.travelCommonOtherToolsManageMenu?.edit ||
                false,
              viewMenu:
                camelCasePermissions.travelCommonOtherToolsManageMenu
                  ?.viewMenu || false,
              delete:
                camelCasePermissions.travelCommonOtherToolsManageMenu?.delete ||
                false,
              statusChange:
                camelCasePermissions.travelCommonOtherToolsManageMenu
                  ?.statusChange || false,
            },
            foodCommonOtherToolsManageMenu: {
              createNew:
                camelCasePermissions.foodCommonOtherToolsManageMenu
                  ?.createNew || false,
              edit:
                camelCasePermissions.foodCommonOtherToolsManageMenu?.edit ||
                false,
              viewMenu:
                camelCasePermissions.foodCommonOtherToolsManageMenu?.viewMenu ||
                false,
              delete:
                camelCasePermissions.foodCommonOtherToolsManageMenu?.delete ||
                false,
              statusChange:
                camelCasePermissions.foodCommonOtherToolsManageMenu
                  ?.statusChange || false,
            },
            healthCommonOtherToolsManageMenu: {
              createNew:
                camelCasePermissions.healthCommonOtherToolsManageMenu
                  ?.createNew || false,
              edit:
                camelCasePermissions.healthCommonOtherToolsManageMenu?.edit ||
                false,
              viewMenu:
                camelCasePermissions.healthCommonOtherToolsManageMenu
                  ?.viewMenu || false,
              delete:
                camelCasePermissions.healthCommonOtherToolsManageMenu?.delete ||
                false,
              statusChange:
                camelCasePermissions.healthCommonOtherToolsManageMenu
                  ?.statusChange || false,
            },
            businessCommonOtherToolsManageMenu: {
              createNew:
                camelCasePermissions.businessCommonOtherToolsManageMenu
                  ?.createNew || false,
              edit:
                camelCasePermissions.businessCommonOtherToolsManageMenu?.edit ||
                false,
              viewMenu:
                camelCasePermissions.businessCommonOtherToolsManageMenu
                  ?.viewMenu || false,
              delete:
                camelCasePermissions.businessCommonOtherToolsManageMenu
                  ?.delete || false,
              statusChange:
                camelCasePermissions.businessCommonOtherToolsManageMenu
                  ?.statusChange || false,
            },
            financeCommonOtherToolsManageMenu: {
              createNew:
                camelCasePermissions.financeCommonOtherToolsManageMenu
                  ?.createNew || false,
              edit:
                camelCasePermissions.financeCommonOtherToolsManageMenu?.edit ||
                false,
              viewMenu:
                camelCasePermissions.financeCommonOtherToolsManageMenu
                  ?.viewMenu || false,
              delete:
                camelCasePermissions.financeCommonOtherToolsManageMenu
                  ?.delete || false,
              statusChange:
                camelCasePermissions.financeCommonOtherToolsManageMenu
                  ?.statusChange || false,
            },
            // extraCommonOtherToolsManageMenu: {
            //   createNew: camelCasePermissions.extraCommonOtherToolsManageMenu?.createNew || false,
            //   edit: camelCasePermissions.extraCommonOtherToolsManageMenu?.edit || false,
            //   viewMenu: camelCasePermissions.extraCommonOtherToolsManageMenu?.viewMenu || false,
            //   delete: camelCasePermissions.extraCommonOtherToolsManageMenu?.delete || false,
            //   statusChange: camelCasePermissions.extraCommonOtherToolsManageMenu?.statusChange || false,
            // },

            newsCategoryMenu: {
              createNew:
                camelCasePermissions.newsCategoryMenu?.createNew || false,
              edit: camelCasePermissions.newsCategoryMenu?.edit || false,
              viewMenu:
                camelCasePermissions.newsCategoryMenu?.viewMenu || false,
              delete: camelCasePermissions.newsCategoryMenu?.delete || false,
              statusChange:
                camelCasePermissions.newsCategoryMenu?.statusChange || false,
            },
            pagesMenu: {
              createNew: camelCasePermissions.pagesMenu?.createNew || false,
              edit: camelCasePermissions.pagesMenu?.edit || false,
              viewMenu: camelCasePermissions.pagesMenu?.viewMenu || false,
              delete: camelCasePermissions.pagesMenu?.delete || false,
            },
            pageBuilderMenu: {
              // createNew: camelCasePermissions.pageBuilderMenu?.createNew || false,
              edit: camelCasePermissions.pageBuilderMenu?.edit || false,
              // viewMenu: camelCasePermissions.pageBuilderMenu?.viewMenu || false,
              // delete: camelCasePermissions.pageBuilderMenu?.delete || false,
            },

            systemLogsMenu: {
              viewAllData:
                camelCasePermissions.systemLogsMenu?.viewAllData || false,
            },
            contactMenu: {
              viewOnly: camelCasePermissions.contactMenu?.viewOnly || false,
              deleteData: camelCasePermissions.contactMenu?.deleteData || false,
            },
            seoMenu: {
              edit: camelCasePermissions.seoMenu?.edit || false,
            },
            faviconSettingMenu: {
              edit: camelCasePermissions.faviconSettingMenu?.edit || false,
            },
            discoverRecipesCategoriesMenu: {
              createNew:
                camelCasePermissions.discoverRecipesCategoriesMenu?.createNew ||
                false,
              edit:
                camelCasePermissions.discoverRecipesCategoriesMenu?.edit ||
                false,
              viewMenu:
                camelCasePermissions.discoverRecipesCategoriesMenu?.viewMenu ||
                false,
              delete:
                camelCasePermissions.discoverRecipesCategoriesMenu?.delete ||
                false,
            },
            discoverRecipesCollectionsMenu: {
              createNew:
                camelCasePermissions.discoverRecipesCollectionsMenu
                  ?.createNew || false,
              edit:
                camelCasePermissions.discoverRecipesCollectionsMenu?.edit ||
                false,
              viewMenu:
                camelCasePermissions.discoverRecipesCollectionsMenu?.viewMenu ||
                false,
              delete:
                camelCasePermissions.discoverRecipesCollectionsMenu?.delete ||
                false,
              statusChange:
                camelCasePermissions.discoverRecipesCollectionsMenu
                  ?.statusChange || false,
            },
            discoverRecipesToolsMenu: {
              viewMenu:
                camelCasePermissions.discoverRecipesToolsMenu?.viewMenu ||
                false,
              edit:
                camelCasePermissions.discoverRecipesToolsMenu?.edit || false,
            },
            discoverDestinationsCategoriesMenu: {
              createNew:
                camelCasePermissions.discoverDestinationsCategoriesMenu
                  ?.createNew || false,
              edit:
                camelCasePermissions.discoverDestinationsCategoriesMenu?.edit ||
                false,
              viewMenu:
                camelCasePermissions.discoverDestinationsCategoriesMenu
                  ?.viewMenu || false,
              delete:
                camelCasePermissions.discoverDestinationsCategoriesMenu
                  ?.delete || false,
            },
            discoverDestinationsCollectionsMenu: {
              createNew:
                camelCasePermissions.discoverDestinationsCollectionsMenu
                  ?.createNew || false,
              edit:
                camelCasePermissions.discoverDestinationsCollectionsMenu
                  ?.edit || false,
              viewMenu:
                camelCasePermissions.discoverDestinationsCollectionsMenu
                  ?.viewMenu || false,
              delete:
                camelCasePermissions.discoverDestinationsCollectionsMenu
                  ?.delete || false,
              statusChange:
                camelCasePermissions.discoverDestinationsCollectionsMenu
                  ?.statusChange || false,
            },
            discoverDestinationsToolsMenu: {
              viewMenu:
                camelCasePermissions.discoverDestinationsToolsMenu?.viewMenu ||
                false,
              edit:
                camelCasePermissions.discoverDestinationsToolsMenu?.edit ||
                false,
            },
            findCompaniesMenu: {
              edit: camelCasePermissions.findCompaniesMenu?.edit || false,
            },
            coverLetterGeneratorMenu: {
              edit:
                camelCasePermissions.coverLetterGeneratorMenu?.edit || false,
            },
            resumeGeneratorMenu: {
              edit: camelCasePermissions.resumeGeneratorMenu?.edit || false,
            },
            jobProtectionMenu: {
              edit: camelCasePermissions.jobProtectionMenu?.edit || false,
            },
            jobAutomationCheckerMenu: {
              edit:
                camelCasePermissions.jobAutomationCheckerMenu?.edit || false,
            },
            onlineIncomeMenu: {
              edit: camelCasePermissions.onlineIncomeMenu?.edit || false,
            },
            businessNameGenerator: {
              edit: camelCasePermissions.businessNameGenerator?.edit || false,
            },
            businessIdeasGenerator: {
              edit: camelCasePermissions.businessIdeasGenerator?.edit || false,
            },
            interviewPreparationMenu: {
              edit:
                camelCasePermissions.interviewPreparationMenu?.edit || false,
            },
            emailMenu: {
              edit: camelCasePermissions.emailMenu?.edit || false,
            },
            paraphraseMenu: {
              edit: camelCasePermissions.paraphraseMenu?.edit || false,
            },
            messageMenu: {
              edit: camelCasePermissions.messageMenu?.edit || false,
            },
            checkGrammarMenu: {
              edit: camelCasePermissions.checkGrammarMenu?.edit || false,
            },
            blogPostMenu: {
              edit: camelCasePermissions.blogPostMenu?.edit || false,
            },
            socialMediaMenu: {
              edit: camelCasePermissions.socialMediaMenu?.edit || false,
            },
            translateContentMenu: {
              edit: camelCasePermissions.translateContentMenu?.edit || false,
            },
            wellnessMenu: {
              edit: camelCasePermissions.wellnessMenu?.edit || false,
            },
            therapyMenu: {
              edit: camelCasePermissions.therapyMenu?.edit || false,
            },
            weightLossMenu: {
              edit: camelCasePermissions.weightLossMenu?.edit || false,
            },
            nutritionPlannerMenu: {
              edit: camelCasePermissions.nutritionPlannerMenu?.edit || false,
            },
            calorieCalculatorMenu: {
              edit: camelCasePermissions.calorieCalculatorMenu?.edit || false,
            },
            symptomCheckerMenu: {
              edit: camelCasePermissions.symptomCheckerMenu?.edit || false,
            },
            solutionsMenu: {
              edit: camelCasePermissions.solutionsMenu?.edit || false,
            },
            documentsMenu: {
              edit: camelCasePermissions.documentsMenu?.edit || false,
            },
            researchMenu: {
              edit: camelCasePermissions.researchMenu?.edit || false,
            },
            marketingMenu: {
              edit: camelCasePermissions.marketingMenu?.edit || false,
            },
            fundingMenu: {
              edit: camelCasePermissions.fundingMenu?.edit || false,
            },
            financialAdvisorMenu: {
              edit: camelCasePermissions.financialAdvisorMenu?.edit || false,
            },
            saveMoneyMenu: {
              edit: camelCasePermissions.saveMoneyMenu?.edit || false,
            },
            budgetCalculatorMenu: {
              edit: camelCasePermissions.budgetCalculatorMenu?.edit || false,
            },
            retirementCalculatorMenu: {
              edit:
                camelCasePermissions.retirementCalculatorMenu?.edit || false,
            },
            debtReliefMenu: {
              edit: camelCasePermissions.debtReliefMenu?.edit || false,
            },
            investingMenu: {
              edit: camelCasePermissions.investingMenu?.edit || false,
            },
            VisionBoardGeneratorMenu: {
              edit:
                camelCasePermissions.visionBoardGeneratorMenu?.edit || false,
            },
            LifeGoalsGeneratorMenu: {
              edit: camelCasePermissions.lifeGoalsGeneratorMenu?.edit || false,
            },
            NewYearsResolutionGeneratorMenu: {
              edit:
                camelCasePermissions.newYearsResolutionGeneratorMenu?.edit ||
                false,
            },
            // KeywordSearchMenu: {
            //   edit:
            //     camelCasePermissions.keywordSearchMenu?.edit ||
            //     false,
            // },
            //  WebsiteSearchMenu: {
            //   edit:
            //     camelCasePermissions.websiteSearchMenu?.edit ||
            //     false,
            // },
            promptCategoryMenu: {
              createNew:
                camelCasePermissions.promptCategoryMenu?.createNew || false,
              edit: camelCasePermissions.promptCategoryMenu?.edit || false,
              viewMenu:
                camelCasePermissions.promptCategoryMenu?.viewMenu || false,
              delete: camelCasePermissions.promptCategoryMenu?.delete || false,
              statusChange:
                camelCasePermissions.promptCategoryMenu?.statusChange || false,
            },
            promptDataMenu: {
              createNew:
                camelCasePermissions.promptDataMenu?.createNew || false,
              edit: camelCasePermissions.promptDataMenu?.edit || false,
              viewMenu: camelCasePermissions.promptDataMenu?.viewMenu || false,
              delete: camelCasePermissions.promptDataMenu?.delete || false,
              statusChange:
                camelCasePermissions.promptDataMenu?.statusChange || false,
            },
            codingPromptTopicMenu: {
              createNew:
                camelCasePermissions.codingPromptTopicMenu?.createNew || false,
              edit: camelCasePermissions.codingPromptTopicMenu?.edit || false,
              viewMenu:
                camelCasePermissions.codingPromptTopicMenu?.viewMenu || false,
              delete:
                camelCasePermissions.codingPromptTopicMenu?.delete || false,
              statusChange:
                camelCasePermissions.codingPromptTopicMenu?.statusChange || false,
            },
            imageStyleMenu: {
              createNew:
                camelCasePermissions.imageStyleMenu?.createNew || false,
              edit: camelCasePermissions.imageStyleMenu?.edit || false,
              viewMenu: camelCasePermissions.imageStyleMenu?.viewMenu || false,
              delete: camelCasePermissions.imageStyleMenu?.delete || false,
              statusChange:
                camelCasePermissions.imageStyleMenu?.statusChange || false,
            },
            imagePromptMenu: {
              createNew:
                camelCasePermissions.imagePromptMenu?.createNew || false,
              edit: camelCasePermissions.imagePromptMenu?.edit || false,
              viewMenu: camelCasePermissions.imagePromptMenu?.viewMenu || false,
              delete: camelCasePermissions.imagePromptMenu?.delete || false,
              statusChange:
                camelCasePermissions.imagePromptMenu?.statusChange || false,
            },
            videoPromptMenu: {
              createNew:
                camelCasePermissions.videoPromptMenu?.createNew || false,
              edit: camelCasePermissions.videoPromptMenu?.edit || false,
              viewMenu: camelCasePermissions.videoPromptMenu?.viewMenu || false,
              delete: camelCasePermissions.videoPromptMenu?.delete || false,
              statusChange:
                camelCasePermissions.videoPromptMenu?.statusChange || false,
            },
            aiFilterMenu: {
              createNew:
                camelCasePermissions.aiFilterMenu?.createNew || false,
              edit: camelCasePermissions.aiFilterMenu?.edit || false,
              viewMenu: camelCasePermissions.aiFilterMenu?.viewMenu || false,
              delete: camelCasePermissions.aiFilterMenu?.delete || false,
              statusChange:
                camelCasePermissions.aiFilterMenu?.statusChange || false,
            },
            alternativeToolsMenu: {
              createNew:
                camelCasePermissions.alternativeToolsMenu?.createNew || false,
              edit: camelCasePermissions.alternativeToolsMenu?.edit || false,
              viewMenu: camelCasePermissions.alternativeToolsMenu?.viewMenu || false,
              delete: camelCasePermissions.alternativeToolsMenu?.delete || false,
              statusChange:
                camelCasePermissions.alternativeToolsMenu?.statusChange || false,
            },
            // lead magnet permissions
            leadMagnetsMenu: {
              createNew: camelCasePermissions.leadMagnetsMenu?.createNew || false,
              edit: camelCasePermissions.leadMagnetsMenu?.edit || false,
              viewMenu: camelCasePermissions.leadMagnetsMenu?.viewMenu || false,
              delete: camelCasePermissions.leadMagnetsMenu?.delete || false,
              statusChange:
                camelCasePermissions.leadMagnetsMenu?.statusChange || false,
            },

            leadMagnetCategoriesMenu: {
              createNew: camelCasePermissions.leadMagnetCategoriesMenu?.createNew || false,
              edit: camelCasePermissions.leadMagnetCategoriesMenu?.edit || false,
              viewMenu: camelCasePermissions.leadMagnetCategoriesMenu?.viewMenu || false,
              delete: camelCasePermissions.leadMagnetCategoriesMenu?.delete || false,
              statusChange: camelCasePermissions.leadMagnetCategoriesMenu?.statusChange || false,
            },
          };

          console.log("Mapped permissions:", mappedPermissions);
          dispatch(setPermissions(mappedPermissions));
        } else {
          console.log(
            "Failed to fetch admin user permissions:",
            response.message
          );
          setAdminUser(null);
          dispatch(setPermissions(newRolePermissions));
        }
      } catch (error) {
        console.log("Error fetching admin user permissions:", error);
        setAdminUser(null);
        dispatch(setPermissions(newRolePermissions));
      }
    },
    [dispatch]
  );

  const fetchCurrentUser = useCallback(async () => {
    const currentToken = getToken();
    if (!currentToken) {
      setLoading(false);
      setUserState(null);
      setAuthTokenState(null);
      if (pathname !== "/login" && !pathname.startsWith("/_next/")) {
        router.push("/login");
      }
      return;
    }

    setLoading(true);
    try {
      const response = await apiService<AuthResponse>("/auth/me", {
        method: "GET",
      });

      if (response.success && response.user) {
        const effectiveUser = {
          ...response.user,
          id: response.user._id || (response.user as any).id, // ✅ allow both
        };

        dispatch(setUser(effectiveUser));
        setUserState(effectiveUser);
        setStoredUser(effectiveUser);
        setAuthTokenState(currentToken);

        if (
          effectiveUser.roles.some((role) =>
            ["admin", "admin_user"].includes(role.trim().toLowerCase())
          )
        ) {
          dispatch(setPermissions(newRolePermissions)); // ✅ fixed from {}
        } else if (effectiveUser.id) {
          fetchUserPermissions(effectiveUser.id);
        }
      } else {
        throw new Error(response.message || "Failed to fetch user");
      }
    } catch (error: any) {
      console.error("Failed to fetch current user:", error);
      removeToken();
      removeStoredUser();
      setUserState(null);
      setAuthTokenState(null);
      setAdminUser(null);
      if (pathname !== "/login" && !pathname.startsWith("/_next/")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [router, pathname, dispatch, fetchUserPermissions]);

  useEffect(() => {
    const storedToken = getToken();
    const storedUser = getStoredUser();

    if (storedToken) {
      setAuthTokenState(storedToken);
      if (storedUser) {
        setUserState(storedUser);
        setLoading(false);
        fetchCurrentUser();
      } else {
        fetchCurrentUser();
      }
    } else {
      setLoading(false);
      if (pathname !== "/login" && !pathname.startsWith("/_next/")) {
        router.push("/login");
      }
    }
  }, [fetchCurrentUser, pathname, router]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await apiService<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }), // ✅ fixed
        headers: { "Content-Type": "application/json" }, // ✅ fixed
      });
      if (response.success && response.token && response.user) {
        const effectiveUser = {
          ...response.user,
          id: response.user._id || (response.user as any).id,
        };
        setToken(response.token);
        setStoredUser(effectiveUser);
        setAuthTokenState(response.token);
        setUserState(effectiveUser);

        dispatch(setUser(effectiveUser));

        if (
          effectiveUser.roles.includes("Admin") ||
          effectiveUser.roles.includes("Admin_user")
        ) {
          dispatch(setPermissions(newRolePermissions)); // ✅ fixed from {}
        } else if (effectiveUser.id) {
          await fetchUserPermissions(effectiveUser.id);
        }

        router.push("/dashboard");
        toast({
          title: "Login Successful",
          description: `Welcome back, ${effectiveUser.name}!`,
        });
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error: any) {
      let description = "An unexpected error occurred.";
      if (error.message?.toLowerCase().includes("failed to fetch")) {
        description =
          "Login failed: Could not connect to the server. Check your internet or try later.";
      } else if (error.message) {
        description = error.message;
      }
      toast({ title: "Login Failed", description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    removeToken();
    removeStoredUser();
    setUserState(null);
    setAuthTokenState(null);
    setAdminUser(null);
    router.push("/login");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  }, [router, toast]);

  const updateUserProfile = async (data: Partial<User>) => {
    if (!user) return;
    setLoading(true);
    try {
      await apiService<SingleResponse<User>>("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(data), // ✅ fixed
        headers: { "Content-Type": "application/json" }, // ✅ fixed
      });
      await fetchCurrentUser();
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Profile Update Failed",
        description: error.message || "Could not update profile.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const permissionState = useSelector((state: any) => state.permission);

  const hasPermission = useCallback(
    (permissionToCheck: string): boolean => {
      if (!user) return false;
      if (user.roles.includes("Admin") || user.roles.includes("Admin_user"))
        return true;

      const permissionMap: Record<string, boolean> = {
        createNewUser: permissionState.userMenu.createNew,
        editUser: permissionState.userMenu.edit,
        viewUserMenu: permissionState.userMenu.viewMenu,
        deleteUser: permissionState.userMenu.delete,
        addToken: permissionState.userMenu.addToken,
        updateUserStatus: permissionState.userMenu.updateStatus,

        createNewToolCategory: permissionState.toolCategoriesMenu.createNew,
        editToolCategory: permissionState.toolCategoriesMenu.edit,
        viewToolCategoryMenu: permissionState.toolCategoriesMenu.viewMenu,
        deleteToolCategory: permissionState.toolCategoriesMenu.delete,
        toolCategoryStatusChange:
          permissionState.toolCategoriesMenu.statusChange,

        createNewToolsManagement: permissionState.toolsManagementMenu.createNew,
        editToolsManagement: permissionState.toolsManagementMenu.edit,
        viewToolsManagementMenu: permissionState.toolsManagementMenu.viewMenu,
        deleteToolsManagement: permissionState.toolsManagementMenu.delete,
        toolsManagementStatusChange:
          permissionState.toolsManagementMenu.statusChange,

        createNewMarketingCategory:
          permissionState.marketingToolCategoriesMenu.createNew,
        editMarketingCategory: permissionState.marketingToolCategoriesMenu.edit,
        viewMarketingCategoryMenu:
          permissionState.marketingToolCategoriesMenu.viewMenu,
        deleteMarketingCategory:
          permissionState.marketingToolCategoriesMenu.delete,
        marketingCategoryStatusChange:
          permissionState.marketingToolCategoriesMenu.statusChange,

        createMarketingTools:
          permissionState.marketingToolsManagementMenu.createNew,
        editMarketingTools: permissionState.marketingToolsManagementMenu.edit,
        viewMarketingToolsMenu:
          permissionState.marketingToolsManagementMenu.viewMenu,
        deleteMarketingTools:
          permissionState.marketingToolsManagementMenu.delete,
        marketingToolsStatusChange:
          permissionState.marketingToolsManagementMenu.statusChange,

        createHomeToolCategory:
          permissionState.homeToolCategoriesMenu.createNew,
        editHomeToolCategory: permissionState.homeToolCategoriesMenu.edit,
        viewHomeToolCategoriesMenu:
          permissionState.homeToolCategoriesMenu.viewMenu,
        deleteHomeToolCategory: permissionState.homeToolCategoriesMenu.delete,
        homeToolCategoryStatusChange:
          permissionState.homeToolCategoriesMenu.statusChange,
        // Home Tool Tag
        createHomeToolTag: permissionState.homeToolTagMenu.createNew,
        editHomeToolTag: permissionState.homeToolTagMenu.edit,
        viewHomeToolTagsMenu: permissionState.homeToolTagMenu.viewMenu,
        deleteHomeToolTag: permissionState.homeToolTagMenu.delete,
        homeToolTagStatusChange: permissionState.homeToolTagMenu.statusChange,

        // Writing
        createWritingCommonOtherTools:
          permissionState.writingCommonOtherToolsManageMenu.createNew,
        editWritingCommonOtherTools:
          permissionState.writingCommonOtherToolsManageMenu.edit,
        viewWritingCommonOtherToolsMenu:
          permissionState.writingCommonOtherToolsManageMenu.viewMenu,
        deleteWritingCommonOtherTools:
          permissionState.writingCommonOtherToolsManageMenu.delete,
        writingCommonOtherToolsStatusChange:
          permissionState.writingCommonOtherToolsManageMenu.statusChange,

        // Career
        createCareerCommonOtherTools:
          permissionState.careerCommonOtherToolsManageMenu.createNew,
        editCareerCommonOtherTools:
          permissionState.careerCommonOtherToolsManageMenu.edit,
        viewCareerCommonOtherToolsMenu:
          permissionState.careerCommonOtherToolsManageMenu.viewMenu,
        deleteCareerCommonOtherTools:
          permissionState.careerCommonOtherToolsManageMenu.delete,
        careerCommonOtherToolsStatusChange:
          permissionState.careerCommonOtherToolsManageMenu.statusChange,

        // Travel (Destinations)
        createTravelCommonOtherTools:
          permissionState.travelCommonOtherToolsManageMenu.createNew,
        editTravelCommonOtherTools:
          permissionState.travelCommonOtherToolsManageMenu.edit,
        viewTravelCommonOtherToolsMenu:
          permissionState.travelCommonOtherToolsManageMenu.viewMenu,
        deleteTravelCommonOtherTools:
          permissionState.travelCommonOtherToolsManageMenu.delete,
        travelCommonOtherToolsStatusChange:
          permissionState.travelCommonOtherToolsManageMenu.statusChange,

        // Food
        createFoodCommonOtherTools:
          permissionState.foodCommonOtherToolsManageMenu.createNew,
        editFoodCommonOtherTools:
          permissionState.foodCommonOtherToolsManageMenu.edit,
        viewFoodCommonOtherToolsMenu:
          permissionState.foodCommonOtherToolsManageMenu.viewMenu,
        deleteFoodCommonOtherTools:
          permissionState.foodCommonOtherToolsManageMenu.delete,
        foodCommonOtherToolsStatusChange:
          permissionState.foodCommonOtherToolsManageMenu.statusChange,

        // Health
        createHealthCommonOtherTools:
          permissionState.healthCommonOtherToolsManageMenu.createNew,
        editHealthCommonOtherTools:
          permissionState.healthCommonOtherToolsManageMenu.edit,
        viewHealthCommonOtherToolsMenu:
          permissionState.healthCommonOtherToolsManageMenu.viewMenu,
        deleteHealthCommonOtherTools:
          permissionState.healthCommonOtherToolsManageMenu.delete,
        healthCommonOtherToolsStatusChange:
          permissionState.healthCommonOtherToolsManageMenu.statusChange,

        // Business
        createBusinessCommonOtherTools:
          permissionState.businessCommonOtherToolsManageMenu.createNew,
        editBusinessCommonOtherTools:
          permissionState.businessCommonOtherToolsManageMenu.edit,
        viewBusinessCommonOtherToolsMenu:
          permissionState.businessCommonOtherToolsManageMenu.viewMenu,
        deleteBusinessCommonOtherTools:
          permissionState.businessCommonOtherToolsManageMenu.delete,
        businessCommonOtherToolsStatusChange:
          permissionState.businessCommonOtherToolsManageMenu.statusChange,

        // Finance
        createFinanceCommonOtherTools:
          permissionState.financeCommonOtherToolsManageMenu.createNew,
        editFinanceCommonOtherTools:
          permissionState.financeCommonOtherToolsManageMenu.edit,
        viewFinanceCommonOtherToolsMenu:
          permissionState.financeCommonOtherToolsManageMenu.viewMenu,
        deleteFinanceCommonOtherTools:
          permissionState.financeCommonOtherToolsManageMenu.delete,
        financeCommonOtherToolsStatusChange:
          permissionState.financeCommonOtherToolsManageMenu.statusChange,

        // Extra
        // createExtraCommonOtherTools: permissionState.extraCommonOtherToolsManageMenu.createNew,
        // editExtraCommonOtherTools: permissionState.extraCommonOtherToolsManageMenu.edit,
        // viewExtraCommonOtherToolsMenu: permissionState.extraCommonOtherToolsManageMenu.viewMenu,
        // deleteExtraCommonOtherTools: permissionState.extraCommonOtherToolsManageMenu.delete,
        // extraCommonOtherToolsStatusChange: permissionState.extraCommonOtherToolsManageMenu.statusChange,

        // createNewNewsMenu: permissionState.newsMenu.createNew,
        // editNewsMenu: permissionState.newsMenu.edit,
        // viewNewsMenu: permissionState.newsMenu.viewMenu,
        // deleteNewsMenu: permissionState.newsMenu.delete,
        // newsMenuStatusChange: permissionState.newsMenu.statusChange,

        createNewsCategoryMenu: permissionState.newsCategoryMenu.createNew,
        editNewsCategoryMenu: permissionState.newsCategoryMenu.edit,
        viewNewsCategoryMenu: permissionState.newsCategoryMenu.viewMenu,
        deleteNewsCategoryMenu: permissionState.newsCategoryMenu.delete,
        newsCategoryMenuStatusChange:
          permissionState.newsCategoryMenu.statusChange,

        createPagesMenu: permissionState.pagesMenu.createNew,
        editPagesMenu: permissionState.pagesMenu.edit,
        viewPagesMenu: permissionState.pagesMenu.viewMenu,
        deletePagesMenu: permissionState.pagesMenu.delete,

        // 'createNewToolsMenu': permissionState.toolsMenu.createNew,
        // 'editToolsMenu': permissionState.toolsMenu.edit,
        // 'viewToolsMenu': permissionState.toolsMenu.viewMenu,
        // 'deleteToolsMenu': permissionState.toolsMenu.delete,
        // 'toolsMenuStatusChange': permissionState.toolsMenu.statusChange,

        // 'createNewSubscriptionPlans': permissionState.subscriptionPlans.createNew,
        // 'editSubscriptionPlans': permissionState.subscriptionPlans.edit,
        // 'viewSubscriptionPlansMenu': permissionState.subscriptionPlans.viewMenu,
        // 'deleteSubscriptionPlans': permissionState.subscriptionPlans.delete,
        // 'subscriptionPlansStatusChange': permissionState.subscriptionPlans.statusChange,

        viewAllSystemLogs: permissionState.systemLogsMenu.viewAllData,

        viewOnlyContactMenu: permissionState.contactMenu.viewOnly,
        deleteContactData: permissionState.contactMenu.deleteData,

        editSeoMenu: permissionState.seoMenu.edit,
        manageFavicon: permissionState.faviconSettingMenu.edit,
        createRecipesCategoriesMenu:
          permissionState.discoverRecipesCategoriesMenu.createNew,
        editRecipesCategoriesMenu:
          permissionState.discoverRecipesCategoriesMenu.edit,
        viewRecipesCategoriesMenu:
          permissionState.discoverRecipesCategoriesMenu.viewMenu,
        deleteRecipesCategoriesMenu:
          permissionState.discoverRecipesCategoriesMenu.delete,

        createRecipesCollectionsMenu:
          permissionState.discoverRecipesCollectionsMenu.createNew,
        editRecipesCollectionsMenu:
          permissionState.discoverRecipesCollectionsMenu.edit,
        viewRecipesCollectionsMenu:
          permissionState.discoverRecipesCollectionsMenu.viewMenu,
        deleteRecipesCollectionsMenu:
          permissionState.discoverRecipesCollectionsMenu.delete,
        RecipesCollectionsMenuStatusChange:
          permissionState.discoverRecipesCollectionsMenu.statusChange,

        viewRecipesToolsMenu: permissionState.discoverRecipesToolsMenu.viewMenu,
        editRecipesToolsMenu: permissionState.discoverRecipesToolsMenu.edit,

        createDestinationsCategoriesMenu:
          permissionState.discoverDestinationsCategoriesMenu.createNew,
        editDestinationsCategoriesMenu:
          permissionState.discoverDestinationsCategoriesMenu.edit,
        viewDestinationsCategoriesMenu:
          permissionState.discoverDestinationsCategoriesMenu.viewMenu,
        deleteDestinationsCategoriesMenu:
          permissionState.discoverDestinationsCategoriesMenu.delete,

        createDestinationsCollectionsMenu:
          permissionState.discoverDestinationsCollectionsMenu.createNew,
        editDestinationsCollectionsMenu:
          permissionState.discoverDestinationsCollectionsMenu.edit,
        viewDestinationsCollectionsMenu:
          permissionState.discoverDestinationsCollectionsMenu.viewMenu,
        deleteDestinationsCollectionsMenu:
          permissionState.discoverDestinationsCollectionsMenu.delete,
        DestinationsCollectionsMenuStatusChange:
          permissionState.discoverDestinationsCollectionsMenu.statusChange,

        viewDestinationsToolsMenu:
          permissionState.discoverDestinationsToolsMenu.viewMenu,
        editDestinationsToolsMenu:
          permissionState.discoverDestinationsToolsMenu.edit,
        createorupdateFindCompany: permissionState.findCompaniesMenu.edit,
        createorupdateCoverLetterGenerator:
          permissionState.coverLetterGeneratorMenu.edit,
        createorupdateResumeGenerator: permissionState.resumeGeneratorMenu.edit,
        createorupdateJobProtection: permissionState.jobProtectionMenu.edit,
        createorupdateJobAutomationChecker:
          permissionState.jobAutomationCheckerMenu.edit,
        createorupdateOnlineIncome: permissionState.onlineIncomeMenu.edit,
        createorupdateBusinessName: permissionState.businessNameGenerator.edit,
        createorupdateBusinessIdea: permissionState.businessIdeasGenerator.edit,
        createOrupdateInterviewPrep:
          permissionState.interviewPreparationMenu.edit,
        createorupdateEmail: permissionState.emailMenu.edit,
        createorupdateParaphrase: permissionState.paraphraseMenu.edit,
        createorupdateMessage: permissionState.messageMenu.edit,
        createorupdateGrammar: permissionState.checkGrammarMenu.edit,
        createorupdateBlogPost: permissionState.blogPostMenu.edit,
        createorupdateSocialMedia: permissionState.socialMediaMenu.edit,
        createorupdateTranslateContent:
          permissionState.translateContentMenu.edit,
        createorupdateWellness: permissionState.wellnessMenu.edit,
        createorupdateTherapy: permissionState.therapyMenu.edit,
        createorupdateWeightLoss: permissionState.weightLossMenu.edit,
        createorupdateNutritionPlanner:
          permissionState.nutritionPlannerMenu.edit,
        createorupdateCalorieCalculator:
          permissionState.calorieCalculatorMenu.edit,
        createorupdateSymptomChecker: permissionState.symptomCheckerMenu.edit,
        createorupdateSolutions: permissionState.solutionsMenu.edit,
        createorupdateDocuments: permissionState.documentsMenu.edit,
        createorupdateResearch: permissionState.researchMenu.edit,
        createorupdateMarketing: permissionState.marketingMenu.edit,
        createorupdateFunding: permissionState.fundingMenu.edit,
        createorupdateFinancialAdvisor:
          permissionState.financialAdvisorMenu.edit,
        createorupdateSaveMoney: permissionState.saveMoneyMenu.edit,
        createorupdateBudgetCalculator:
          permissionState.budgetCalculatorMenu.edit,
        createorupdateRetirementCalculator:
          permissionState.retirementCalculatorMenu.edit,
        createorupdateDebtRelief: permissionState.debtReliefMenu.edit,
        createorupdateInvesting: permissionState.investingMenu.edit,
        createorupdateVisionBoardGenerator:
          permissionState.VisionBoardGeneratorMenu.edit,
        createorupdateLifeGoalsGenerator:
          permissionState.LifeGoalsGeneratorMenu.edit,
        createorupdateNewYearsResolutionGenerator:
          permissionState.NewYearsResolutionGeneratorMenu.edit,
        //   createorupdateKeywordSearch:
        // permissionState.KeywordSearchMenu.edit,
        //  createorupdateWebsiteSearch:
        // permissionState.WebsiteSearchMenu.edit,
        // 'manage_roles': user.roles.includes('Admin') || user.roles.includes('Admin_user'),
        // 'manage_users': user.roles.includes('Admin') || user.roles.includes('Admin_user'),
        // 'manage_ai_providers': user.roles.includes('Admin') || user.roles.includes('Admin_user'),
        // 'view_payments': user.roles.includes('Admin') || user.roles.includes('Admin_user'),
        // 'process_refunds': user.roles.includes('Admin') || user.roles.includes('Admin_user'),

        //page build menu
        // createPageBuilderMenu: permissionState.pageBuilderMenu.createNew,
        editPageBuilderMenu: permissionState.pageBuilderMenu.edit,
        // viewPageBuilderMenu: permissionState.pageBuilderMenu.viewMenu,
        // deletePageBuilderMenu: permissionState.pageBuilderMenu.delete,

        createPromptCategory: permissionState.promptCategoryMenu.createNew,
        editPromptCategory: permissionState.promptCategoryMenu.edit,
        viewPromptCategoryMenu: permissionState.promptCategoryMenu.viewMenu,
        deletePromptCategory: permissionState.promptCategoryMenu.delete,
        promptCategoryStatusChange: permissionState.promptCategoryMenu.statusChange,

        createPromptData: permissionState.promptDataMenu.createNew,
        editPromptData: permissionState.promptDataMenu.edit,
        viewPromptDataMenu: permissionState.promptDataMenu.viewMenu,
        deletePromptData: permissionState.promptDataMenu.delete,
        promptDataStatusChange: permissionState.promptDataMenu.statusChange,

        viewCodingPromptTopicMenu: permissionState.codingPromptTopicMenu.viewMenu,
        createCodingPromptTopicMenu:
          permissionState.codingPromptTopicMenu.createNew,
        editCodingPromptTopicMenu: permissionState.codingPromptTopicMenu.edit,
        deleteCodingPromptTopicMenu:
          permissionState.codingPromptTopicMenu.delete,
        codingPromptTopicMenuStatusChange:
          permissionState.codingPromptTopicMenu.statusChange,

        createImageStyle: permissionState.imageStyleMenu.createNew,
        editImageStyle: permissionState.imageStyleMenu.edit,
        viewImageStyleMenu: permissionState.imageStyleMenu.viewMenu,
        deleteImageStyle: permissionState.imageStyleMenu.delete,
        imageStyleStatusChange: permissionState.imageStyleMenu.statusChange,

        createImagePrompt: permissionState.imagePromptMenu.createNew,
        editImagePrompt: permissionState.imagePromptMenu.edit,
        viewImagePromptMenu: permissionState.imagePromptMenu.viewMenu,
        deleteImagePrompt: permissionState.imagePromptMenu.delete,
        imagePromptStatusChange: permissionState.imagePromptMenu.statusChange,

        createVideoPrompt: permissionState.videoPromptMenu.createNew,
        editVideoPrompt: permissionState.videoPromptMenu.edit,
        viewVideoPromptMenu: permissionState.videoPromptMenu.viewMenu,
        deleteVideoPrompt: permissionState.videoPromptMenu.delete,
        videoPromptStatusChange: permissionState.videoPromptMenu.statusChange,

        createAiFilterMenu: permissionState.aiFilterMenu.createNew,
        editAiFilterMenu: permissionState.aiFilterMenu.edit,
        viewAiFilterMenu: permissionState.aiFilterMenu.viewMenu,
        deleteAiFilterMenu: permissionState.aiFilterMenu.delete,
        aiFilterMenuStatusChange: permissionState.aiFilterMenu.statusChange,

        createAlternativeTools: permissionState.alternativeToolsMenu.createNew,
        editAlternativeTools: permissionState.alternativeToolsMenu.edit,
        viewAlternativeToolsMenu: permissionState.alternativeToolsMenu.viewMenu,
        deleteAlternativeTools: permissionState.alternativeToolsMenu.delete,
        alternativeToolsMenuStatusChange: permissionState.alternativeToolsMenu.statusChange,
        // lead magnet permissions
        createLeadMagnets: permissionState.leadMagnetsMenu.createNew,
        editLeadMagnets: permissionState.leadMagnetsMenu.edit,
        viewLeadMagnetsMenu: permissionState.leadMagnetsMenu.viewMenu,
        deleteLeadMagnets: permissionState.leadMagnetsMenu.delete,
        leadMagnetsStatusChange: permissionState.leadMagnetsMenu.statusChange,

        // lead magnet categories permissions
        createLeadMagnetCategories: permissionState.leadMagnetCategoriesMenu.createNew,
        editLeadMagnetCategories: permissionState.leadMagnetCategoriesMenu.edit,
        viewLeadMagnetCategoriesMenu: permissionState.leadMagnetCategoriesMenu.viewMenu,
        deleteLeadMagnetCategories: permissionState.leadMagnetCategoriesMenu.delete,
        leadMagnetCategoriesStatusChange: permissionState.leadMagnetCategoriesMenu.statusChange,

      };
      return permissionMap[permissionToCheck] || false;
    },
    [user, permissionState]
  );

  const hasRole = useCallback(
    (roleToCheck: Role): boolean => {
      return user?.roles.includes(roleToCheck) ?? false;
    },
    [user]
  );

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        login,
        logout,
        fetchCurrentUser,
        updateUserProfile,
        hasPermission,
        hasRole,
        adminUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
