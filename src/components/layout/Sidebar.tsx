"use client";

import Link from "next/link";
import {
  Home,
  Users,
  Settings,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  FolderKanban,
  Cpu,
  FileText,
  UserCircle,
  Briefcase,
  FileCog,
  Contact,
  SearchCheck,
  PlusCircle,
  List,
  Newspaper,
  Wrench,
  Scale,
  Archive,
  Globe,
  LayoutDashboard,
  NotebookText,
  BarChart3,
  Utensils,
  ServerCog,
  Receipt,
  UserCog,
  MapPinned,
  Building2,
  DollarSign,
  FileSpreadsheet,
  PenSquare,
  Mail,
  RefreshCw,
  Share2,
  SpellCheck,
  MessageSquare,
  HeartPulse,
  Activity,
  Stethoscope,
  Apple,
  ActivitySquare,
  BookOpen,
  Megaphone,
  Puzzle,
  PiggyBank,
  Wallet,
  User,
  Calculator,
  Calendar,
  Shield,
  TrendingUp,
  ImageIcon,
  Flame,
  Lightbulb,
  Type,
  Images,
  Target,
  Sparkles,
  BrainCircuit,
  Tag,
  PenTool,
  Hash,
  Search,
  Palette,
  Database,
  Code,
  Video,
  Magnet,
  FolderTree,
} from "lucide-react";
import NavItems, { type NavItem } from "./NavItems";
// import { cn } from '@/lib/utils'; // Not used

