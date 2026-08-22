import type { Permission, Role } from "@/config";
import * as z from "zod";

export interface DeviceInfo {
  deviceType?: string;
  browser?: string;
  os?: string;
  ip?: string;
  loginAt?: string | Date;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  plan: string;
  subscription_status?: string | null;
  trial_end?: string | Date | null;
  current_period_end?: string | Date | null;
  subscription_display?: string;
  age?: number;
  region?: string;
  gender?: string;
  remaining_tokens: number;
  roles: Role[];
  status: "active" | "suspended" | "inactive";
  profile_picture?: string | null;
  emailVerified?: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
  permissions?: Permission[];
  history?: UserHistoryItem[];
  devices?: DeviceInfo[];
  has_used_trial?: boolean;
  has_paid_once?: boolean;
  isDiscountEligible?: boolean;
  payment_option?: string | null;
  onboarding_completion_pct?: number;
  interests?: string[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
  stats?: any;
  message?: string;
}

export interface SingleResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// --- Tool Category Schemas ---
export const toolCategorySchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z
    .string()
    .min(5, { message: "Description must be at least 5 characters." }),
  system_prompt: z
    .string()
    .min(10, { message: "System prompt must be at least 10 characters." }),
  category: z
    .string()
    .min(2, { message: "Category type must be at least 2 characters." }),
  icon: z
    .string()
    .url({ message: "Please enter a valid URL for the icon." })
    .optional()
    .or(z.literal("")),
  is_active: z.boolean().default(true),
});

export type ToolCategoryFormValues = z.infer<typeof toolCategorySchema>;

export interface ToolCategory {
  _id: string;
  name: string;
  description: string;
  system_prompt: string;
  category: string;
  usage_count: number;
  is_active: boolean;
  created_by: {
    _id: string;
    name: string;
  };
  icon?: string;
  createdAt: string;
  updatedAt: string;
  children?: ToolCategory[];
  parent?: string | ToolCategory;
}

// --- Tool Schemas ---
export const toolFieldSchema = z.object({
  key: z
    .string()
    .min(1, "Key is required and will be auto-generated from label")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Key can only contain letters, numbers, and underscores",
    ),
  label: z.string().min(1, "Label is required"),
  description: z.string().optional().default(""),
  type: z.enum([
    "textbox",
    "textarea",
    "dropdown",
    "radio",
    "checkbox",
    "number",
    "date",
    "imageupload",
    "fileupload",
  ]),
  required: z.boolean().default(false),
  placeholder: z.string().optional().default(""),
  options: z.preprocess(
    (val) =>
      typeof val === "string" && val.trim() !== ""
        ? val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
        : Array.isArray(val) && val.every((s) => typeof s === "string")
          ? val
          : [],
    z.array(z.string()).optional(),
  ),

  field_prompt_template: z.string().optional().default(""),
});

export type ToolFieldFormValues = z.infer<typeof toolFieldSchema>;

export const toolTabSchema = z.object({
  title: z.string().min(1, "Tab title is required"),
  description: z.string().optional().default(""),
  prompt_template: z.string().optional().default(""),
  fields: z.array(toolFieldSchema).optional().default([]),
});

export type ToolTabFormValues = z.infer<typeof toolTabSchema>;

export const suggestedTopicSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required (can include {{user_input}} for templating)"),
  has_input: z.boolean().default(true),
  input_placeholder: z.string().optional().default(""),
});
export type SuggestedTopicFormValues = z.infer<typeof suggestedTopicSchema>;

export const toolSchema = z.object({
  name: z.string().min(2, "Tool name must be at least 2 characters."),
  short_description: z.string().max(100, "Short category is too long"),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters.")
    .refine((val) => val.replace(/<[^>]*>?/gm, "").trim().length > 0, {
      message: "Description cannot be empty",
    }),
  // description: z.string().min(5, "Description must be at least 5 characters."),
  icon: z
    .string()
    .url({ message: "Icon must be a valid URL." })
    .optional()
    .or(z.literal("")),
  category_id: z.array(z.string()).min(1, "At least one category is required."),
  ai_model_id: z.string().min(1, "AI Model is required."),
  system_prompt_template: z
    .string()
    .min(10, "Overall system prompt template must be at least 10 characters."),
  tabs: z.array(toolTabSchema).optional().default([]),
  suggested_topics: z.array(suggestedTopicSchema).optional().default([]),
  is_active: z.boolean().default(true),
  seo_keyphrase: z.string().max(150).optional(),
  seo_title: z.string().max(150).optional(),
  meta_description: z.string().max(300).optional(),
  cover_image: z.any().optional(),
});

export type ToolFormValues = z.infer<typeof toolSchema>;

export interface ToolField {
  _id?: string;
  key: string;
  label: string;
  description?: string;
  type:
  | "textbox"
  | "textarea"
  | "dropdown"
  | "radio"
  | "checkbox"
  | "number"
  | "date"
  | "imageupload"
  | "fileupload";
  required: boolean;
  placeholder?: string;
  options?: string[];
  field_prompt_template?: string;
}

export interface ToolTab {
  _id?: string;
  title: string;
  description?: string;
  prompt_template: string;
  fields: ToolField[];
}

export interface SuggestedTopic {
  _id?: string;
  title: string;
  has_input: boolean;
  input_placeholder?: string;
}

export interface Tool {
  _id: string;
  name: string;
  short_description?: string;
  description: string;
  icon?: string;
  category_id: {
    _id: string;
    name: string;
    category: string;
  } | null;
  ai_model_id: string | AIModel;
  system_prompt_template: string;
  tabs: ToolTab[];
  suggested_topics: SuggestedTopic[];
  usage_count: number;
  is_active: boolean;
  created_by: {
    _id: string;
    name: string;
  };
  seo_keyphrase?: string;
  seo_title?: string;
  meta_description?: string;
  cover_image?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Lead Magnet Category Schemas ---
export const leadMagnetCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  related_categories: z.array(z.string()).optional().default([]),
  display_order: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  keyphrase: z.string().optional(),
  featured_image: z.string().optional(),
});

export type LeadMagnetCategoryFormValues = z.infer<
  typeof leadMagnetCategorySchema
>;

export interface LeadMagnetCategory {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  related_categories: (string | LeadMagnetCategory)[];
  display_order: number;
  is_active: boolean;
  meta_title?: string;
  meta_description?: string;
  keyphrase?: string;
  featured_image?: string;
  createdAt: string;
  updatedAt: string;
}

// --- AI Provider (Base Configuration) Schemas ---
export const aiProviderConfigRateLimitSchema = z.object({
  requests_per_minute: z.coerce
    .number()
    .int()
    .min(0, "Requests per minute must be non-negative."),
});

export const aiProviderConfigSchema = z.object({
  name: z
    .string()
    .min(1, "Internal name is required (e.g., openai).")
    .regex(
      /^[a-z0-9_]+$/,
      "Internal name can only contain lowercase letters, numbers, and underscores.",
    ),
  title: z.string().min(1, "Title is required"),
  display_name: z.string().min(1, "Display name is required (e.g., OpenAI)."),
  api_key: z.string().optional(),
  base_url: z.string().url("Must be a valid URL.").optional().or(z.literal("")),
  is_active: z.boolean().default(true),
  rate_limit: aiProviderConfigRateLimitSchema.optional(),
  image: z.string().min(1, "Image is required"),
  description: z.string().min(1, "Description is required"),
});

export type AIProviderConfigFormValues = z.infer<typeof aiProviderConfigSchema>;

export interface AIProviderConfig {
  _id: string;
  name: string;
  title: string;
  display_name: string;
  is_active: boolean;
  base_url?: string;
  api_key?: string;
  image: string;
  description: string;
  api_key_set?: boolean;
  rate_limit?: {
    requests_per_minute: number;
  };
  usage_stats?: {
    total_requests: number;
    total_tokens: number;
    last_used?: string;
  };
  createdAt: string;
  updatedAt: string;
}
// --- AI Provider Comparison Schemas ---
export const aiProviderComparisonSchema = z.object({
  modelId: z.string().min(1, "AI Provider Configuration is required"),
  firstModel: z.string().min(1, " AI Prvoider Configuration is required"),
  secondModel: z.string().min(1, " AI Prvoider Configuration is required"),
  slug: z.string().min(1).max(200),
  keyPhrase: z.string().optional(),
  title: z.string().optional(),
  short_description: z
    .string()
    .max(200, "Short description is too long")
    .optional(),
  description: z.string().optional(),
  metaDescription: z.string().optional(),
  coverImage: z
    .string()
    .url("Must be a valid URL.")
    .optional()
    .or(z.literal("")),
  is_active: z.boolean().default(true),
  type: z.enum(["text", "image"]).default("text"),
  categories: z.array(z.string()).optional(), // ✅ Add this
  tags: z.array(z.string()).optional(), // ✅ Add this
});

