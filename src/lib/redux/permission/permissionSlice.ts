import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface PermissionState {
  userMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    addToken: boolean;
    updateStatus: boolean;
  };
  toolCategoriesMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  toolsManagementMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  marketingToolCategoriesMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  marketingToolsManagementMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  // lead magnet permissions
  leadMagnetsMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  leadMagnetCategoriesMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  homeToolCategoriesMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  // New Menu: Home Tool Tag
  homeToolTagMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  // New Menus: Common Other Tools
  writingCommonOtherToolsManageMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  careerCommonOtherToolsManageMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  travelCommonOtherToolsManageMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  foodCommonOtherToolsManageMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  healthCommonOtherToolsManageMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  businessCommonOtherToolsManageMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  financeCommonOtherToolsManageMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  // extraCommonOtherToolsManageMenu: {
  //   createNew: boolean;
  //   edit: boolean;
  //   viewMenu: boolean;
  //   delete: boolean;
  //   statusChange: boolean;
  // };
  // newsMenu: {
  //   createNew: boolean;
  //   edit: boolean;
  //   viewMenu: boolean;
  //   delete: boolean;
  //   statusChange: boolean;
  // };
  newsCategoryMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  pagesMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
  };

  // subscriptionPlans: {
  //     createNew: boolean,
  //     edit: boolean,
  //     viewMenu: boolean,
  //     delete: boolean,
  //     statusChange: boolean,
  // },
  systemLogsMenu: {
    viewAllData: boolean;
  };
  contactMenu: {
    viewOnly: boolean;
    deleteData: boolean;
  };
  seoMenu: {
    edit: boolean;
  };
  faviconSettingMenu: { edit: boolean };
  discoverRecipesCategoriesMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
  };
  discoverRecipesCollectionsMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  discoverRecipesToolsMenu: {
    viewMenu: boolean;
    edit: boolean;
  };
  discoverDestinationsCategoriesMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
  };
  discoverDestinationsCollectionsMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  discoverDestinationsToolsMenu: {
    viewMenu: boolean;
    edit: boolean;
  };
  findCompaniesMenu: {
    edit: boolean;
  };
  coverLetterGeneratorMenu: {
    edit: boolean;
  };
  resumeGeneratorMenu: {
    edit: boolean;
  };
  jobProtectionMenu: {
    edit: boolean;
  };
  jobAutomationCheckerMenu: {
    edit: boolean;
  };
  onlineIncomeMenu: {
    edit: boolean;
  };
  businessNameGenerator: {
    edit: boolean;
  };
  businessIdeasGenerator: {
    edit: boolean;
  };
  interviewPreparationMenu: {
    edit: boolean;
  };
  emailMenu: {
    edit: boolean;
  };
  paraphraseMenu: {
    edit: boolean;
  };
  messageMenu: {
    edit: boolean;
  };
  checkGrammarMenu: {
    edit: boolean;
  };
  blogPostMenu: {
    edit: boolean;
  };
  socialMediaMenu: {
    edit: boolean;
  };
  translateContentMenu: {
    edit: boolean;
  };
  wellnessMenu: {
    edit: boolean;
  };
  therapyMenu: {
    edit: boolean;
  };
  weightLossMenu: {
    edit: boolean;
  };
  nutritionPlannerMenu: {
    edit: boolean;
  };
  calorieCalculatorMenu: {
    edit: boolean;
  };
  symptomCheckerMenu: {
    edit: boolean;
  };
  solutionsMenu: {
    edit: boolean;
  };
  documentsMenu: {
    edit: boolean;
  };
  researchMenu: {
    edit: boolean;
  };
  marketingMenu: {
    edit: boolean;
  };
  fundingMenu: {
    edit: boolean;
  };
  financialAdvisorMenu: {
    edit: boolean;
  };
  saveMoneyMenu: {
    edit: boolean;
  };
  budgetCalculatorMenu: {
    edit: boolean;
  };
  retirementCalculatorMenu: {
    edit: boolean;
  };
  debtReliefMenu: {
    edit: boolean;
  };
  investingMenu: {
    edit: boolean;
  };
  VisionBoardGeneratorMenu: {
    edit: boolean;
  };
  LifeGoalsGeneratorMenu: {
    edit: boolean;
  };
  NewYearsResolutionGeneratorMenu: {
    edit: boolean;
  };
  pageBuilderMenu: {
    // createNew: boolean;
    edit: boolean;
    // viewMenu: boolean;
    // delete: boolean;
  };
  //    KeywordSearchMenu: {
  //  edit: boolean;
  // },
  //  WebsiteSearchMenu: {
  //     edit: boolean;
  // },
  promptCategoryMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  promptDataMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  codingPromptTopicMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  imageStyleMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  imagePromptMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  videoPromptMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  aiFilterMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
  alternativeToolsMenu: {
    createNew: boolean;
    edit: boolean;
    viewMenu: boolean;
    delete: boolean;
    statusChange: boolean;
  };
}

const initialState: PermissionState = {
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


  homeToolCategoriesMenu: {
    createNew: false,
    edit: false,
    viewMenu: false,
    delete: false,
    statusChange: false,
  },
  // Added HomeToolTagMenu
  homeToolTagMenu: {
    createNew: false,
    edit: false,
    viewMenu: false,
    delete: false,
    statusChange: false,
  },
  // Added CommonOtherTools Menus
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
  // toolsMenu: {
  //     createNew: false,
  //     edit: false,
  //     viewMenu: false,
  //     delete: false,
  //     statusChange: false,
  // },
  // subscriptionPlans: {
  //     createNew: false,
  //     edit: false,
  //     viewMenu: false,
  //     delete: false,
  //     statusChange: false,
  // },
  systemLogsMenu: {
    viewAllData: false,
  },
  contactMenu: {
    viewOnly: false,
    deleteData: false,
  },
  seoMenu: {
    edit: false,
  },
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
  pageBuilderMenu: {
    // createNew: false,
    edit: false,
    // viewMenu: false,
    // delete: false,
  },
  //     KeywordSearchMenu: {
  //  edit: false,
  //   },
  //    WebsiteSearchMenu: {
  //     edit: false,
  //   },
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
};

const permissionSlice = createSlice({
  name: "permission",
  initialState,
  reducers: {
    setPermissions: (state, action: PayloadAction<PermissionState>) => {
      console.log(action.payload);
      return { ...state, ...action.payload };
    },
    resetPermissions: () => initialState,
  },
});

export const { setPermissions, resetPermissions } = permissionSlice.actions;
export default permissionSlice.reducer;
