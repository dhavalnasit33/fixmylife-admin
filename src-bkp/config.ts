// export const API_BASE_URL = "https://api.staging.fixmylife.ai/api";
// export const APP_URL = "https://admin.staging.fixmylife.ai";

export const API_BASE_URL = "http://localhost:5000/api";
// export const API_BASE_URL = "https://api.onechatai.ai/api";
export const APP_URL = "https://onechatai.ai";

export type Permission =
  | "view_users"
  | "edit_users"
  | "delete_users"
  | "view_payments"
  | "process_refunds"
  | "view_analytics"
  | "edit_tools"
  | "manage_ai_providers"
  | "manage_plans"
  | "export_data"
  | "createNewUser"
  | "editUser"
  | "viewUserMenu"
  | "deleteUser"
  | "addToken"
  | "updateUserStatus"
  | "createNewToolCategory"
  | "editToolCategory"
  | "viewToolCategoryMenu"
  | "deleteToolCategory"
  | "toolCategoryStatusChange"
  | "createNewToolsManagement"
  | "editToolsManagement"
  | "viewToolsManagementMenu"
  | "deleteToolsManagement"
  | "toolsManagementStatusChange"
  | "createNewToolsMenu"
  | "editToolsMenu"
  | "viewToolsMenu"
  | "deleteToolsMenu"
  | "toolsMenuStatusChange"
  | "createNewNewsMenu"
  | "editNewsMenu"
  | "viewNewsMenu"
  | "deleteNewsMenu"
  | "newsMenuStatusChange"
  | "createNewsCategoryMenu"
  | "editNewsCategoryMenu"
  | "viewNewsCategoryMenu"
  | "deleteNewsCategoryMenu"
  | "newsCategoryMenuStatusChange"
  | "createPagesMenu"
  | "editPagesMenu"
  | "viewPagesMenu"
  | "deletePagesMenu"
  // | 'createNewSubscriptionPlans'
  // | 'editSubscriptionPlans'
  // | 'viewSubscriptionPlansMenu'
  // | 'deleteSubscriptionPlans'
  // | 'subscriptionPlansStatusChange'
  | "viewAllSystemLogs"
  | "viewOnlyContactMenu"
  | "deleteContactData"
  | "editSeoMenu"
  | "manageFavicon"
  | "manage_news"
  | "manage_pages"
  | "manage_roles"
  | "createRecipesCategoriesMenu"
  | "editRecipesCategoriesMenu"
  | "viewRecipesCategoriesMenu"
  | "deleteRecipesCategoriesMenu"
  | "createRecipesCollectionsMenu"
  | "editRecipesCollectionsMenu"
  | "viewRecipesCollectionsMenu"
  | "deleteRecipesCollectionsMenu"
  | "RecipesCollectionsMenuStatusChange"
  | "viewRecipesToolsMenu"
  | "editRecipesToolsMenu"
  | "createDestinationsCategoriesMenu"
  | "viewDestinationsCategoriesMenu"
  | "editDestinationsCategoriesMenu"
  | "deleteDestinationsCategoriesMenu"
  | "viewDestinationsCollectionsMenu"
  | "createDestinationsCollectionsMenu"
  | "editDestinationsCollectionsMenu"
  | "deleteDestinationsCollectionsMenu"
  | "DestinationsCollectionsMenuStatusChange"
  | "viewDestinationsToolsMenu"
  | "editDestinationsToolsMenu"
  | "createorupdateFindCompany"
  | "createorupdateCoverLetterGenerator"
  | "createorupdateOnlineIncome"
  | "createOrupdateInterviewPrep"
  | "createorupdateResumeGenerator"
  | "createorupdateJobProtection"
  | "createorupdateJobAutomationChecker"
  | "createorupdateEmail"
  | "createorupdateParaphrase"
  | "createorupdateMessage"
  | "createorupdateGrammar"
  | "createorupdateBlogPost"
  | "createorupdateSocialMedia"
  | "createorupdateWellness"
  | "createorupdateTherapy"
  | "createorupdateWeightLoss"
  | "createorupdateNutritionPlanner"
  | "createorupdateSymptomChecker"
  | "createorupdateSolutions"
  | "createorupdateDocuments"
  | "createorupdateResearch"
  | "createorupdateMarketing"
  | "createorupdateFunding"
  | "createorupdateBusinessName"
  | "createorupdateBusinessIdea"
  | "createorupdateFinancialAdvisor"
  | "createorupdateSaveMoney"
  | "createorupdateBudgetCalculator"
  | "createorupdateRetirementCalculator"
  | "createorupdateDebtRelief"
  | "createorupdateInvesting"
  | "viewMarketingToolsMenu"
  | "createMarketingTools"
  | "editMarketingTools"
  | "deleteMarketingTools"
  | "marketingToolsStatusChange"
  | "viewLeadMagnetsMenu"
  | "createLeadMagnets"
  | "editLeadMagnets"
  | "deleteLeadMagnets"
  | "leadMagnetsStatusChange"
  | "viewLeadMagnetCategoriesMenu"
  | "createLeadMagnetCategories"
  | "editLeadMagnetCategories"
  | "deleteLeadMagnetCategories"
  | "leadMagnetCategoriesStatusChange"
  | "viewMarketingCategoryMenu"
  | "viewHomeToolCategoriesMenu"
  | "createHomeToolCategory"
  | "editHomeToolCategory"
  | "deleteHomeToolCategory"
  | "homeToolCategoryStatusChange"
  // ... existing permissions ...
  | "viewHomeToolTagsMenu"
  | "createHomeToolTag"
  | "editHomeToolTag"
  | "deleteHomeToolTag"
  | "homeToolTagStatusChange"
  // Writing Common Tools
  | "viewWritingCommonOtherToolsMenu"
  | "createWritingCommonOtherTools"
  | "editWritingCommonOtherTools"
  | "deleteWritingCommonOtherTools"
  | "writingCommonOtherToolsStatusChange"
  // Career Common Tools
  | "viewCareerCommonOtherToolsMenu"
  | "createCareerCommonOtherTools"
  | "editCareerCommonOtherTools"
  | "deleteCareerCommonOtherTools"
  | "careerCommonOtherToolsStatusChange"

  // ✅ Travel (Destinations) Common Tools
  | "viewTravelCommonOtherToolsMenu"
  | "createTravelCommonOtherTools"
  | "editTravelCommonOtherTools"
  | "deleteTravelCommonOtherTools"
  | "travelCommonOtherToolsStatusChange"

  // ✅ Food (Recipes) Common Tools
  | "viewFoodCommonOtherToolsMenu"
  | "createFoodCommonOtherTools"
  | "editFoodCommonOtherTools"
  | "deleteFoodCommonOtherTools"
  | "foodCommonOtherToolsStatusChange"
  // Health Common Tools
  | "viewHealthCommonOtherToolsMenu"
  | "createHealthCommonOtherTools"
  | "editHealthCommonOtherTools"
  | "deleteHealthCommonOtherTools"
  | "healthCommonOtherToolsStatusChange"
  // Business Common Tools
  | "viewBusinessCommonOtherToolsMenu"
  | "createBusinessCommonOtherTools"
  | "editBusinessCommonOtherTools"
  | "deleteBusinessCommonOtherTools"
  | "businessCommonOtherToolsStatusChange"
  // Finance Common Tools
  | "viewFinanceCommonOtherToolsMenu"
  | "createFinanceCommonOtherTools"
  | "editFinanceCommonOtherTools"
  | "deleteFinanceCommonOtherTools"
  | "financeCommonOtherToolsStatusChange"
  // Extra Common Tools
  // | "viewExtraCommonOtherToolsMenu"
  // | "createExtraCommonOtherTools"
  // | "editExtraCommonOtherTools"
  // | "deleteExtraCommonOtherTools"
  // | "extraCommonOtherToolsStatusChange"
  | "createNewMarketingCategory"
  | "editMarketingCategory"
  | "deleteMarketingCategory"
  | "marketingCategoryStatusChange"
  | "createorupdateCalorieCalculator"
  | "createorupdateTranslateContent"
  | "createorupdateVisionBoardGenerator"
  | "createorupdateLifeGoalsGenerator"
  | "createorupdateNewYearsResolutionGenerator"
  | "createorupdateKeywordSearch"
  | "createorupdateWebsiteSearch"
  | "viewWritingTools"
  | "viewExtraTools"
  | "viewFinancialTools"
  | "viewBusinessTools"
  | "viewHealthTools"
  | "viewCareerTools"
  // | "createPageBuilderMenu"
  | "editPageBuilderMenu"
  // | "viewPageBuilderMenu"
  // | "deletePageBuilderMenu";
  // | 'view_all_history'; // This was in an example API response, keeping it commented out as not explicitly requested for UI control here

  // prompt category permissions
  | "viewPromptCategoryMenu"
  | "createPromptCategory"
  | "editPromptCategory"
  | "deletePromptCategory"
  | "promptCategoryStatusChange"

  // prompt data permissions
  | "viewPromptDataMenu"
  | "createPromptData"
  | "editPromptData"
  | "deletePromptData"
  | "promptDataStatusChange"
  // coding prompt topic permissions
  | "viewCodingPromptTopicMenu"
  | "createCodingPromptTopicMenu"
  | "editCodingPromptTopicMenu"
  | "deleteCodingPromptTopicMenu"
  | "codingPromptTopicMenuStatusChange"
  // image style permissions
  | "viewImageStyleMenu"
  | "createImageStyleMenu"
  | "editImageStyleMenu"
  | "deleteImageStyleMenu"
  | "imageStyleMenuStatusChange"
  // image prompt permissions
  | "viewImagePromptMenu"
  | "createImagePromptMenu"
  | "editImagePromptMenu"
  | "deleteImagePromptMenu"
  | "imagePromptMenuStatusChange"
  // video prompt permissions
  | "viewVideoPromptMenu"
  | "createVideoPromptMenu"
  | "editVideoPromptMenu"
  | "deleteVideoPromptMenu"
  | "videoPromptMenuStatusChange"
  // ai filter permissions
  | "viewAiFilterMenu"
  | "createAiFilterMenu"
  | "editAiFilterMenu"
  | "deleteAiFilterMenu"
  | "aiFilterMenuStatusChange"
  // alternative tools permissions
  | "viewAlternativeToolsMenu"
  | "createAlternativeTools"
  | "editAlternativeTools"
  | "deleteAlternativeTools"
  | "alternativeToolsMenuStatusChange";