export type AIProviderComparisonFormValues = z.infer<
  typeof aiProviderComparisonSchema
>;

export interface AIProviderComparison {
  _id: string;
  modelId: AIProviderConfig;
  firstModel: AIProviderConfig;
  secondModel: AIProviderConfig;
  slug: string;
  keyPhrase?: string;
  title?: string;
  description?: string;
  short_description?: string;
  coverImage?: string;
  metaDescription?: string;
  is_active: boolean;
  created_by_user_id: User;
  createdAt: string;
  updatedAt: string;
  type: string;
  categories?: string[];
  tags?: string[];
}

export const modelComparisonGroupDataSchema = z.array(
  z.object({
    firstModel: z.string(),
    secondModels: z.array(z.string()),
  }),
);

// --- AI Model Schemas ---
export const aiModelSchema = z.object({
  ai_provider_id: z.string().min(1, "AI Provider Configuration is required."),
  model: z.string().min(1, "Model identifier is required (e.g., gpt-4o)."),
  is_active: z.boolean().default(true),
  notes: z.string().optional(),
});

export type AIModelFormValues = z.infer<typeof aiModelSchema>;

export interface AIModel {
  _id: string;
  ai_provider_id: AIProviderConfig | string;
  model: string;
  is_active: boolean;
  notes?: string;
  usage_stats?: {
    total_requests: number;
    total_tokens: number;
    last_used?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// --- Plan Schemas ---
export const planSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Internal name must be at least 2 characters." }),
  display_name: z
    .string()
    .min(2, { message: "Display name must be at least 2 characters." }),
  token_limit: z.coerce
    .number()
    .int()
    .min(1, { message: "Token limit must be at least 1." }),
  price: z.coerce.number().min(0, { message: "Price must be non-negative." }),
  yearly_discount_percent: z.number().min(0).max(100).default(20),
  currency: z
    .string()
    .min(3, {
      message: "Currency code must be at least 3 characters (e.g., USD).",
    })
    .max(5),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters." }),
  features: z.preprocess(
    (val) =>
      typeof val === "string"
        ? val
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s)
        : Array.isArray(val)
          ? val
          : [],
    z
      .array(z.string().min(1, "Feature cannot be empty."))
      .min(1, { message: "At least one feature is required." }),
  ),
  is_active: z.boolean().default(true),
  popular: z.boolean().default(false),
  stripe_monthly_price_id: z.string().optional(),
});

export type PlanFormValues = z.infer<typeof planSchema>;

export interface Plan {
  _id: string;
  name: string;
  display_name: string;
  token_limit: number;
  price: number;
  currency: string;
  description: string;
  features: string[];
  is_active: boolean;
  popular: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- User Management Schemas & Types ---
export const userUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  plan: z.string().min(1, "Plan is required"),
  roles: z
    .array(z.string().min(1, "Role cannot be empty"))
    .min(1, "At least one role is required"),
  remaining_tokens: z.preprocess(
    (val) => Number(val),
    z.number().min(0, "Tokens must be 0 or more"),
  ),
});
export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>;

export const addTokensSchema = z.object({
  tokens: z.coerce.number().int().min(1, "Tokens must be a positive integer"),
});
export type AddTokensFormValues = z.infer<typeof addTokensSchema>;

export const updateUserStatusSchema = z.object({
  status: z.enum(["active", "suspended", "inactive"]),
});
export type UpdateUserStatusFormValues = z.infer<typeof updateUserStatusSchema>;

export const createUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  region: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  age: z.coerce
    .number()
    .int()
    .positive("Age must be a positive number")
    .optional(),
  profile_picture: z.string().url().optional().or(z.literal("")),
});
export type CreateUserFormValues = z.infer<typeof createUserSchema>;

// Schema for editing users with optional password
export const editUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: "Password must be at least 6 characters",
    }),
  region: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  age: z.coerce
    .number()
    .int()
    .positive("Age must be a positive number")
    .optional(),
  profile_picture: z.string().url().optional().or(z.literal("")),
  name: z.string().min(2, "Name must be at least 2 characters"),
  plan: z.string().min(1, "Plan is required"),
  roles: z
    .array(z.string().min(1, "Role cannot be empty"))
    .min(1, "At least one role is required"),
  remaining_tokens: z.preprocess(
    (val) => Number(val),
    z.number().min(0, "Tokens must be 0 or more"),
  ),
});
export type EditUserFormValues = z.infer<typeof editUserSchema>;

export const userFormSchema = createUserSchema.merge(userUpdateSchema);
export type FormValues = z.infer<typeof userFormSchema>;

export interface UserHistoryItem {
  _id: string;
  user_id: string;
  prompt: string;
  response: string;
  tool_category_id:
  | {
    _id: string;
    name: string;
    category: string;
  }
  | string
  | null;
  api_used: string;
  tokens_used: number;
  model_used: string;
  response_time: number;
  success: boolean;
  error_message: string | null;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export type UserHistoryResponse = PaginatedResponse<UserHistoryItem>;

export interface UserDevice {
  deviceType: string;
  browser: string;
  os: string;
  ip: string;
  loginAt: string;
}

export interface UserDetails extends User {
  history?: UserHistoryItem[];
  emailVerificationToken?: string;
  resetPasswordExpire?: string;
  resetPasswordToken?: string;
  devices?: UserDevice[];
}

export interface UserUsageStats {
  _id: null | string;
  total_prompts: number;
  total_tokens_used: number;
  successful_prompts: number;
  avg_response_time: number;
}

export interface UserPaymentStats {
  _id: null | string;
  total_payments: number;
  total_spent: number;
  successful_payments: number;
}

export interface UserDetailsResponseData {
  user: UserDetails;
  usage_stats: UserUsageStats;
  payment_stats: UserPaymentStats;
}

// --- Admin User Management ---

export interface RolePermissions {
  SystemLogsMenu: {
    ViewAllData: boolean;
  };
  ContactMenu: {
    ViewOnly: boolean;
    DeleteData: boolean;
  };
  SeoMenu: {
    Edit: boolean;
  };
  FaviconSettingMenu: { Edit: boolean };
  UserMenu: {
    CreateNew: boolean;
    Edit: boolean;
    ViewMenu: boolean;
    Delete: boolean;
    AddToken: boolean;
    UpdateStatus: boolean;
  };
  ToolCategoriesMenu: {
    CreateNew: boolean;
    Edit: boolean;
    ViewMenu: boolean;
    Delete: boolean;
    StatusChange: boolean;
  };
  ToolsManagementMenu: {
    CreateNew: boolean;
    Edit: boolean;
    ViewMenu: boolean;
    Delete: boolean;
    StatusChange: boolean;
  };
  MarketingToolCategoriesMenu: {
    CreateNew: boolean;
    Edit: boolean;
    ViewMenu: boolean;
    Delete: boolean;
    StatusChange: boolean;
  };
  MarketingToolsManagementMenu: {
    CreateNew: boolean;
    Edit: boolean;
    ViewMenu: boolean;
    Delete: boolean;
    StatusChange: boolean;
  };
  LeadMagnetsMenu: {
    CreateNew: boolean;
    Edit: boolean;
    ViewMenu: boolean;
    Delete: boolean;
    StatusChange: boolean;
  };

  LeadMagnetCategoriesMenu: {
    CreateNew: boolean;
    Edit: boolean;
    ViewMenu: boolean;
    Delete: boolean;
    StatusChange: boolean;
  };

  HomeToolCategoriesMenu: {
    CreateNew: boolean;
    Edit: boolean;
    ViewMenu: boolean;
    Delete: boolean;
    StatusChange: boolean;
  };

  HomeToolTagMenu: {
    CreateNew: boolean;
    Edit: boolean;
    ViewMenu: boolean;
    Delete: boolean;
    StatusChange: boolean;
  };
  WritingCommonOtherToolsManageMenu: {
    CreateNew: boolean;
    Edit: boolean;
    ViewMenu: boolean;
    Delete: boolean;
    StatusChange: boolean;
  };
  CareerCommonOtherToolsManageMenu: {
    CreateNew: boolean;
    Edit: boolean;
    ViewMenu: boolean;
    Delete: boolean;
    StatusChange: boolean;
  };
  TravelCommonOtherToolsManageMenu: {
    CreateNew: boolean;
    Edit: boolean;
    ViewMenu: boolean;
    Delete: boolean;
    StatusChange: boolean;
  };
  FoodCommonOtherToolsManageMenu: {
    CreateNew: boolean;
    Edit: boolean;
    ViewMenu: boolean;
    Delete: boolean;
    StatusChange: boolean;
  };
  HealthCommonOtherToolsManageMenu: {
    CreateNew: boolean;
    Edit: boolean;
    ViewMenu: boolean;
    Delete: boolean;
    StatusChange: boolean;
  };
  BusinessCommonOtherToolsManageMenu: {
    CreateNew: boolean;
    Edit: boolean;
    ViewMenu: boolean;
    Delete: boolean;
    StatusChange: boolean;
  };
  FinanceCommonOtherToolsManageMenu: {
    CreateNew: boolean;
    Edit: boolean;
    ViewMenu: boolean;
    Delete: boolean;
    StatusChange: boolean;
  };
  // ExtraCommonOtherToolsManageMenu: {
  //   CreateNew: boolean;
  //   Edit: boolean;
  //   ViewMenu: boolean;
  //   Delete: boolean;
  //   StatusChange: boolean;
  // };

