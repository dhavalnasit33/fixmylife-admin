"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardCard from "@/components/dashboard/DashboardCard";
import PageHeader from "@/components/shared/PageHeader";
import ProtectedPage from "@/components/shared/ProtectedPage";
import { Users, DollarSign, Activity, Settings, LogOut } from "lucide-react";
import apiService from "@/lib/apiService";
import type {
  DashboardAnalyticsData,
  MonthlyRevenueData,
  SingleResponse,
} from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { navItemsList } from "@/components/layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";
import { NavItem } from "@/components/layout/NavItems";
import { MonthlyUsageData } from "@/types";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<DashboardAnalyticsData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // Ensure user has view_analytics to fetch this, though page access itself is protected
        if (hasPermission("view_analytics")) {
          const response = await apiService<
            SingleResponse<DashboardAnalyticsData>
          >("/dashboard", { params: { days: 30 } });
          if (response.success) {
            setAnalytics(response.data);
          } else {
            toast({
              title: "Error",
              description: "Failed to load dashboard analytics.",
              variant: "destructive",
            });
          }
        } else {
          // If no permission, don't attempt to fetch or set analytics, it will show 0s or placeholders
          setAnalytics(null);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [toast, hasPermission]);

  const chartData =
    analytics?.monthly_usage && analytics?.monthly_revenue
      ? analytics.monthly_usage.map((month: MonthlyUsageData) => {
          const revenueMonth = analytics.monthly_revenue!.find(
            (r: MonthlyRevenueData) =>
              r._id?.year === month._id.year &&
              r._id?.month === month._id.month,
          );

          return {
            name: new Date(month._id.year, month._id.month - 1).toLocaleString(
              "en-US",
              {
                month: "short",
                year: "2-digit",
              },
            ),
            users: month.unique_users_count,
            revenue: revenueMonth ? revenueMonth.total_revenue : 0,
          };
        })
      : [];

  const checkPermissionsForNavItem = (
    itemPermission?: NavItem["permission"],
  ): boolean => {
    if (itemPermission === undefined) return true;
    if (Array.isArray(itemPermission)) {
      return itemPermission.some((p) => hasPermission(p));
    }
    return hasPermission(itemPermission);
  };
  const isAdmin: Boolean = useSelector((state: any) => state.user.isAdmin);

  const flattenNavItems = (items: NavItem[]): NavItem[] => {
    return items.flatMap((item) => {
      if (item.children && item.children.length > 0) {
        return item.children;
      }
      return item;
    });
  };

  const allNavItems = flattenNavItems(navItemsList);

  const accessibleNavItems = navItemsList
    .map((item) => {
      if (!item.href && item.children?.length) {
        // find the first child the user has permission to access
        const firstAccessibleChild = item.children.find((child) =>
          checkPermissionsForNavItem(child.permission),
        );
        return { ...item, href: firstAccessibleChild?.href };
      }
      return item;
    })
    .filter(
      (item) =>
        !item.isTitle &&
        item.href &&
        item.href !== "/dashboard" &&
        checkPermissionsForNavItem(item.permission),
    );

  // 1. This function actually makes the API call
  const executeForceLogout = async () => {
    setShowLogoutConfirm(false); // Close the modal immediately

    try {
      const response = await apiService<SingleResponse<any>>(
        "/auth/force-logout-users",
        { method: "POST" },
      );

      // @ts-ignore
      if (response.success) {
        toast({
          title: "Success",
          // @ts-ignore
          description: response.message || "Users logged out successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to force logout users.",
        variant: "destructive",
      });
    }
  };

  return (
    <ProtectedPage>
      {/* UPDATE THIS SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <PageHeader
          title="Dashboard Overview"
          description="Key metrics and performance indicators."
        />

        {isAdmin && (
          <Button
            onClick={() => setShowLogoutConfirm(true)} // Opens the modal
            variant="destructive"
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Force Logout All Users
          </Button>
        )}
      </div>

      {/* NEW: Centered Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-card text-card-foreground p-6 rounded-lg shadow-xl w-full max-w-md border border-border animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-headline font-semibold mb-2">
              Are you absolutely sure?
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              This action will immediately log out all non-admin users. They
              will lose any unsaved work. You cannot undo this action.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={executeForceLogout}>
                Yes, Logout All Users
              </Button>
            </div>
          </div>
        </div>
      )}
      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <DashboardCard
            title="Total Users"
            value={analytics?.users.total[0]?.count ?? 0}
            description={`${
              analytics?.users.new_users[0]?.count ?? 0
            } new this month`}
            icon={Users}
            isLoading={loading}
          />
          <DashboardCard
            title="Total Revenue"
            value={analytics?.revenue.total_revenue ?? 0}
            prefix="$"
            decimals={2}
            description={`Avg. $${(
              analytics?.revenue.avg_transaction ?? 0
            ).toFixed(2)} per transaction`}
            icon={DollarSign}
            isLoading={loading}
          />
          <DashboardCard
            title="Total Prompts"
            value={analytics?.usage.total_prompts ?? 0}
            description={`${
              analytics?.usage.successful_prompts ?? 0
            } successful`}
            icon={Activity}
            isLoading={loading}
          />
          <DashboardCard
            title="Active Users"
            value={analytics?.users.active[0]?.count ?? 0}
            description="Currently active"
            icon={Users}
            isLoading={loading}
          />
        </div>
      )}

      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Quick Access</CardTitle>
          <CardDescription>
            Navigate to key management sections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && accessibleNavItems.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 bg-muted animate-pulse rounded-md"
                />
              ))}
            </div>
          ) : accessibleNavItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {accessibleNavItems.map((item) => {
                const Icon = item.icon || Settings;
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={cn(
                      "group flex flex-col items-center justify-center p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-200",
                      "hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    )}
                  >
                    <Icon className="h-8 w-8 mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium text-center">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No sections accessible or configured.
            </p>
          )}
        </CardContent>
      </Card>
      {isAdmin && (
        <div className="grid gap-8 md:grid-cols-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">
                User Growth & Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
              {loading ? (
                <div className="w-full h-full bg-muted animate-pulse rounded-md" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="hsl(var(--primary))"
                      fontSize={12}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="hsl(var(--accent))"
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar
                      yAxisId="left"
                      dataKey="users"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      name="New Users"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="revenue"
                      fill="hsl(var(--accent))"
                      radius={[4, 4, 0, 0]}
                      name="Revenue ($)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">
                Recent Activity (Placeholder)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <div className="h-8 w-full bg-muted animate-pulse rounded-md" />
                  <div className="h-8 w-full bg-muted animate-pulse rounded-md" />
                  <div className="h-8 w-4/5 bg-muted animate-pulse rounded-md" />
                </div>
              ) : (
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>User 'john.doe@example.com' logged in.</p>
                  <p>Tool 'Blog Post Generator' used successfully.</p>
                  <p>New user 'jane.smith@example.com' registered.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </ProtectedPage>
  );
}