export const navItemsList: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    permission: undefined,
  }, //'view_analytics'
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: UserCircle,
    permission: undefined,
  }, // Accessible to all authenticated users
  {
    label: "Pages",
    icon: FileText,
    permission: ["viewPagesMenu", "createPagesMenu"],
    children: [
      {
        href: "/dashboard/pages",
        label: "All Pages",
        icon: NotebookText,
        permission: "viewPagesMenu",
      },
      {
        href: "/dashboard/pages/create",
        label: "Add Page",
        icon: PlusCircle,
        permission: "createPagesMenu",
      },
    ],
  },
  {
    label: "Management",
    isTitle: true,
    // Permissions for the title to show: if user has any of these, the title is relevant
    permission: [
      "viewUserMenu",
      "viewToolCategoryMenu",
      "viewToolsManagementMenu",
      "manage_ai_providers",
      "manage_plans",
      "manage_roles",
      "viewNewsCategoryMenu",
      "viewRecipesCategoriesMenu",
      "viewRecipesCollectionsMenu",
      "viewRecipesToolsMenu",
      "viewDestinationsCategoriesMenu",
      "viewDestinationsCollectionsMenu",
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
      "createorupdateCalorieCalculator",
      "createorupdateTranslateContent",
      "createorupdateVisionBoardGenerator",
      "createorupdateLifeGoalsGenerator",
      "createorupdateNewYearsResolutionGenerator",
      "viewWritingCommonOtherToolsMenu",
      "viewCareerCommonOtherToolsMenu",
      "viewTravelCommonOtherToolsMenu",
      "viewFoodCommonOtherToolsMenu",
      "viewHealthCommonOtherToolsMenu",
      "viewBusinessCommonOtherToolsMenu",
      "viewFinanceCommonOtherToolsMenu",
      // "viewExtraCommonOtherToolsMenu",
      "viewHomeToolCategoriesMenu",
      "viewPromptCategoryMenu",
      "viewPromptDataMenu",
      "viewCodingPromptTopicMenu",
      "viewImageStyleMenu",
      "viewImagePromptMenu",
      "viewVideoPromptMenu",
      "viewAiFilterMenu",
      "viewAlternativeToolsMenu",
      "viewLeadMagnetsMenu",
      "viewLeadMagnetCategoriesMenu"
    ],
  },
  {
    label: "All Tools",
    icon: Wrench,
    permission: ["viewToolsManagementMenu", "viewToolCategoryMenu"],
    children: [
      {
        href: "/dashboard/tools",
        label: "Tools",
        icon: Settings,
        permission: "viewToolsManagementMenu",
      },
      {
        href: "/dashboard/tool-categories",
        label: "Tool Categories",
        icon: FolderKanban,
        permission: "viewToolCategoryMenu",
      },
    ],
  },

  {
    label: "All News",
    icon: Newspaper,
    permission: ["viewNewsMenu", "viewNewsCategoryMenu"],
    children: [
      // {
      //   href: "/dashboard/trending-news",
      //   label: "Trending News",
      //   icon: BarChart3,
      //   permission: "viewNewsMenu",
      // },
      {
        href: "/dashboard/news-categories",
        label: "News Categories",
        icon: FolderKanban,
        permission: "viewNewsCategoryMenu",
      },
    ],
  },
  {
    label: "Food",
    icon: Utensils,
    permission: [
      "viewRecipesCategoriesMenu",
      "viewRecipesCollectionsMenu",
      "viewRecipesToolsMenu",
      "viewFoodCommonOtherToolsMenu",
    ],
    children: [
      {
        href: "/dashboard/food-tools", // Adjust path as needed
        label: "Food Tools",
        icon: Wrench,
        permission: "viewFoodCommonOtherToolsMenu",
      },
      {
        href: "/dashboard/discover-recipes",
        label: "Recipe Categories",
        icon: List,
        permission: "viewRecipesCategoriesMenu",
      },
      {
        href: "/dashboard/discover-recipe-collections",
        label: "Recipe List",
        icon: Archive,
        permission: "viewRecipesCollectionsMenu",
      },
      {
        href: "/dashboard/tabs",
        label: "Recipe Tools",
        icon: Settings,
        permission: "viewRecipesToolsMenu",
      },
    ],
  },
  {
    label: "Destinations",
    icon: Globe,
    permission: [
      "viewDestinationsCategoriesMenu",
      "viewDestinationsCollectionsMenu",
      "viewDestinationsToolsMenu",
      "viewTravelCommonOtherToolsMenu",
    ],
    children: [
      {
        href: "/dashboard/travel-tools", // Adjust path as needed
        label: "Destination Tools",
        icon: Wrench,
        permission: "viewTravelCommonOtherToolsMenu",
      },
      {
        href: "/dashboard/discover-destinations",
        label: "Destination Categories",
        icon: MapPinned,
        permission: "viewDestinationsCategoriesMenu",
      },
      {
        href: "/dashboard/discover-destination-collections",
        label: "Destination List",
        icon: Archive,
        permission: "viewDestinationsCollectionsMenu",
      },
      {
        href: "/dashboard/destination-tools",
        label: "Destination Tools",
        icon: ServerCog,
        permission: "viewDestinationsToolsMenu",
      },
    ],
  },
  {
    label: "Career",
    icon: Briefcase,
    permission: [
      "createorupdateFindCompany",
      "createorupdateCoverLetterGenerator",
      "createorupdateOnlineIncome",
      "createOrupdateInterviewPrep",
      "createorupdateResumeGenerator",
      "createorupdateJobProtection",
      "createorupdateJobAutomationChecker",
      "viewCareerCommonOtherToolsMenu",
    ],
    children: [
      {
        href: "/dashboard/career-tools",
        label: "Career Tools",
        icon: Wrench,
        permission: ["viewCareerCommonOtherToolsMenu"],
      },
      {
        href: "/dashboard/find-companies",
        label: "Find Companies",
        icon: Building2,
        permission: "createorupdateFindCompany",
      },
      {
        href: "/dashboard/cover-letter-generator",
        label: "Cover Letter Generator",
        icon: FileText,
        permission: "createorupdateCoverLetterGenerator",
      },
      {
        href: "/dashboard/resume-generators",
        label: "Resume Generator",
        icon: FileSpreadsheet,
        permission: "createorupdateResumeGenerator",
      },
      // {
      //   href: "/dashboard/online-income",
      //   label: "Online Income",
      //   icon: DollarSign,
      //   permission: "createorupdateOnlineIncome",
      // },
      {
        href: "/dashboard/interview-preparation",
        label: "Interview Preparation",
        icon: FileText,
        permission: "createOrupdateInterviewPrep",
      },
      {
        href: "/dashboard/job-protection",
        label: "AI Job Protection Plan",
        icon: ShieldCheck,
        permission: "createorupdateJobProtection",
      },
      {
        href: "/dashboard/job-automation-checker",
        label: "AI Job Automation Checker",
        icon: BrainCircuit,
        permission: "createorupdateJobAutomationChecker",
      },
    ],
  },
  {
    label: "Marketing Tools",
    icon: Megaphone,
    permission: ["viewMarketingToolsMenu", "viewMarketingCategoryMenu"],
    children: [
      {
        href: "/dashboard/marketing-tools",
        label: "Marketing Tools",
        icon: Settings,
        permission: "viewMarketingToolsMenu",
      },
      {
        href: "/dashboard/marketing-categories",
        label: "Marketing Categories",
        icon: FolderKanban,
        permission: "viewMarketingCategoryMenu",
      },
    ],
  },
  {
    label: "Lead Magnets",
    icon: Magnet,
    permission: ["viewLeadMagnetsMenu", "viewLeadMagnetCategoriesMenu"],
    children: [
      {
        href: "/dashboard/lead-magnets",
        label: "Lead Magnets",
        icon: Settings,
        permission: "viewLeadMagnetsMenu",
      },
      {
        href: "/dashboard/lead-magnet-categories",
        label: "Lead Magnet Categories",
        icon: FolderKanban,
        permission: "viewLeadMagnetCategoriesMenu",
      },
      {
        href: "/dashboard/alternative-lead-magnets",
        label: "Alternative Lead Magnets",
        icon: Settings,
        permission: "viewLeadMagnetsMenu",
      },
      {
        href: "/dashboard/alternative-lead-magnet-categories",
        label: "Alternative Categories",
        icon: FolderKanban,
        permission: "viewLeadMagnetCategoriesMenu",
      },
    ],
  },
  {
    label: "Home Tools",
    icon: FolderKanban,
    permission: ["viewHomeToolCategoriesMenu", "viewHomeToolTagsMenu"],
    children: [
      {
        href: "/dashboard/home-tool-categories",
        label: "Home Tool Categories",
        icon: FolderKanban,
        permission: "viewHomeToolCategoriesMenu",
      },
      {
        href: "/dashboard/home-tool-tags",
        label: "Home Tool Tags",
        icon: Tag,
        permission: "viewHomeToolTagsMenu",
      },
    ],
  },
  {
    label: "Alternative Tools",
    icon: List,
    permission: "viewAlternativeToolsMenu",
    children: [
      {
        href: "/dashboard/alternative-tools",
        label: "Alternative Tools",
        icon: List,
        permission: "viewAlternativeToolsMenu",
      },
    ],
  },
  {
    label: "Prompt Menu",
    icon: FolderKanban,
    permission: ["viewPromptCategoryMenu", "viewPromptDataMenu"], // Show if user has access to either
    children: [
      {
        href: "/dashboard/prompt-categories",
        label: "Prompt Categories",
        icon: List,
        permission: "viewPromptCategoryMenu",
      },
      {
        href: "/dashboard/prompt-data",
        label: "Prompt Data",
        icon: Database, // Make sure to import Database from lucide-react
        permission: "viewPromptDataMenu",
      },
    ],
  },
  {
    label: "Coding Prompts",
    icon: Code,
    permission: ["viewCodingPromptTopicMenu"], // Or use an existing permission
    children: [
      {
        href: "/dashboard/coding-prompt-topics",
        label: "Coding Topics",
        icon: List,
        permission: "viewCodingPromptTopicMenu",
      },
    ],
  },

  {
    label: "Image & Video Menu",
    icon: Images,
    permission: ["viewImageStyleMenu", "viewImagePromptMenu", "viewVideoPromptMenu", "viewAiFilterMenu"],
    children: [
      {
        href: "/dashboard/image-styles",
        label: "Image & Video Styles",
        icon: Palette,
        permission: "viewImageStyleMenu",
      },
      {
        href: "/dashboard/ai-filters",
        label: "AI Filters",
        icon: Palette,
        permission: "viewAiFilterMenu",
      },
      {
        href: "/dashboard/image-prompts",
        label: "Image Prompts",
        icon: ImageIcon,
        permission: "viewImagePromptMenu",
      },
      {
        href: "/dashboard/video-prompts",
        label: "Video Prompts",
        icon: Video,
        permission: "viewVideoPromptMenu",
      },
      {
  href: "/dashboard/video-taxonomy",
  label: "Video Taxonomy",
  icon: FolderTree, // or Video
  permission: "viewVideoTaxonomyMenu",
}
    ],
  },
  {
    label: "Writing",
    icon: PenSquare,
    permission: [
      "createorupdateEmail",
      "createorupdateParaphrase",
      "createorupdateMessage",
      "createorupdateGrammar",
      "createorupdateBlogPost",
      "createorupdateSocialMedia",
      "createorupdateTranslateContent",
      "viewWritingCommonOtherToolsMenu",
    ],
    children: [
      {
        href: "/dashboard/writing-tools",
        label: "Writing Tools",
        icon: Wrench,
        permission: "viewWritingCommonOtherToolsMenu",
      },

      {
        href: "/dashboard/email",
        label: "Email",
        icon: Mail,
        permission: "createorupdateEmail",
      },
      {
        href: "/dashboard/paraphrase",
        label: "Paraphrase",
        icon: RefreshCw,
        permission: "createorupdateParaphrase",
      },
      // {
      //   href: "/dashboard/message",
      //   label: "Message",
      //   icon: MessageSquare,
      //   permission: "createorupdateMessage",
      // },
      {
        href: "/dashboard/grammar",
        label: "Check Grammar",
        icon: SpellCheck,
        permission: "createorupdateGrammar",
      },
      {
        href: "/dashboard/blog-post",
        label: "AI Writer",
        icon: FileText,
        permission: "createorupdateBlogPost",
      },
      {
        href: "/dashboard/social-media",
        label: "Social Media",
        icon: Share2,
        permission: "createorupdateSocialMedia",
      },
      {
        href: "/dashboard/content-translator",
        label: "Content Translater",
        icon: Globe,
        permission: "createorupdateTranslateContent",
      },
    ],
  },
  {
    label: "Health",
    icon: HeartPulse,
    permission: [
      "createorupdateWellness",
      "createorupdateTherapy",
      "createorupdateWeightLoss",
      "createorupdateNutritionPlanner",
      "createorupdateSymptomChecker",
      "createorupdateCalorieCalculator",
      "viewHealthCommonOtherToolsMenu",
    ],
    children: [
      {
        href: "/dashboard/health-tools",
        label: "Health Tools",
        icon: Wrench,
        permission: ["viewHealthCommonOtherToolsMenu"],
      },

      {
        href: "/dashboard/wellness",
        label: "Health & Wellness",
        icon: Activity,
        permission: "createorupdateWellness",
      },
      {
        href: "/dashboard/therapy",
        label: "Therapy",
        icon: Stethoscope,
        permission: "createorupdateTherapy",
      },
      {
        href: "/dashboard/weight-loss",
        label: "Weight Loss",
        icon: Scale,
        permission: "createorupdateWeightLoss",
      },
      {
        href: "/dashboard/nutrition-planner",
        label: "Nutrition Planner",
        icon: Apple,
        permission: "createorupdateNutritionPlanner",
      },
      {
        href: "/dashboard/symptom-checker",
        label: "Symptom Checker",
        icon: ActivitySquare,
        permission: "createorupdateSymptomChecker",
      },
      {
        href: "/dashboard/calorie-calculator",
        label: "Calorie Calculator",
        icon: Flame,
        permission: "createorupdateCalorieCalculator",
      },
    ],
  },
  {
    label: "Business",
    icon: Briefcase,
    permission: [
      "createorupdateSolutions",
      "createorupdateDocuments",
      "createorupdateResearch",
      "createorupdateMarketing",
      "createorupdateFunding",
      "createorupdateBusinessName",
      "createorupdateBusinessIdea",
      "viewBusinessCommonOtherToolsMenu",
    ],
    children: [
      {
        href: "/dashboard/business-tools",
        label: "Business Tools",
        icon: Wrench,
        permission: ["viewBusinessCommonOtherToolsMenu"],
      },
      {
        href: "/dashboard/brainstorm",
        label: "Brainstorm",
        icon: Puzzle,
        permission: "createorupdateSolutions",
      },
      // {
      //   href: "/dashboard/documents",
      //   label: "Documents",
      //   icon: FileText,
      //   permission: "createorupdateDocuments",
      // },
      {
        href: "/dashboard/market-research",
        label: "Market Research",
        icon: BookOpen,
        permission: "createorupdateResearch",
      },
      {
        href: "/dashboard/business-development",
        label: "Business Development",
        icon: Megaphone,
        permission: "createorupdateMarketing",
      },
      // {
      //   href: "/dashboard/funding",
      //   label: "Funding",
      //   icon: DollarSign,
      //   permission: "createorupdateFunding",
      // },
      {
        href: "/dashboard/business-name-generator",
        label: "Business Name Generator",
        icon: Type, // choose an appropriate icon
        permission: "createorupdateBusinessName",
      },
      {
        href: "/dashboard/small-business-idea-generator",
        label: "Business Idea Generator",
        icon: Lightbulb, // choose an appropriate icon
        permission: "createorupdateBusinessIdea",
      },
    ],
  },
  {
    label: "Finance",
    icon: Wallet,
    permission: [
      "createorupdateFinancialAdvisor",
      "createorupdateSaveMoney",
      "createorupdateBudgetCalculator",
      "createorupdateRetirementCalculator",
      "createorupdateDebtRelief",
      "createorupdateInvesting",
      "viewFinanceCommonOtherToolsMenu",
    ],
    children: [
      {
        href: "/dashboard/finance-tools",
        label: "Financial Tools",
        icon: Wrench,
        permission: ["viewFinanceCommonOtherToolsMenu"],
      },
      {
        href: "/dashboard/financial-advisor",
        label: "Financial Advisor",
        icon: User,
        permission: "createorupdateFinancialAdvisor",
      },
      {
        href: "/dashboard/save-money",
        label: "Save Money",
        icon: PiggyBank,
        permission: "createorupdateSaveMoney",
      },
      {
        href: "/dashboard/budget-calculator",
        label: "Budget Calculator",
        icon: Calculator,
        permission: "createorupdateBudgetCalculator",
      },
      {
        href: "/dashboard/retirement-calculator",
        label: "Retirement Calculator",
        icon: Calendar,
        permission: "createorupdateRetirementCalculator",
      },
      {
        href: "/dashboard/debt-relief",
        label: "Debt Relief",
        icon: Shield,
        permission: "createorupdateDebtRelief",
      },
      {
        href: "/dashboard/investing",
        label: "Stock Market",
        icon: TrendingUp,
        permission: "createorupdateInvesting",
      },
    ],
  },
  {
    label: "Extra Tools",
    icon: Puzzle,
    permission: [
      "createorupdateVisionBoardGenerator",
      "createorupdateLifeGoalsGenerator",
      "createorupdateNewYearsResolutionGenerator",
      // "viewExtraCommonOtherToolsMenu",
    ],
    children: [
      // {
      //   href: "/dashboard/extra-tools",
      //   label: "Extra Tools",
      //   icon: Puzzle,
      //   permission: ["viewExtraCommonOtherToolsMenu"],
      // },

      {
        href: "/dashboard/vision-board-generator",
        label: "Vision Board Generator",
        icon: Images,
        permission: "createorupdateVisionBoardGenerator",
      },
      {
        href: "/dashboard/life-goals-generator",
        label: "Life Goals Generator",
        icon: Target,
        permission: "createorupdateLifeGoalsGenerator",
      },
      {
        href: "/dashboard/new-years-resolution-generator",
        label: "New Year’s Resolution Generator",
        icon: Sparkles,
        permission: "createorupdateNewYearsResolutionGenerator",
      },
    ],
  },
  //   {
  //   label: "Keyword",
  //   icon: Hash,
  //   permission: [
  //       "createorupdateKeywordSearch",
  //       "createorupdateWebsiteSearch"
  //     ],
  //   children: [
  //     {
  //       href: "/dashboard/keyword-search",
  //       label: "Keyword Search",
  //       icon: Search,
  //       permission: "createorupdateKeywordSearch",
  //     },
  //     {
  //       href: "/dashboard/website-search",
  //       label: "Website Search",
  //       icon: Globe,
  //       permission: "createorupdateWebsiteSearch",
  //     }
  //   ]
  // },
  {
    label: "AI Providers",
    icon: Cpu,
    permission: "manage_ai_providers",
    children: [
      {
        href: "/dashboard/ai-providers",
        label: "AI Providers",
        icon: Cpu,
        permission: "manage_ai_providers",
      },
      {
        href: "/dashboard/ai-comparison",
        label: "AI Comparison",
        icon: Scale,
        permission: "manage_ai_providers",
      },
    ],
  },
  {
    label: "Email Page Builder",
    icon: Palette,
    permission: "editPageBuilderMenu",
    children: [
      {
        href: "/dashboard/page-builder",
        label: "Email Page Builder Config",
        icon: FileCog,
        permission: "editPageBuilderMenu",
      },
    ],
  },
  {
    href: "/dashboard/users",
    label: "Users",
    icon: Users,
    permission: "viewUserMenu",
  },
  {
    href: "/dashboard/safety-violations",
    label: "Content Safety",
    icon: ShieldAlert,
    permission: "viewUserMenu",
  },
  // { href: '/dashboard/tool-categories', label: 'Tool Categories', icon: FolderKanban, permission: 'viewToolCategoryMenu' },
  // { href: '/dashboard/tools', label: 'Tools', icon: Settings, permission: 'viewToolsManagementMenu' },
  // {
  //   href: "/dashboard/trending-news",
  //   label: "Trending News",
  //   icon: Newspaper,
  //   permission: "manage_news",
  // },

  {
    href: "/dashboard/plans",
    label: "Plans",
    icon: Briefcase,
    permission: "manage_plans",
  },
  {
    label: "Operations",
    isTitle: true,
    permission: ["view_payments", "process_refunds", "view_analytics"],
  },
  {
    label: "Payments",
    icon: CreditCard,
    permission: ["view_payments", "process_refunds"],
    children: [
      {
        href: "/dashboard/payments",
        label: "Payment Overview",
        icon: Receipt,
        permission: "view_payments",
      },
      {
        href: "/dashboard/user-payments",
        label: "User Payments",
        icon: UserCog,
        permission: "view_payments",
      },
    ],
  },

  // {
  //   href: "/dashboard/payments",
  //   label: "Payments",
  //   icon: CreditCard,
  //   permission: ["view_payments", "process_refunds"],
  // },
  {
    href: "/dashboard/system-logs",
    label: "System Logs",
    icon: FileCog,
  },
  {
    label: "Administration",
    isTitle: true,
    permission: "manage_roles",
  },
  {
    href: "/dashboard/admin-users",
    label: "Admin Users",
    icon: ShieldCheck,
    permission: "manage_roles",
  },
  {
    label: "Contact",
    isTitle: true,
    permission: "viewOnlyContactMenu",
    // permission: 'manage_roles'
  },
  {
    href: "/dashboard/contact-users",
    label: "Contact Users",
    icon: Contact,
    permission: "viewOnlyContactMenu",
  },
  {
    label: "Yoast SEO",
    isTitle: true,
    permission: "editSeoMenu",
  },
  {
    href: "/dashboard/yoast-seo",
    label: "SEO Settings",
    icon: SearchCheck,
    permission: "editSeoMenu",
  },
  {
    href: "/dashboard/favicon",
    label: "Favicon",
    icon: ImageIcon,
    permission: "manageFavicon",
  },
];

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-sidebar text-sidebar-foreground sm:flex print:hidden">
      <div className="flex h-16 items-center border-b px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold font-headline text-lg text-sidebar-primary"
        >
          <FileCog className="h-7 w-7" />
          <span>OneChat AI</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        <NavItems items={navItemsList} />
      </nav>
      <div className="mt-auto p-4 border-t">
        <p className="text-xs text-sidebar-foreground/70">
          © {new Date().getFullYear()} OneChat AI Panel
        </p>
      </div>
    </aside>
  );
}