  PagesMenu: {
    CreateNew: boolean;
    Edit: boolean;
    ViewMenu: boolean;
    Delete: boolean;
  };
  PageBuilderMenu: {
    // CreateNew: boolean;
    Edit: boolean;
    // ViewMenu: boolean;
    // Delete: boolean;
  };
  // NewsMenu: {
  //   CreateNew: boolean;
  //   Edit: boolean;
  //   ViewMenu: boolean;
  //   Delete: boolean;
  //   StatusChange: boolean;
  // };
  NewsCategoryMenu: {
    CreateNew: boolean;
    Edit: boolean;
    ViewMenu: boolean;
    Delete: boolean;
    StatusChange: boolean;
  };
  DiscoverRecipesCategoriesMenu: {
    CreateNew: boolean;
    Edit: boolean;
    ViewMenu: boolean;
    Delete: boolean;
  };
  DiscoverRecipesCollectionsMenu: {
    CreateNew: boolean;
    Edit: boolean;
    ViewMenu: boolean;
    Delete: boolean;
    StatusChange: boolean;
  };
  DiscoverRecipesToolsMenu: {
    ViewMenu: boolean;
    Edit: boolean;
  };
  DiscoverDestinationsCategoriesMenu: {
    CreateNew: boolean;
    Edit: boolean;
    ViewMenu: boolean;
    Delete: boolean;
  };
  DiscoverDestinationsCollectionsMenu: {
    CreateNew: boolean;
    Edit: boolean;
    ViewMenu: boolean;
    Delete: boolean;
    StatusChange: boolean;
  };
  DiscoverDestinationsToolsMenu: {
    ViewMenu: boolean;
    Edit: boolean;
  };
  FindCompaniesMenu: {
    Edit: boolean;
  };
  CoverLetterGeneratorMenu: {
    Edit: false;
  };
  ResumeGeneratorMenu: {
    Edit: false;
  };
  JobProtectionMenu: {
    Edit: false;
  };
  JobAutomationCheckerMenu: {
    Edit: false;
  };
  OnlineIncomeMenu: {
    Edit: false;
  };
  BusinessNameGenerator: {
    Edit: false;
  };
  BusinessIdeasGenerator: {
    Edit: false;
  };
  InterviewPreparationMenu: {
    Edit: false;
  };
  EmailMenu: {
    Edit: false;
  };
  ParaphraseMenu: {
    Edit: false;
  };
  MessageMenu: {
    Edit: false;
  };
  CheckGrammarMenu: {
    Edit: false;
  };
  BlogPostMenu: {
    Edit: false;
  };
  SocialMediaMenu: {
    Edit: false;
  };
  TranslateContentMenu: {
    Edit: false;
  };
  WellnessMenu: {
    Edit: false;
  };
  TherapyMenu: {
    Edit: false;
  };
  WeightLossMenu: {
    Edit: false;
  };
  NutritionPlannerMenu: {
    Edit: false;
  };
  CalorieCalculatorMenu: {
    Edit: false;
  };
  SymptomCheckerMenu: {
    Edit: false;
  };
  SolutionsMenu: {
    Edit: false;
  };
  DocumentsMenu: {
    Edit: false;
  };
  ResearchMenu: {
    Edit: false;
  };
  MarketingMenu: {
    Edit: false;
  };
  FundingMenu: {
    Edit: false;
  };
  FinancialAdvisorMenu: {
    Edit: false;
  };
  SaveMoneyMenu: {
    Edit: false;
  };
  BudgetCalculatorMenu: {
    Edit: false;
  };
  RetirementCalculatorMenu: {
    Edit: false;
  };
  DebtReliefMenu: {
    Edit: false;
  };
  InvestingMenu: {
    Edit: false;
  };
  VisionBoardGeneratorMenu: {
    Edit: false;
  };
  LifeGoalsGeneratorMenu: {
    Edit: false;
  };
  NewYearsResolutionGeneratorMenu: {
    Edit: false;
  };
  //  KeywordSearchMenu: {
  //  Edit: false;
  // },
  //  WebsiteSearchMenu: {
  //    Edit: false;
  // },
  // SubscriptionPlans: {
  //   CreateNew: boolean;
  //   Edit: boolean;
  //   ViewMenu: boolean;
  //   Delete: boolean;
  //   StatusChange: boolean;
  // };
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

// NEW INTERFACE: Defines the structure for the full role object, including permissions
export interface AdminRole {
  _id: string;
  roleName: string;
  permissions: RolePermissions; // Uses the new RolePermissions interface
}

export interface AdminUser {
  _id: string;
  user_id: {
    _id: string;
    name: string;
    email: string;
    profile_picture?: string | null;
  };
  role: AdminRole; // Changed to use the AdminRole interface for correct typing
  assigned_by: {
    _id: string;
    name: string;
    email: string;
  };
  extra_permission: RolePermissions; // Extra permissions specific to this admin user,
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}
// can_edit_roles: boolean;
// permissions: Permission[];

export const assignAdminRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required."),
  role: z.string().min(1, "Role is required."),
  extra_permission: z.record(z.any()).optional().default({}),
  // permissions: z.array(z.string()).optional(),
});
export type AssignAdminRoleFormValues = z.infer<typeof assignAdminRoleSchema>;

export const updateAdminPermissionsSchema = z.object({
  role: z.string().min(1, "Role is required."),
  extra_permission: z.record(z.any()).optional().default({}),
});

export type UpdateAdminPermissionsFormValues = z.infer<
  typeof updateAdminPermissionsSchema
>;

// --- System Logs ---
export interface SystemLog {
  id: string;
  timestamp: string;
  level: "info" | "error" | "warn" | "debug";
  message: string;
  details: any;
}

// --- Payment Analytics ---
export interface PaymentAnalyticsByPlanItem {
  plan: string;
  count: number;
  amount: number;
}

export interface PaymentAnalyticsByStatusItem {
  status: string;
  count: number;
  amount: number;
}

export interface PaymentAnalyticsDailyItem {
  date: string;
  count: number;
  amount: number;
}
export type PaymentBreakdown = {
  plan: string;
  status: string;
  payment_method: string;
  count: number;
  total_amount: number;
  avg_amount: number;
};

export type PaymentAnalyticsData = {
  _id: string | null;
  total_revenue: number;
  total_transactions: number;
  success_transactions: number;
  breakdown: PaymentBreakdown[];
  currency?: string;
  daily?: {
    date: string;
    amount: number;
    count: number;
  }[];
};
export type PaymentAnalyticsResponse = {
  success: boolean;
  message?: string;
  data: PaymentAnalyticsData;
};

// --- Refund ---
export const refundSchema = z.object({
  amount: z.coerce
    .number()
    .positive({ message: "Refund amount must be positive." }),
  reason: z
    .string()
    .min(5, { message: "Reason must be at least 5 characters." }),
});
export type RefundFormValues = z.infer<typeof refundSchema>;

// --- Auth ---
export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

// --- Dashboard Analytics ---
interface CountData {
  _id: string | null; // Could be null if grouping by a non-existent field or if no data
  count: number;
}

interface RevenueData {
  total_revenue: number;
  total_transactions: number;
  avg_transaction: number;
}

interface PromptUsageData {
  total_prompts: number;
  successful_prompts: number;
  failed_prompts: number;
  avg_response_time: number; // Assuming in milliseconds
}
export interface MonthlyUsageData {
  _id: {
    year: number;
    month: number;
  };
  unique_users_count: number;
  prompts: number;
  tokens: number;
  unique_users: string[];
}

export interface MonthlyRevenueData {
  _id: {
    year: number;
    month: number;
  } | null;
  total_revenue: number;
  total_transactions?: number;
  avg_transaction?: number;
}

export interface DashboardAnalyticsData {
  users: {
    total: CountData[];
    active: CountData[];
    new_users: CountData[]; // Assuming 'new_users_last_30_days' or similar from API
  };
  revenue: RevenueData;
  usage: PromptUsageData;
  monthly_usage?: MonthlyUsageData[];
  monthly_revenue?: MonthlyRevenueData[];
  period_days?: string;
}

export interface ContactUser {
  _id: string;
  name: string;
  email: string;
  issueCategory: string;
  subject: string;
  message: string;
  createdAt: string;
  updatedAt?: string;
}

