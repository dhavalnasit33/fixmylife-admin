import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import apiService from "./apiService";
import { toast } from "@/hooks/use-toast";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Reusable internal upload function for images
export const uploadFileToServer = async (file: File, folder: string) => {
  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/svg+xml",
  ];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only PNG, JPG, and SVG images are allowed.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await apiService<{ url: string; error?: string }>(
    `/upload?folder=${folder}`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!res.url) throw new Error(res.error || "Upload failed");

  return res.url;
};

// Specialized upload function for videos
export const uploadVideoToServer = async (file: File, folder: string) => {
  const allowedTypes = [
    "video/mp4",
    "video/x-matroska",
    "video/quicktime",
    // "video/webm",
  ];

  const ext = file.name.split(".").pop()?.toLowerCase();
  const allowedExts = ["mp4", "mkv", "mov",]; //"webm"

  const MAX_SIZE = 50 * 1024 * 1024; // ✅ 50MB

  // ✅ File size validation
  if (file.size > MAX_SIZE) {
    throw new Error("File too large (max 50MB)");
  }

  if (!allowedTypes.includes(file.type)) {
    // Failsafe for generic octet-stream or cases where browser doesn't recognize the type
    if (
      file.type !== "application/octet-stream" ||
      !ext ||
      !allowedExts.includes(ext)
    ) {
      throw new Error("Only MP4, MKV, MOV  videos are allowed."); //and WEBM
    }
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const res = await apiService<{
    url: string;
    error?: string;
    success?: boolean;
  }>(`/video-upload?folder=${folder}`, {
    method: "POST",
    body: formData,
  });

  if (!res.url) throw new Error(res.error || "Video upload failed");

  return res.url;
};

export const deleteImage = async (url: string) => {
  if (!url) return;
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split("/");
    const folder = parts[2] || "default";

    const payload = { url, folder };

    const res = await apiService("/upload", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    toast({
      title: "Image removed",
      description: "The image was successfully deleted.",
    });
  } catch (err: any) {
    console.error("❌ Delete error:", err);
    toast({
      title: "Delete failed",
      description: err.message || "Could not delete image.",
      variant: "destructive",
    });
    throw err;
  }
};

export const deleteVideo = async (url: string, folder?: string) => {
  if (!url) return;
  try {
    const payload = { url, folder };

    const res = await apiService("/video-upload", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    toast({
      title: "Video removed",
      description: "The video was successfully deleted.",
    });
  } catch (err: any) {
    console.error("❌ Video delete error:", err);
    toast({
      title: "Delete failed",
      description: err.message || "Could not delete video.",
      variant: "destructive",
    });
    throw err;
  }
};

// Add this helper function to your utils file

export const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "_");

export function prepareOtherToolFormValues(toolData: any) {
  if (!toolData) return null;

  // 1. Process Tabs and Deconstruct Prompts
  const formReadyTabs = (toolData.tabs || []).map((tab: any) => {
    const deconstructedPrompts = new Map<string, string>();
    let lastPlaceholderEndIndex = 0;

    (tab.fields || []).forEach((field: any) => {
      const placeholder = `{{${field.key}}}`;
      const placeholderStartIndex = tab.prompt_template.indexOf(
        placeholder,
        lastPlaceholderEndIndex,
      );

      if (placeholderStartIndex === -1) {
        deconstructedPrompts.set(field.key, "");
        return;
      }

      let promptText = tab.prompt_template.substring(
        lastPlaceholderEndIndex,
        placeholderStartIndex,
      );
      promptText = promptText.trim();
      if (promptText.startsWith(".")) {
        promptText = promptText.substring(1).trim();
      }

      deconstructedPrompts.set(field.key, promptText);
      lastPlaceholderEndIndex = placeholderStartIndex + placeholder.length;
    });

    const processedFields = (tab.fields || []).map((field: any) => ({
      key: field.key || slugify(field.label || ""),
      label: field.label || "",
      description: field.description || "",
      type: field.type || "textbox",
      required: field.required || false,
      placeholder: field.placeholder || "",
      options: Array.isArray(field.options)
        ? field.options
        : typeof field.options === "string"
          ? (field.options as string).split(",").map((o: string) => o.trim())
          : [],
      field_prompt_template: deconstructedPrompts.get(field.key) || "",
    }));

    return {
      title: tab.title || "",
      description: tab.description || "",
      prompt_template: tab.prompt_template || "",
      fields: processedFields,
    };
  });

  // 2. Return the Form Ready Object
  return {
    _id: toolData._id,
    display_name: toolData.display_name || "",
    name: toolData.name || "",
    short_description: toolData.short_description || "",
    mini_description: toolData.mini_description || "",
    description: toolData.description || "",
    icon: toolData.icon || "",
    user_plan: toolData.user_plan || "free",
    is_popular: toolData.is_popular ?? false,
    sticky: toolData.sticky ?? false,
    system_prompt_template: toolData.system_prompt_template || "",
    is_active: toolData.is_active ?? true,

    // SEO Fields
    seo_keyphrase: toolData.seo_keyphrase || "",
    seo_title: toolData.seo_title || "",
    meta_description: toolData.meta_description || "",
    cover_image: toolData.cover_image || "",
    tool_cover_image: toolData.tool_cover_image || "",
    tab_normal_icon_image: toolData.tab_normal_icon_image || "",
    tab_active_icon_image: toolData.tab_active_icon_image || "",
    // tab_image: toolData.tab_image || "",

    // Advanced Config
    tabs: formReadyTabs,
    max_tokens: toolData.max_tokens || 4000,
    suggested_topics: (toolData.suggested_topics || []).map((t: any) => ({
      title: t.title || "",
      has_input: t.has_input ?? true,
      input_placeholder: t.input_placeholder || "",
      image: t.image || "", // Added image support based on your schema
      sticky: t.sticky ?? false,
    })),
    display_wordcount: toolData.display_wordcount ?? true,
    show_text_editor: toolData.show_text_editor ?? true,
    has_brand_voice: toolData.has_brand_voice ?? false,
    improvement_system_prompt: toolData.improvement_system_prompt || "",
    custom_url: toolData.custom_url || "",
    tooltips: toolData.tooltips || "",

    // Home Categories & Tags
    categories: toolData.categories || [],
    tags: toolData.tags || [],
    allternativeTools: toolData.allternativeTools || [],
    whatCanDO: toolData.whatCanDO || [],
  };
}