export const ALL_PERMISSIONS: Permission[] = [
  "view_users",
  "edit_users",
  "delete_users",
  "view_payments",
  "process_refunds",
  "view_analytics",
  "edit_tools",
  "manage_ai_providers",
  "manage_plans",
  "export_data",
  "manage_roles",
  "createNewUser",
  "editUser",
  "viewUserMenu",
  "deleteUser",
  "addToken",
  "updateUserStatus",
  "createNewToolCategory",
  "editToolCategory",
  "viewToolCategoryMenu",
  "deleteToolCategory",
  "toolCategoryStatusChange",
  "createNewToolsManagement",
  "editToolsManagement",
  "viewToolsManagementMenu",
  "deleteToolsManagement",
  "toolsManagementStatusChange",
  "createNewToolsMenu",
  "editToolsMenu",
  "viewToolsMenu",
  "deleteToolsMenu",
  "toolsMenuStatusChange",

  "createNewNewsMenu",
  "editNewsMenu",
  "viewNewsMenu",
  "deleteNewsMenu",
  "newsMenuStatusChange",

  "createNewsCategoryMenu",
  "editNewsCategoryMenu",
  "viewNewsCategoryMenu",
  "deleteNewsCategoryMenu",
  "newsCategoryMenuStatusChange",

  "createPagesMenu",
  "editPagesMenu",
  "viewPagesMenu",
  "deletePagesMenu",
  // 'createNewSubscriptionPlans',
  // 'editSubscriptionPlans',
  // 'viewSubscriptionPlansMenu',
  // 'deleteSubscriptionPlans',
  // 'subscriptionPlansStatusChange',
  "viewAllSystemLogs",
  "viewOnlyContactMenu",
  "deleteContactData",
  "editSeoMenu",
  "manageFavicon",
  "manage_news",
  "manage_pages",
  "createRecipesCategoriesMenu",
  "editRecipesCategoriesMenu",
  "viewRecipesCategoriesMenu",
  "deleteRecipesCategoriesMenu",
  "createRecipesCollectionsMenu",
  "editRecipesCollectionsMenu",
  "viewRecipesCollectionsMenu",
  "deleteRecipesCollectionsMenu",
  "RecipesCollectionsMenuStatusChange",
  "editRecipesToolsMenu",
  "viewRecipesToolsMenu",
  "createDestinationsCategoriesMenu",
  "viewDestinationsCategoriesMenu",
  "editDestinationsCategoriesMenu",
  "deleteDestinationsCategoriesMenu",
  "viewDestinationsCollectionsMenu",
  "createDestinationsCollectionsMenu",
  "editDestinationsCollectionsMenu",
  "deleteDestinationsCollectionsMenu",
  "DestinationsCollectionsMenuStatusChange",
  "editDestinationsToolsMenu",
  "viewDestinationsToolsMenu",
  "createorupdateFindCompany",
  "createorupdateCoverLetterGenerator",
  "createorupdateOnlineIncome",
  "createOrupdateInterviewPrep",
  "createorupdateResumeGenerator",
  "createorupdateJobProtection",
  "createorupdateJobAutomationChecker",
  "createorupdateEmail",
  "createorupdateParaphrase",
  "createorupdateMessage",
  "createorupdateGrammar",
  "createorupdateBlogPost",
  "createorupdateSocialMedia",
  "createorupdateWellness",
  "createorupdateTherapy",
  "createorupdateWeightLoss",
  "createorupdateNutritionPlanner",
  "createorupdateSymptomChecker",
  "createorupdateSolutions",
  "createorupdateDocuments",
  "createorupdateResearch",
  "createorupdateMarketing",
  "createorupdateFunding",
  "createorupdateBusinessName",
  "createorupdateBusinessIdea",
  "createorupdateFinancialAdvisor",
  "createorupdateSaveMoney",
  "createorupdateBudgetCalculator",
  "createorupdateRetirementCalculator",
  "createorupdateDebtRelief",
  "createorupdateInvesting",
  "viewMarketingToolsMenu",
  "createMarketingTools",
  "editMarketingTools",
  "deleteMarketingTools",
  "marketingToolsStatusChange",

  "viewLeadMagnetsMenu",
  "createLeadMagnets",
  "editLeadMagnets",
  "deleteLeadMagnets",
  "leadMagnetsStatusChange",

  "viewLeadMagnetCategoriesMenu",
  "createLeadMagnetCategories",
  "editLeadMagnetCategories",
  "deleteLeadMagnetCategories",
  "leadMagnetCategoriesStatusChange",

  "viewMarketingCategoryMenu",
  "viewHomeToolCategoriesMenu",
  "createHomeToolCategory",
  "editHomeToolCategory",
  "deleteHomeToolCategory",
  "homeToolCategoryStatusChange",

  "viewHomeToolTagsMenu",
  "createHomeToolTag",
  "editHomeToolTag",
  "deleteHomeToolTag",
  "homeToolTagStatusChange",

  "viewWritingCommonOtherToolsMenu",
  "createWritingCommonOtherTools",
  "editWritingCommonOtherTools",
  "deleteWritingCommonOtherTools",
  "writingCommonOtherToolsStatusChange",

  "viewCareerCommonOtherToolsMenu",
  "createCareerCommonOtherTools",
  "editCareerCommonOtherTools",
  "deleteCareerCommonOtherTools",
  "careerCommonOtherToolsStatusChange",

  "viewTravelCommonOtherToolsMenu",
  "createTravelCommonOtherTools",
  "editTravelCommonOtherTools",
  "deleteTravelCommonOtherTools",
  "travelCommonOtherToolsStatusChange",

  "viewFoodCommonOtherToolsMenu",
  "createFoodCommonOtherTools",
  "editFoodCommonOtherTools",
  "deleteFoodCommonOtherTools",
  "foodCommonOtherToolsStatusChange",

  "viewHealthCommonOtherToolsMenu",
  "createHealthCommonOtherTools",
  "editHealthCommonOtherTools",
  "deleteHealthCommonOtherTools",
  "healthCommonOtherToolsStatusChange",

  "viewBusinessCommonOtherToolsMenu",
  "createBusinessCommonOtherTools",
  "editBusinessCommonOtherTools",
  "deleteBusinessCommonOtherTools",
  "businessCommonOtherToolsStatusChange",

  "viewFinanceCommonOtherToolsMenu",
  "createFinanceCommonOtherTools",
  "editFinanceCommonOtherTools",
  "deleteFinanceCommonOtherTools",
  "financeCommonOtherToolsStatusChange",

  // "viewExtraCommonOtherToolsMenu",
  // "createExtraCommonOtherTools",
  // "editExtraCommonOtherTools",
  // "deleteExtraCommonOtherTools",
  // "extraCommonOtherToolsStatusChange",

  "createNewMarketingCategory",
  "editMarketingCategory",
  "deleteMarketingCategory",
  "marketingCategoryStatusChange",
  "createorupdateCalorieCalculator",
  "createorupdateTranslateContent",
  "createorupdateVisionBoardGenerator",
  "createorupdateLifeGoalsGenerator",
  "createorupdateNewYearsResolutionGenerator",
  "createorupdateKeywordSearch",
  "createorupdateWebsiteSearch",
  "viewWritingTools",
  "viewExtraTools",
  "viewFinancialTools",
  "viewBusinessTools",
  "viewHealthTools",
  "viewCareerTools",
  // "createPageBuilderMenu",
  "editPageBuilderMenu",
  // "viewPageBuilderMenu",
  // "deletePageBuilderMenu",
  // prompt category permissions
  "viewPromptCategoryMenu",
  "createPromptCategory",
  "editPromptCategory",
  "deletePromptCategory",
  "promptCategoryStatusChange",
  "viewPromptDataMenu",
  "createPromptData",
  "editPromptData",
  "deletePromptData",
  "promptDataStatusChange",
  "viewCodingPromptTopicMenu",
  "createCodingPromptTopicMenu",
  "editCodingPromptTopicMenu",
  "deleteCodingPromptTopicMenu",
  "codingPromptTopicMenuStatusChange",
  "viewImageStyleMenu",
  "createImageStyleMenu",
  "editImageStyleMenu",
  "deleteImageStyleMenu",
  "imageStyleMenuStatusChange",
  "viewImagePromptMenu",
  "createImagePromptMenu",
  "editImagePromptMenu",
  "deleteImagePromptMenu",
  "imagePromptMenuStatusChange",
  "viewVideoPromptMenu",
  "createVideoPromptMenu",
  "editVideoPromptMenu",
  "deleteVideoPromptMenu",
  "videoPromptMenuStatusChange",
  "viewAiFilterMenu",
  "createAiFilterMenu",
  "editAiFilterMenu",
  "deleteAiFilterMenu",
  "aiFilterMenuStatusChange",
  "viewAlternativeToolsMenu",
  "createAlternativeTools",
  "editAlternativeTools",
  "deleteAlternativeTools",
  "alternativeToolsMenuStatusChange",
];

export type Role =
  | "Admin"
  | "SEO Manager"
  | "Marketing Manager"
  | "UI/UX Designer"
  | "User"
  | "Admin_user";

export const ALL_ROLES_ARRAY: Role[] = [
  "Admin",
  "SEO Manager",
  "Marketing Manager",
  "UI/UX Designer",
  "User",
  "Admin_user",
];

export const ALL_PLANS_ARRAY: string[] = ["basic", "pro", "pro_max"]; // Example plan names

// ROLE_PERMISSIONS defines default sets, but for admin users,
// the 'permissions' array from the API (/auth/me) is the source of truth.
// This map can be used for reference or if a different permission model is needed for non-admin roles.
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  Admin: ALL_PERMISSIONS,
  Admin_user: ALL_PERMISSIONS,
  "SEO Manager": ["view_analytics", "edit_tools"],
  "Marketing Manager": ["view_analytics", "export_data", "edit_tools"],
  "UI/UX Designer": ["edit_tools"],
  User: [],
};

export const CLOUDINARY_CLOUD_NAME = "dyk7nqgkv";
export const CLOUDINARY_UPLOAD_PRESET = "openchatAI";