export interface YoastSeo {
  _id: string;
  seo_keyphrase?: string;
  seo_title?: string;
  meta_description?: string;
  cover_image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type YoastSeoFormValues = {
  seo_keyphrase: string;
  seo_title: string;
  meta_description: string;
  cover_image: string;
  page_description?: string;
};

export const yoastSeoSchema = z.object({
  seo_keyphrase: z.string().min(1),
  seo_title: z.string().min(1),
  meta_description: z.string().min(1),
  cover_image: z.string().url().or(z.literal("")),
  page_description: z.string().optional(),
});

// Zod schema for form validation
export const pageSchema = z.object({
  page_title: z.string().min(1, "Title is required"),
  display_name: z.string().optional().default(""),
  slug: z.string().min(1, "Slug is required"),
  short_description: z.string().optional(),
  mini_description: z
    .string()
    .max(200, "Mini description cannot exceed 200 characters")
    .optional(),
  page_description: z
    .string()
    .min(1, "Page description is required")
    .refine((val) => val.replace(/<[^>]*>?/gm, "").trim().length > 0, {
      message: "Page description cannot be empty",
    }),
  seo_keyphrase: z.string().optional(),
  seo_title: z.string().optional(),
  meta_description: z.string().optional(),
  cover_image: z.string().optional(),
  tab_normal_icon_image: z.string().optional(),
  tab_active_icon_image: z.string().optional(),
  tab_image: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  allternativeTools: z.array(z.string()).optional().default([]),
  whatCanDO: z.array(z.string()).optional().default([]),
  sticky: z.boolean().default(false).optional(),
});

// Inferred TypeScript types from Zod schema
export type PageFormValues = z.infer<typeof pageSchema>;

// Backend Page document type (from MongoDB)
export type Page = {
  _id: string;
  page_title: string;
  display_name?: string;
  slug: string;
  short_description?: string;
  mini_description?: string;
  page_description?: string;
  seo_keyphrase?: string;
  seo_title?: string;
  meta_description?: string;
  cover_image?: string;
  tab_normal_icon_image?: string;
  tab_active_icon_image?: string;
  tab_image?: string;
  createdAt: string;
  updatedAt: string;
  categories?: string[];
  tags?: string[];
  allternativeTools?: string[];
  whatCanDO?: string[];
  sticky?: boolean;
};

// --- Lead Magnet Schemas ---
export const leadMagnetSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters.")
    .max(200, "Title cannot exceed 200 characters."),
  slug: z.string().optional(),
  description: z.string().optional().default(""),
  short_description: z
    .string()
    .max(200, "Short description cannot exceed 200 characters")
    .optional(),
  mini_description: z
    .string()
    .max(200, "Mini description cannot exceed 200 characters")
    .optional(),
  meta_title: z
    .string()
    .max(200, "Meta title cannot exceed 200 characters")
    .optional(),
  meta_description: z
    .string()
    .max(500, "Meta description cannot exceed 500 characters")
    .optional(),
  keyphrase: z
    .string()
    .max(200, "Keyphrase cannot exceed 200 characters")
    .optional(),
  featured_image: z.string().optional(),
  tab_normal_icon: z.string().optional(),
  tab_active_icon: z.string().optional(),
  tab_image: z.string().optional(),
  industry: z.string().default("General"),
  cta_title: z.string().default("Access 100+ AI tools with OneChat AI"),
  cta_description: z.string().optional().default(""),
  cta_button_text: z.string().default("Try Free"),
  cta_button_link: z.string().default("/register"),
  is_indexed: z.boolean().default(true),
  assigned_tools: z
    .array(
      z.object({
        itemId: z.string(),
        modelName: z.string(),
        sort_order: z.number().optional().default(0),
      })
    )
    .optional()
    .default([]),
  status: z.enum(["draft", "published"]).default("published"),
  category_id: z.string().min(1, "Category is required"),
});

export type LeadMagnetFormValues = z.infer<typeof leadMagnetSchema>;

export interface LeadMagnet {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  short_description?: string;
  mini_description?: string;
  meta_title?: string;
  meta_description?: string;
  keyphrase?: string;
  featured_image?: string;
  tab_normal_icon?: string;
  tab_active_icon?: string;
  tab_image?: string;
  industry: string;
  cta_title: string;
  category_id?: string | { _id: string; name: string };
  cta_description?: string;
  cta_button_text: string;
  cta_button_link: string;
  is_indexed: boolean;
  assigned_tools: {
    itemId: string;
    modelName: string;
    sort_order?: number;
    [key: string]: any;
  }[];
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: string;
  metadata: {
    tokens_used?: number;
    response_time?: number;
    api_used?: string;
    model_used?: string;
    success?: boolean;
  };
}

export interface ChatHistory {
  _id: string;
  title: string;
  total_messages: number;
  total_tokens_used: number;
  is_archived: boolean;
  is_favorite: boolean;
  tags: string[];
  last_activity: string;
  createdAt: string;
  user_id?: {
    name: string;
    _id: string;
  };
  messages: ChatMessage[];
}

export interface ChatHistoryResponse {
  data: ChatHistory[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
  stats: {
    total_chats: number;
    total_messages: number;
    total_tokens: number;
    archived_chats: number;
    favorite_chats: number;
  };
  success: boolean;
}

export const TrendingNewsFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  image: z
    .string()
    .min(1, "Image is required")
    .url("A valid image URL is required"),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters.")
    .refine((val) => val.replace(/<[^>]*>?/gm, "").trim().length > 0, {
      message: "Description cannot be empty",
    }),
  //  description: z.string().max(5000).optional(),
  category_id: z
    .array(z.string().min(1))
    .min(1, "At least one category must be selected"),
});

export type TrendingNewsFormValues = z.infer<typeof TrendingNewsFormSchema>;

export interface TrendingNews {
  _id: string;
  displayOnHomePage: boolean;
  title: string;
  image: string;
  slug: string;
  description: string;
  category_id: string[];
  createdAt: string;
  updatedAt: string;
}

