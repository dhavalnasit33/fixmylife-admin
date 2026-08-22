"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, type LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Permission } from "@/config";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

export interface NavItem {
  href?: string;
  label: string;
  icon?: LucideIcon;
  permission?: Permission | Permission[];
  adminOnly?: boolean;
  isTitle?: boolean;
  badge?: string | number;
  children?: NavItem[];
  target?: string;
}

interface NavItemsProps {
  items: NavItem[];
  isMobile?: boolean;
  isSubmenu?: boolean;
}

// === Component for items with children ===
function NavItemWithChildren({
  item,
  pathname,
  isMobile,
  checkPermissions,
}: {
  item: NavItem;
  pathname: string;
  isMobile: boolean;
  checkPermissions: (
    perm?: Permission | Permission[],
    adminOnly?: boolean
  ) => boolean;
}) {
  // Auto-open if current path matches any child href
  const isChildActive = item.children?.some(
    (child) => child.href && pathname.startsWith(child.href)
  );

  const [open, setOpen] = useState(isChildActive); 

  useEffect(() => {
    if (isChildActive) {
      setOpen(true); 
    }
  }, [isChildActive]);

  const Icon = item.icon;

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center rounded-md px-3 py-2.5 justify-between w-full transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar-background",
          "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isMobile ? "text-base" : "text-sm"
        )}
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 mr-3" />}
          {item.label}
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      {open && (
        <ul className="ml-4 mt-1 space-y-1">
          {item.children
            ?.filter((child) =>
              checkPermissions(child.permission, child.adminOnly)
            )
            .map((child, idx) => {
              const ChildIcon = child.icon;
              const isActive = pathname === child.href;
              return (
                <li key={idx}>
                  <Link
                    href={child.href ?? "#"}
                    target={child.target}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-primary text-white"
                        : "text-sidebar-foreground hover:bg-[#dbe0e6]"
                    )}
                  >
                    {ChildIcon && <ChildIcon className="h-4 w-4" />}
                    {child.label}
                  </Link>
                </li>
              );
            })}
        </ul>
      )}
    </li>
  );
}

export default function NavItems({
  items,
  isMobile = false,
  isSubmenu = false,
}: NavItemsProps) {
  const pathname = usePathname();
  const { hasPermission, user } = useAuth();

  if (!user) return null;

  const checkPermissions = (
    itemPermission?: Permission | Permission[],
    adminOnly?: boolean
  ): boolean => {
    if (adminOnly) {
      return user.roles.includes("Admin") || user.roles.includes("Admin_user");
    }
    if (itemPermission === undefined) return true;
    if (Array.isArray(itemPermission)) {
      return itemPermission.some((p) => hasPermission(p));
    }
    return hasPermission(itemPermission);
  };

  return (
    <TooltipProvider delayDuration={100}>
      <ul className={cn("space-y-1", isSubmenu ? "ml-4" : "")}>
        {items.map((item, index) => {
          if (!checkPermissions(item.permission, item.adminOnly)) return null;

          // Section Title
          if (item.isTitle) {
            return (
              <li
                key={index}
                className="px-3 py-2 text-xs font-semibold uppercase text-sidebar-foreground/60 tracking-wider"
              >
                {item.label}
              </li>
            );
          }

          const Icon = item.icon;
          const isActive = item.href
            ? pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href))
            : false;

          const linkContent = (
            <>
              {Icon && (
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isMobile
                      ? "mr-3"
                      : "mr-3 group-hover:scale-110 transition-transform duration-150"
                  )}
                />
              )}
              <span
                className={cn("truncate", isMobile ? "text-base" : "text-sm")}
              >
                {item.label}
              </span>
              {item.badge && (
                <Badge
                  variant={isActive ? "default" : "secondary"}
                  className="ml-auto"
                >
                  {item.badge}
                </Badge>
              )}
            </>
          );

          const linkClasses = cn(
            "flex items-center rounded-md px-3 py-2.5 transition-colors duration-150 ease-in-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar-background",
            isActive
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isMobile ? "text-base" : "text-sm"
          );

          // Has children
          if (item.children && item.children.length > 0) {
            return (
              <NavItemWithChildren
                key={index}
                item={item}
                pathname={pathname}
                isMobile={isMobile}
                checkPermissions={checkPermissions}
              />
            );
          }

          // Standard link
          return (
            <li key={index}>
              {item.href ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      target={item.target}
                      className={linkClasses}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {linkContent}
                    </Link>
                  </TooltipTrigger>
                  {!isMobile && (
                    <TooltipContent
                      side="right"
                      sideOffset={5}
                      className="bg-background text-foreground border border-border shadow-lg rounded-md px-2 py-1 text-xs"
                    >
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              ) : (
                <div className={linkClasses + " cursor-default"}>
                  {linkContent}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </TooltipProvider>
  );
}