export type roleAndPermission = {
  _id: string;
  roleName: string;
  permissions: {
    UserMenu: {
      CreateNew: false;
      Edit: false;
      ViewMenu: false;
      Delete: false;
      AddToken: false;
      UpdateStatus: false;
    };
    ToolCategoriesMenu: {
      CreateNew: false;
      Edit: false;
      ViewMenu: false;
      Delete: false;
      StatusChange: false;
    };
    ToolsManagementMenu: {
      CreateNew: false;
      Edit: false;
      ViewMenu: false;
      Delete: false;
      StatusChange: false;
    };
    // NewsMenu: {
    //   CreateNew: false;
    //   Edit: false;
    //   ViewMenu: false;
    //   Delete: false;
    //   StatusChange: false;
    // };
    NewsCategoryMenu: {
      CreateNew: false;
      Edit: false;
      ViewMenu: false;
      Delete: false;
      StatusChange: false;
    };
    PagesMenu: {
      CreateNew: false;
      Edit: false;
      ViewMenu: false;
      Delete: false;
    };
    PageBuilderMenu: {
      // CreateNew: false;
      Edit: false;
      // ViewMenu: false;
      // Delete: false;
    };
    LeadMagnetsMenu: {
      CreateNew: false;
      Edit: false;
      ViewMenu: false;
      Delete: false;
      StatusChange: false;
    };
    LeadMagnetCategoriesMenu: {
      CreateNew: false;
      Edit: false;
      ViewMenu: false;
      Delete: false;
      StatusChange: false;
    };
    HomeToolCategoriesMenu: {
      CreateNew: false;
      Edit: false;
      ViewMenu: false;
      Delete: false;
      StatusChange: false;
    };
    HomeToolTagMenu: {
      CreateNew: false;
      Edit: false;
      ViewMenu: false;
      Delete: false;
      StatusChange: false;
    };
    WritingCommonOtherToolsManageMenu: {
      CreateNew: false;
      Edit: false;
      ViewMenu: false;
      Delete: false;
      StatusChange: false;
    };
    CareerCommonOtherToolsManageMenu: {
      CreateNew: false;
      Edit: false;
      ViewMenu: false;
      Delete: false;
      StatusChange: false;
    };
    TravelCommonOtherToolsManageMenu: {
      CreateNew: false;
      Edit: false;
      ViewMenu: false;
      Delete: false;
      StatusChange: false;
    };
    FoodCommonOtherToolsManageMenu: {
      CreateNew: false;
      Edit: false;
      ViewMenu: false;
      Delete: false;
      StatusChange: false;
    };
    HealthCommonOtherToolsManageMenu: {
      CreateNew: false;
      Edit: false;
      ViewMenu: false;
      Delete: false;
      StatusChange: false;
    };
    BusinessCommonOtherToolsManageMenu: {
      CreateNew: false;
      Edit: false;
      ViewMenu: false;
      Delete: false;
      StatusChange: false;
    };
    FinanceCommonOtherToolsManageMenu: {
      CreateNew: false;
      Edit: false;
      ViewMenu: false;
      Delete: false;
      StatusChange: false;
    };
    // ExtraCommonOtherToolsManageMenu: {
    //   CreateNew: false;
    //   Edit: false;
    //   ViewMenu: false;
    //   Delete: false;
    //   StatusChange: false;
    // };
    // SubscriptionPlans: {
    //   CreateNew: false,
    //   Edit: false,
    //   ViewMenu: false,
    //   Delete: false,
    //   StatusChange: false,
    // },
    SystemLogsMenu: {
      ViewAllData: false;
    };
    ContactMenu: {
      ViewOnly: false;
      DeleteData: false;
    };
    SeoMenu: {
      Edit: false;
    };
    FaviconSettingMenu: { Edit: false };
    DiscoverRecipesCollectionsMenu: {
      CreateNew: false;
      Edit: false;
      ViewMenu: false;
      Delete: false;
      StatusChange: false;
    };
    DiscoverRecipesToolsMenu: {
      ViewMenu: boolean;
      Edit: boolean;
    };
    DiscoverDestinationsCategoriesMenu: {
      CreateNew: false;
      Edit: false;
      ViewMenu: false;
      Delete: false;
    };
    DiscoverDestinationsCollectionsMenu: {
      CreateNew: false;
      Edit: false;
      ViewMenu: false;
      Delete: false;
      StatusChange: false;
    };
    DiscoverDestinationsToolsMenu: {
      ViewMenu: boolean;
      Edit: boolean;
    };
    FindCompaniesMenu: {
      Edit: boolean;
    };
    CoverLetterGeneratorMenu: {
      Edit: boolean;
    };
    ResumeGeneratorMenu: {
      Edit: boolean;
    };
    JobProtectionMenu: {
      Edit: boolean;
    };
    JobAutomationCheckerMenu: {
      Edit: boolean;
    };
    OnlineIncomeMenu: {
      Edit: boolean;
    };
    BusinessNameGenerator: {
      Edit: boolean;
    };
    BusinessIdeasGenerator: {
      Edit: boolean;
    };
    InterviewPreparationMenu: {
      Edit: boolean;
    };
    EmailMenu: {
      Edit: boolean;
    };
    ParaphraseMenu: {
      Edit: boolean;
    };
    MessageMenu: {
      Edit: boolean;
    };
    CheckGrammarMenu: {
      Edit: boolean;
    };
    BlogPostMenu: {
      Edit: boolean;
    };
    SocialMediaMenu: {
      Edit: boolean;
    };
    TranslateContentMenu: {
      Edit: boolean;
    };
    WellnessMenu: {
      Edit: boolean;
    };
    TherapyMenu: {
      Edit: boolean;
    };
    WeightLossMenu: {
      Edit: boolean;
    };
    NutritionPlannerMenu: {
      Edit: boolean;
    };
    CalorieCalculatorMenu: {
      Edit: boolean;
    };
    SymptomCheckerMenu: {
      Edit: boolean;
    };
    SolutionsMenu: {
      Edit: boolean;
    };
    DocumentsMenu: {
      Edit: boolean;
    };
    ResearchMenu: {
      Edit: boolean;
    };
    MarketingMenu: {
      Edit: boolean;
    };
    FundingMenu: {
      Edit: boolean;
    };
    FinancialAdvisorMenu: {
      Edit: boolean;
    };
    SaveMoneyMenu: {
      Edit: boolean;
    };
    BudgetCalculatorMenu: {
      Edit: boolean;
    };
    RetirementCalculatorMenu: {
      Edit: boolean;
    };
    DebtReliefMenu: {
      Edit: boolean;
    };
    InvestingMenu: {
      Edit: boolean;
    };
    VisionBoardGeneratorMenu: {
      Edit: false;
    };
    LifeGoalsGeneratorMenu: {
      Edit: false;
    };
    NewYearsResolutionGeneratorMenu: {
      Edit: false;
    };
    //   KeywordSearchMenu: {
    //  Edit: false;
    // },
    //  WebsiteSearchMenu: {
    //    Edit: false;
    // },
    promptCategoryMenu: {
      createNew: false;
      edit: false;
      viewMenu: false;
      delete: false;
      statusChange: false;
    };
    promptDataMenu: {
      createNew: false;
      edit: false;
      viewMenu: false;
      delete: false;
      statusChange: false;
    };
    codingPromptTopicMenu: {
      createNew: false;
      edit: false;
      viewMenu: false;
      delete: false;
      statusChange: false;
    };
    imageStyleMenu: {
      createNew: false;
      edit: false;
      viewMenu: false;
      delete: false;
      statusChange: false;
    };
    imagePromptMenu: {
      createNew: false;
      edit: false;
      viewMenu: false;
      delete: false;
      statusChange: false;
    };
    videoPromptMenu: {
      createNew: false;
      edit: false;
      viewMenu: false;
      delete: false;
      statusChange: false;
    };
    alternativeToolsMenu: {
      createNew: false;
      edit: false;
      viewMenu: false;
      delete: false;
      statusChange: false;
    };
  };

  created_by_user_id: String;
};

// suggested topic
export const SuggestedTopicSchema = z.object({
  title: z.string().min(1, "Topic title is required"),
  has_input: z.boolean().default(true),
  image: z.string().optional(),
  sticky: z.boolean().default(false),
});

export const GenericContentSchema = z.object({
  suggested_topics: z
    .array(SuggestedTopicSchema)
    .min(1, "At least one topic is required"),
  seo_keyphrase: z.string().optional(),
  description: z.string().optional(),
  short_description: z.string().optional(),
  mini_description: z
    .string()
    .max(200, "Mini description cannot exceed 200 characters")
    .optional(),
  seo_title: z.string().optional(),
  meta_description: z.string().optional(),
  cover_image: z.string().optional(),
  tab_normal_icon_image: z.string().optional(),
  tab_image: z.string().optional(),
  tab_active_icon_image: z.string().optional(),
  isActive: z.boolean().optional(),
  max_tokens: z.number().min(0, "Must be >= 0").optional(),
  system_prompt: z.string(),
  image: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  sticky: z.boolean().optional(),
  display_name: z.string().optional().default(""),
  allternativeTools: z.array(z.string()).optional().default([]),
  whatCanDO: z.array(z.string()).optional().default([]),
});

export type GenericContentFormValues = z.infer<typeof GenericContentSchema>;

export interface GenericContent {
  _id: string;
  suggested_topics: SuggestedTopic[];
  seo_keyphrase?: string;
  short_description: string;
  mini_description?: string;
  description?: string;
  seo_title?: string;
  meta_description?: string;
  cover_image?: string;
  tab_normal_icon_image?: string;
  tab_active_icon_image?: string;
  tab_image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  max_tokens: number;
  system_prompt: string;
  sticky?: boolean;
  display_name?: string;
  allternativeTools?: string[];
  whatCanDO?: string[];
}

export const newsCategorySchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z
    .string()
    .min(5, { message: "Description must be at least 5 characters." }),
  slug: z.string().optional(),
  icon: z
    .string()
    .url({ message: "Please enter a valid URL for the icon." })
    .optional()
    .or(z.literal("")),
  is_active: z.boolean().default(true),
  is_popular: z.boolean().default(false),
  parent: z.string().optional().or(z.literal("")),
});

export type NewsCategoryFormValues = z.infer<typeof newsCategorySchema>;

export interface NewsCategory {
  _id: string;
  name: string;
  description: string;
  slug: string;
  icon?: string;
  is_active: boolean;
  created_by: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  is_child?: string;
  parent?: string | NewsCategory | null;
  children?: NewsCategory[];
  newsCount?: number;
  level?: number;
  is_popular?: boolean;
}

export const recipeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type RecipeFormData = z.infer<typeof recipeSchema>;

export const discoverRecipeCollectionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  image: z.string().min(1, "Image is required"),
  discover_recipes: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
  max_tokens: z.number().min(0, "Must be >= 0").optional(),
  system_prompt: z.string(),
});

export type DiscoverRecipeCollectionFormValues = z.infer<
  typeof discoverRecipeCollectionSchema
>;

export interface DiscoverRecipeCollection {
  _id: string;
  title: string;
  description?: string;
  image: string;
  discover_recipes?: string[];
  createdAt: string;
  updatedAt: string;
  is_active: boolean;
  max_tokens: number;
  system_prompt: string;
}

export interface DiscoverRecipe {
  _id: string;
  title: string;
}

export type FieldType =
  | "textbox"
  | "textarea"
  | "dropdown"
  | "radio"
  | "checkbox"
  | "imageupload"
  | "fileupload"
  | "number"
  | "date";

export interface TabField {
  key: string;
  label: string;
  description?: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  default_value?: string;
  prompt?: string;
}
export interface Tab {
  _id: string;
  title: string;
  description?: string;
  short_description?: string;
  prompt_template: string;
  fields: TabField[];
  suggested_topics: SuggestedTopic[];
  seo_keyphrase?: string;
  seo_title?: string;
  meta_description?: string;
  cover_image?: string;
  tool_cover_image?: string;
  tab_normal_icon_image?: string;
  tab_active_icon_image?: string;
  tab_image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  max_tokens: number;
  system_prompt: string;
  improvement_system_prompt?: string;
  categories?: string[];
  tags?: string[];
  display_name?: string;
  allternativeTools?: string[];
  whatCanDO?: string[];
}

export const fieldSchema = z
  .object({
    key: z.string().optional(),
    label: z.string().min(1, "Label is required"),
    description: z.string().optional(),
    type: z.enum([
      "textbox",
      "textarea",
      "dropdown",
      "radio",
      "checkbox",
      "imageupload",
      "fileupload",
      "number",
      "date",
    ]),
    required: z.boolean().optional(),
    placeholder: z.string().optional(),
    default_value: z.any().optional(),
    options: z.array(z.string()).optional(),
    prompt: z.string(),
  })
  .superRefine((field, ctx) => {
    // ✅ Require placeholder for text-like fields
    if (["textbox", "textarea", "number"].includes(field.type)) {
      if (!field.placeholder || field.placeholder.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Placeholder is required for this field type",
          path: ["placeholder"],
        });
      }
    }

    // ✅ Require options for dropdown, radio, and checkbox fields
    if (["dropdown", "radio", "checkbox"].includes(field.type)) {
      if (
        !Array.isArray(field.options) ||
        field.options.length === 0 ||
        field.options.some((opt) => !opt.trim())
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Options are required and must not be empty for this field type",
          path: ["options"],
        });
      }
    }
  });

export const tabSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  short_description: z.string().optional(),
  prompt_template: z.any().optional(),
  fields: z.array(
    z
      .object({
        key: z.string().optional(),
        label: z.string().min(1),
        description: z.string().optional(),
        type: z.enum([
          "textbox",
          "textarea",
          "dropdown",
          "radio",
          "checkbox",
          "imageupload",
          "fileupload",
          "number",
          "date",
        ]),
        required: z.boolean().optional(),
        placeholder: z.string().optional(),
        options: z.array(z.string()).optional(),
        default_value: z.string().optional(),
        prompt: z.string().min(1),
      })
      .superRefine((field, ctx) => {
        // For text-like fields, placeholder is required
        if (["textbox", "textarea", "number"].includes(field.type)) {
          if (!field.placeholder || field.placeholder.trim() === "") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Placeholder is required for this field type",
              path: ["placeholder"],
            });
          }
        }

        // For dropdown/radio/checkbox fields, options are required
        if (["dropdown", "radio", "checkbox"].includes(field.type)) {
          if (
            !Array.isArray(field.options) ||
            field.options.length === 0 ||
            field.options.some((opt) => !opt.trim())
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                "Options are required and must not be empty for this field type",
              path: ["options"],
            });
          }
        }
      }),
  ),
  suggested_topics: z.array(SuggestedTopicSchema).optional().default([]),
  seo_keyphrase: z.string().optional(),
  seo_title: z.string().optional(),
  meta_description: z.string().optional(),
  cover_image: z.string().optional(),
  tool_cover_image: z.string().optional(),
  tab_normal_icon_image: z.string().optional(),
  tab_active_icon_image: z.string().optional(),
  tab_image: z.string().optional(),
  max_tokens: z.number().min(0, "Must be >= 0").optional(),
  system_prompt: z.string(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  display_name: z.string().optional().default(""),
  allternativeTools: z.array(z.string()).optional().default([]),
  whatCanDO: z.array(z.string()).optional().default([]),
  improvement_system_prompt: z.string().optional(),
});

export type TabFormValues = z.infer<typeof tabSchema>;

export const destinationSchema = z.object({
  title: z.string().min(1, "title is required"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type DestinationFormData = z.infer<typeof destinationSchema>;

export const discoverDestinationCollectionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  image: z.string().min(1, "Image is required"),
  discover_destinations: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
  max_tokens: z.number().min(0, "Must be >= 0").optional(),
  system_prompt: z.string(),
});

export type DiscoverDestinationCollectionFormValues = z.infer<
  typeof discoverDestinationCollectionSchema
>;

export interface DiscoverDestinationCollection {
  _id: string;
  title: string;
  description?: string;
  image: string;
  discover_destinations?: string[];
  createdAt: string;
  updatedAt: string;
  is_active: boolean;
  max_tokens: number;
  system_prompt: string;
}

export interface DiscoverDestination {
  _id: string;
  title: string;
}

export interface DestinationTool {
  _id: string;
  title: string;
  short_description: string;
  description?: string;
  prompt_template: string;
  fields: TabField[];
  suggested_topics: SuggestedTopic[];
  seo_keyphrase?: string;
  seo_title?: string;
  meta_description?: string;
  cover_image?: string;
  tool_cover_image?: string;
  tab_normal_icon_image?: string;
  tab_active_icon_image?: string;
  tab_image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  max_tokens: number;
  system_prompt: string;
  categories?: string[];
  tags?: string[];
  display_name?: string;
  allternativeTools?: string[];
  whatCanDO?: string[];
}

export const destinationToolSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  short_description: z.string().optional(),
  prompt_template: z.any().optional(),
  fields: z.array(
    z
      .object({
        key: z.string().optional(),
        label: z.string().min(1),
        description: z.string().optional(),
        type: z.enum([
          "textbox",
          "textarea",
          "dropdown",
          "radio",
          "checkbox",
          "imageupload",
          "fileupload",
          "number",
          "date",
        ]),
        required: z.boolean().optional(),
        placeholder: z.string().optional(),
        options: z.array(z.string()).optional(),
        default_value: z.string().optional(),
        prompt: z.string().min(1),
      })
      .superRefine((field, ctx) => {
        // For text-like fields, placeholder is required
        if (["textbox", "textarea", "number"].includes(field.type)) {
          if (!field.placeholder || field.placeholder.trim() === "") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Placeholder is required for this field type",
              path: ["placeholder"],
            });
          }
        }

        // For dropdown/radio/checkbox fields, options are required
        if (["dropdown", "radio", "checkbox"].includes(field.type)) {
          if (
            !Array.isArray(field.options) ||
            field.options.length === 0 ||
            field.options.some((opt) => !opt.trim())
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                "Options are required and must not be empty for this field type",
              path: ["options"],
            });
          }
        }
      }),
  ),
  suggested_topics: z.array(SuggestedTopicSchema).optional().default([]),
  seo_keyphrase: z.string().optional(),
  seo_title: z.string().optional(),
  meta_description: z.string().optional(),
  cover_image: z.string().optional(),
  tool_cover_image: z.string().optional(),
  tab_normal_icon_image: z.string().optional(),
  tab_active_icon_image: z.string().optional(),
  tab_image: z.string().optional(),
  max_tokens: z.number().min(0, "Must be >= 0").optional(),
  system_prompt: z.string(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  display_name: z.string().optional().default(""),
  allternativeTools: z.array(z.string()).optional().default([]),
  whatCanDO: z.array(z.string()).optional().default([]),
});

export type DestinationToolFormValues = z.infer<typeof destinationToolSchema>;

export interface ResumeGenerator {
  _id: string;
  title: string;
  short_description: string;
  mini_description?: string;
  long_description?: string;
  fields: Array<z.infer<typeof fieldSchema>>;
  prompt_template: string;
  seo_keyphrase: string;
  seo_title: string;
  meta_description: string;
  cover_image: string;
  tool_cover_image?: string;
  tab_normal_icon_image?: string;
  tab_active_icon_image?: string;
  tab_image?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  max_tokens: number;
  system_prompt: string;
  sticky?: boolean;
  display_name?: string;
  allternativeTools?: string[];
  whatCanDO?: string[];
}

export const ResumeGeneratorSchema = z.object({
  tabs: z.array(
    z.object({
      title: z.string().min(1, "Title is required"),
      description: z.string().optional(),
      fields: z.array(fieldSchema),
      prompt_template: z.string().optional(),
    }),
  ),
  seo_keyphrase: z.string().optional(),
  seo_title: z.string().optional(),
  meta_description: z.string().optional(),
  cover_image: z.string().optional(),
  tool_cover_image: z.string().optional(),
  tab_normal_icon_image: z.string().optional(),
  tab_active_icon_image: z.string().optional(),
  tab_image: z.string().optional(),
  isActive: z.boolean().optional(),
  max_tokens: z.number().min(0, "Must be >= 0").optional(),
  system_prompt: z.string(),
  long_description: z.string().optional(),
  short_description: z.string().optional(),
  mini_description: z
    .string()
    .max(200, "Mini description cannot exceed 200 characters")
    .optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  sticky: z.boolean().default(false).optional(),
  display_name: z.string().optional().default(""),
  allternativeTools: z.array(z.string()).optional().default([]),
  whatCanDO: z.array(z.string()).optional().default([]),
});

export type ResumeGeneratorFormValues = z.infer<typeof ResumeGeneratorSchema>;

export interface CommonTool {
  _id: string;
  prompt_template: string;
  display_name?: string;
  short_description?: string;
  mini_description?: string;
  description: string;
  fields: TabField[];
  isActive: boolean;
  seo_keyphrase?: string;
  seo_title?: string;
  meta_description?: string;
  cover_image?: string;
  tool_cover_image?: string;
  tab_normal_icon_image?: string;
  tab_active_icon_image?: string;
  tab_image?: string;
  createdAt: string;
  updatedAt: string;
  max_tokens: number;
  system_prompt: string;
  display_wordcount?: boolean;
  improvement_system_prompt?: string;
  custom_url?: string;
  allternativeTools?: string[];
  whatCanDO?: string[];
  sticky?: boolean;
}

export const CommonToolSchema = z.object({
  fields: z.array(fieldSchema).min(1, "At least one field is required"),
  prompt_template: z.string().min(1, "Prompt template is required"),
  display_name: z.string().optional().default(""),
  description: z.string().optional(),
  short_description: z.string().optional(),
  mini_description: z
    .string()
    .max(200, "Mini description cannot exceed 200 characters")
    .optional(),
  seo_keyphrase: z.string().optional(),
  seo_title: z.string().optional(),
  meta_description: z.string().optional(),
  cover_image: z.string().optional(),
  tool_cover_image: z.string().optional(),
  tab_normal_icon_image: z.string().optional(),
  tab_active_icon_image: z.string().optional(),
  tab_image: z.string().optional(),
  isActive: z.boolean().optional(),
  max_tokens: z.number().min(0, "Must be >= 0").optional(),
  system_prompt: z.string(),
  display_wordcount: z.boolean().default(true),
  sticky: z.boolean().default(false).optional(),
  improvement_system_prompt: z.string().nullable().default(""),
  allternativeTools: z.array(z.string()).optional().default([]),
  whatCanDO: z.array(z.string()).optional().default([]),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  // ✅ allow string, null, or empty string — with URL validation when not empty
  custom_url: z
    .union([
      z.literal(""), // empty string OK
      z.null(), // null OK
      z.string().url("Custom URL must be a valid URL."), // valid URL OK
    ])
    .optional()
    .default(""),
});

export type CommonToolFormValues = z.infer<typeof CommonToolSchema>;

export interface SuggestedTopic {
  title: string;
  has_input: boolean;
  image: string;
  sticky: boolean;
}

export interface Document {
  _id: string;
  documents: {
    title: string;
    icon?: string;
  }[];
  isActive: boolean;
  seo_keyphrase?: string;
  seo_title?: string;
  meta_description?: string;
  cover_image?: string;
  createdAt: string;
  updatedAt: string;
  max_tokens: number;
  system_prompt: string;
}

export const SuggestedTopicDocumentSchema = z.object({
  title: z.string().min(1, "Topic title is required"),
  icon: z.string().min(1, "Topic icon is required"),
});

export const DocumentSchema = z.object({
  documents: z
    .array(SuggestedTopicDocumentSchema)
    .min(1, "At least one suggested topic is required"),
  seo_keyphrase: z.string().optional(),
  seo_title: z.string().optional(),
  meta_description: z.string().optional(),
  cover_image: z.string().optional(),
  isActive: z.boolean().optional(),
  max_tokens: z.number().min(0, "Must be >= 0").optional(),
  system_prompt: z.string(),
});

export type DocumentFormValues = z.infer<typeof DocumentSchema>;

export interface FaviconSetting {
  key: "favicon";
  value: string;
}

export const FaviconSettingSchema = z.object({
  key: z.literal("favicon"),
  value: z.string().url("Please provide a valid URL"),
});

export interface MarketingCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  system_prompt: string;
  is_active: boolean;
  icon?: string | null;
  tab_normal_icon_image?: string;
  tab_active_icon_image?: string;
  category: "content" | "code" | "business" | "creative" | "analysis";
  parent?: string | MarketingCategory | null;
  usage_count: number;
  created_by: {
    _id: string;
    name: string;
  };
  children?: MarketingCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface MarketingTool {
  _id: string;
  name: string;
  display_name?: string;
  short_description?: string;
  description: string;
  icon?: string;
  category_id: {
    _id: string;
    name: string;
    category: string;
  } | null;
  tabs: ToolTab[];
  system_prompt_template: string;
  suggested_topics: SuggestedTopic[];
  usage_count: number;
  is_active: boolean;
  created_by: {
    _id: string;
    name: string;
  };
  seo_keyphrase?: string;
  seo_title?: string;
  meta_description?: string;
  cover_image?: string;
  createdAt: string;
  updatedAt: string;
  sticky: boolean;
  is_popular: boolean;
  user_plan: "free" | "basic" | "pro_max" | "guest";
  // ✅ new fields
  display_wordcount: boolean;
  improvement_system_prompt?: string;
  custom_url?: string;
  max_tokens: number;
  tooltips: string;
  categories?: string[];
  tags?: string[];
  allternativeTools?: string[];
  whatCanDO?: string[];
}

export const marketingToolSchema = z.object({
  name: z.string().min(2, "Tool name must be at least 2 characters."),
  display_name: z.string().optional().default(""),
  short_description: z.string().max(100, "Short category is too long"),
  mini_description: z
    .string()
    .max(200, "Mini description cannot exceed 200 characters")
    .optional(),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters.")
    .refine((val) => val.replace(/<[^>]*>?/gm, "").trim().length > 0, {
      message: "Description cannot be empty",
    }),
  // description: z.string().min(5, "Description must be at least 5 characters."),
  icon: z
    .string()
    .url({ message: "Icon must be a valid URL." })
    .optional()
    .or(z.literal("")),
  category_id: z.array(z.string()).min(1, "At least one category is required."),
  system_prompt_template: z
    .string()
    .min(10, "Overall system prompt template must be at least 10 characters."),
  tabs: z.array(toolTabSchema).optional().default([]),
  suggested_topics: z.array(suggestedTopicSchema).optional().default([]),
  is_active: z.boolean().default(true),
  seo_keyphrase: z.string().max(150).optional(),
  sticky: z.boolean().default(false),
  is_popular: z.boolean().default(false),
  user_plan: z.enum(["free", "basic", "pro_max", "guest"]).default("free"),
  seo_title: z.string().max(150).optional(),
  meta_description: z.string().max(300).optional(),
  cover_image: z.any().optional(),
  display_wordcount: z.boolean().default(true),
  improvement_system_prompt: z.string().optional(),
  custom_url: z
    .string()
    .url({ message: "Custom URL must be a valid URL." })
    .optional()
    .or(z.literal("")), // allow empty string
  max_tokens: z.number().min(0, "Must be >= 0").optional(),
  tooltips: z
    .string()
    .max(1000, "Tooltips cannot exceed 1000 characters")
    .optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  allternativeTools: z.array(z.string()).optional().default([]),
  whatCanDO: z.array(z.string()).optional().default([]),
});

export type MarketingToolFormValues = z.infer<typeof marketingToolSchema>;

export interface Dynamic {
  _id: string;
  suggested_topics: SuggestedTopic[];
  fields: TabField[];
  short_description: string;
  mini_description?: string;
  description?: string;
  isActive: boolean;
  seo_keyphrase?: string;
  seo_title?: string;
  meta_description?: string;
  cover_image?: string;
  tool_cover_image?: string;
  tab_normal_icon_image?: string;
  tab_active_icon_image?: string;
  tab_image?: string;
  createdAt: string;
  updatedAt: string;
  max_tokens: number;
  system_prompt: string;
  sticky?: boolean;
  display_name?: string;
  allternativeTools?: string[];
  whatCanDO?: string[];
}

export const DynamicSchema = z.object({
  fields: z.array(fieldSchema).optional().default([]),
  suggested_topics: z
    .array(SuggestedTopicSchema)
    .min(1, "At least one suggested topic is required"),
  description: z.string().optional(),
  short_description: z.string().optional(),
  mini_description: z
    .string()
    .max(200, "Mini description cannot exceed 200 characters")
    .optional(),
  prompt_template: z.string().min(1, "Prompt template is required"),
  seo_keyphrase: z.string().optional().default(""),
  seo_title: z.string().optional().default(""),
  meta_description: z.string().optional().default(""),
  cover_image: z.string().optional().default(""),
  tool_cover_image: z.string().optional(),
  tab_normal_icon_image: z.string().optional(),
  tab_active_icon_image: z.string().optional(),
  tab_image: z.string().optional(),
  system_prompt: z.string().optional().default(""),
  improvement_system_prompt: z.string().optional().nullable(),
  display_wordcount: z.boolean().default(true),
  custom_url: z.string().optional().nullable(),
  max_tokens: z.number().default(4000),
  isActive: z.boolean().default(true),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  sticky: z.boolean().default(false).optional(),
  display_name: z.string().optional().default(""),
  allternativeTools: z.array(z.string()).optional().default([]),
  whatCanDO: z.array(z.string()).optional().default([]),
});

export type DynamicFormValues = z.infer<typeof DynamicSchema>;

export interface HomeToolCategory {
  _id: string;
  name: string;
  description?: string;
  icon?: string; // URL to the category icon
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const homeToolCategorySchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z
    .string()
    .min(5, { message: "Description must be at least 5 characters." }),
  parent: z.string().optional().or(z.literal("")),
  icon: z
    .string()
    .url({ message: "Icon must be a valid URL." })
    .optional()
    .or(z.literal("")),
  tab_normal_icon_image: z
    .string()
    .url({ message: "Tab normal icon must be a valid URL." })
    .optional()
    .or(z.literal("")),
  tab_active_icon_image: z
    .string()
    .url({ message: "Tab active icon must be a valid URL." })
    .optional()
    .or(z.literal("")),
  is_active: z.boolean().default(true),
});

export type HomeToolCategoryFormValues = z.infer<typeof homeToolCategorySchema>;

// -------------------- Zod Schema --------------------
export const homeToolTagSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type HomeToolTagFormValues = z.infer<typeof homeToolTagSchema>;

export interface HomeToolTag {
  _id: string;
  name: string;
  slug?: string;
  description: string;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Add to your existing imports
// ...

// --- Page Builder Schemas ---
// --- Page Builder Schemas ---
// --- Page Builder Schemas ---
export const featureSchema = z.object({
  name: z.string().min(1, "Feature name is required"),
  value: z.number().min(0, "Value must be non-negative"),
  is_active: z.boolean().default(true),
  show_value: z.boolean().default(true),
});

export const cardSchema = z.object({
  category: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  image: z.string().url("Valid image URL is required"),
  icon_image: z.string().optional(),
  badge_text: z.string().optional(),
  checklist: z.array(z.string()).optional(),
  button_text: z.string().optional(),
  custom_url: z
    .string()
    .url("Valid URL is required")
    .optional()
    .or(z.literal("")),
});

// NEW: Hero (Updated)
export const heroSectionSchema = z.object({
  category: z.string().min(1),
  title: z.string().min(1),
  sub_title: z.string().min(1),
  button_text: z.string().optional(),
  // ✅ CHANGED: Removed colors, added hero_image
  hero_image: z.string().optional().default(""),
});

// NEW: Grid
export const gridFeatureSchema = z.object({
  category: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  image: z.string().url(),
});

export const pageBuilderSchema = z.object({
  tabs: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  hero_sections: z.array(heroSectionSchema).optional().default([]),
  grid_features: z.array(gridFeatureSchema).optional().default([]),
  features: z.array(featureSchema).optional().default([]),
  cards: z.array(cardSchema).optional().default([]),
  short_description: z.string().max(200).optional().default(""),
  description: z.string().max(50000).optional().default(""),
  seo_keyphrase: z.string().optional().default(""),
  seo_title: z.string().optional().default(""),
  meta_description: z.string().optional().default(""),
  cover_image: z.string().optional().default(""),
  tool_cover_image: z.string().optional().default(""),
  tab_normal_icon_image: z.string().optional().default(""),
  tab_active_icon_image: z.string().optional().default(""),
  tab_image: z.string().optional().default(""),
});

export type PageBuilderFormValues = z.infer<typeof pageBuilderSchema>;

export interface Feature {
  name: string;
  value: number;
  is_active: boolean;
  show_value: boolean;
}

export interface Card {
  category: string;
  title: string;
  description: string;
  image: string;
  icon_image?: string;
  badge_text?: string;
  checklist?: string[];
  button_text?: string;
  custom_url: string | "";
}

export interface PageBuilder {
  _id: string;
  tabs: Array<{ label: string; value: string }>;
  hero_sections: Array<{
    category: string;
    title: string;
    sub_title: string;
    button_text: string;
    // ✅ CHANGED: Removed colors, added hero_image
    hero_image: string;
  }>;
  grid_features: Array<{
    category: string;
    title: string;
    description: string;
    image: string;
  }>;
  features: Feature[];
  cards: Card[];
  short_description: string;
  description: string;
  seo_keyphrase: string;
  seo_title: string;
  meta_description: string;
  cover_image: string;
  tool_cover_image: string;
  tab_normal_icon_image: string;
  tab_active_icon_image: string;
  tab_image: string;
  createdAt: string;
  updatedAt: string;
}

export const promptCategorySchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z.string().optional(),
  icon: z
    .string()
    .url({ message: "Icon must be a valid URL." })
    .optional()
    .or(z.literal("")),
  is_active: z.boolean().default(true),
});

export type PromptCategoryFormValues = z.infer<typeof promptCategorySchema>;

export interface PromptCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ... existing imports

// --- Prompt Data Schemas ---
// --- Prompt Data Schemas ---
export const promptDataSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  slug: z.string().optional(),
  // Array of strings (Category IDs) - Make optional with default empty array
  category: z
    .array(z.string())
    .default([]) // Make it optional with default empty array
    .optional(),
  image: z
    .string()
    .url({ message: "Image must be a valid URL." })
    .optional() // Make image optional
    .or(z.literal("")) // Allow empty string
    .default(""), // Default to empty string
  short_description: z
    .string()
    .min(10, { message: "Short description is required." })
    .max(500),
  description: z.string().min(10, { message: "Long description is required." }),
  is_active: z.boolean().default(true),
});

export type PromptDataFormValues = z.infer<typeof promptDataSchema>;

export interface PromptData {
  _id: string;
  name: string;
  slug: string;
  category: { _id: string; name: string }[]; // Populated array
  image: string; // Can be empty string
  short_description: string;
  description: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- Coding Prompt Topic Schemas ---

export const codingSubtopicSchema = z.object({
  title: z.string().min(1, "Subtopic title is required"),
  description: z.string().optional(),
  icon: z.string().url("Icon must be a valid URL").optional().or(z.literal("")),
  prompt_template: z.string().optional(), // This will use Tiptap
});

export const codingPromptTopicSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  icon: z.string().url("Icon must be a valid URL").optional().or(z.literal("")),
  is_active: z.boolean().default(true),
  // Array of subtopics
  subtopics: z.array(codingSubtopicSchema).optional().default([]),
});

export type CodingPromptTopicFormValues = z.infer<
  typeof codingPromptTopicSchema
>;

export interface CodingPromptTopic {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  subtopics: {
    _id?: string;
    title: string;
    description?: string;
    icon?: string;
    prompt_template?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// --- Image Style Schemas ---
export const imageStyleSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  image: z.string().url("Must be a valid URL").min(1, "Image is required"),
  type: z.enum(["image", "video"]).default("image"),
  is_active: z.boolean().default(true),
});

export type ImageStyleFormValues = z.infer<typeof imageStyleSchema>;

export interface ImageStyle {
  _id: string;
  name: string;
  image: string;
  type: "image" | "video";
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- AI Filter Schemas ---
export const aiFilterSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  image: z.string().url("Must be a valid URL").min(1, "Image is required"),
  original_image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type AIFilterFormValues = z.infer<typeof aiFilterSchema>;

export interface AIFilter {
  _id: string;
  name: string;
  image: string;
  original_image?: string;
  description?: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- Image Prompt Schemas ---
export const imagePromptSchema = z.object({
  image: z.string().url("Must be a valid URL").min(1, "Image is required"),
  style: z.string().min(1, "Style is required"), // This will be the _id of the style
  image_prompt: z.string().min(1, "Prompt is required"),
  is_active: z.boolean().default(true),
});

export type ImagePromptFormValues = z.infer<typeof imagePromptSchema>;

export interface ImagePrompt {
  _id: string;
  image: string;
  style: { _id: string; name: string } | string; // Handle both populated and unpopulated
  image_prompt: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- Video Prompt Schemas ---
export const videoPromptSchema = z.object({
  image: z
    .string()
    .url("Must be a valid URL")
    .min(1, "Thumbnail image URL is required"),
  video: z.string().url("Must be a valid URL").min(1, "Video URL is required"),
  style: z.string().min(1, "Style is required"), // This will be the _id of the style
  video_prompt: z.string().min(1, "Prompt is required"),
  short_video_prompt: z.string().min(1, "Short Prompt is required"),
  is_active: z.boolean().default(true),
});

export type VideoPromptFormValues = z.infer<typeof videoPromptSchema>;

export interface VideoPrompt {
  _id: string;
  image: string;
  video: string;
  style: { _id: string; name: string } | string; // Handle both populated and unpopulated
  video_prompt: string;
  short_video_prompt: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- Alternative Tool Schemas ---
export const alternativeToolSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().optional().default(""),
  image: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal(""))
    .default(""),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  is_active: z.boolean().default(true),
});

export type AlternativeToolFormValues = z.infer<typeof alternativeToolSchema>;

export interface AlternativeTool {
  _id: string;
  name: string;
  description: string;
  image?: string;
  price: number;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}
