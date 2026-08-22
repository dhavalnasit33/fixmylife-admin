"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import PageHeader from "@/components/shared/PageHeader";
import ProtectedPage from "@/components/shared/ProtectedPage";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, Download, Undo2 } from "lucide-react";
import { format, subDays, startOfMonth } from "date-fns";
import type { DateRange } from "react-day-picker";
import apiService from "@/lib/apiService";
import type { PaymentAnalyticsData, PaymentAnalyticsResponse } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardCard from "@/components/dashboard/DashboardCard";
import {
  Pie,
  PieChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
} from "recharts";
import * as XLSX from "xlsx";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function PaymentsPage() {
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const [analytics, setAnalytics] = useState<PaymentAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(subDays(new Date(), 30)),
    to: new Date(),
  });

  const canProcessRefunds = hasPermission("process_refunds");
  const canExportData = hasPermission("export_data");
  const canViewPayments = hasPermission("view_payments");

  const fetchAnalytics = useCallback(async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    setLoading(true);
    try {
      const params = {
        start_date: format(dateRange.from, "yyyy-MM-dd"),
        end_date: format(dateRange.to, "yyyy-MM-dd"),
      };
      const response = await apiService<PaymentAnalyticsResponse>(
        "/payments/analytics/overview",
        { params }
      );
      if (response.success) {
        setAnalytics(response.data);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load payment analytics.",
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
      setLoading(false);
    }
  }, [toast, dateRange]);

  useEffect(() => {
    if (canViewPayments) {
      fetchAnalytics();
    } else {
      setLoading(false);
      setAnalytics(null);
    }
  }, [fetchAnalytics, canViewPayments]);

  const handleExport = () => {
    if (!analytics) return;

    const sheetData = analytics.breakdown.map((item) => ({
      Status: item.status,
      Plan: item.plan,
      PaymentMethod: item.payment_method,
      Count: item.count,
      TotalAmount: item.total_amount,
      AvgAmount: item.avg_amount,
    }));

    const summaryData = [
      {
        TotalRevenue: analytics.total_revenue,
        TotalTransactions: analytics.total_transactions,
        SuccessfulTransactions: analytics.success_transactions,
        AvgAmountPerSuccess: (
          analytics.total_revenue / analytics.success_transactions
        ).toFixed(2),
      },
    ];

    const wb = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    const breakdownSheet = XLSX.utils.json_to_sheet(sheetData);

    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
    XLSX.utils.book_append_sheet(wb, breakdownSheet, "Breakdown");

    XLSX.writeFile(wb, "payment-analytics.xlsx");
  };

  type PlanRevenue = {
    plan: string;
    amount: number;
  };

  const byPlan: PlanRevenue[] = (analytics?.breakdown || [])
    .filter((item) => item.status === "success")
    .reduce<PlanRevenue[]>((acc, item) => {
      const existing = acc.find((p) => p.plan === item.plan);
      if (existing) {
        existing.amount += item.total_amount;
      } else {
        acc.push({ plan: item.plan, amount: item.total_amount });
      }
      return acc;
    }, []);

  const byStatus = useMemo(() => {
    const map = new Map<string, number>();

    for (const item of analytics?.breakdown || []) {
      map.set(item.status, (map.get(item.status) || 0) + item.count);
    }

    // ✅ Ensure all 3 statuses are present
    const statuses = ["success", "failed", "pending"];
    for (const status of statuses) {
      if (!map.has(status)) {
        map.set(status, 0);
      }
    }

    return Array.from(map.entries()).map(([status, count]) => ({
      status,
      count,
    }));
  }, [analytics]);

  // ✅ Chart data
  const pieChartDataByPlan = byPlan.map((item) => ({
    name: item.plan,
    value: item.amount,
  }));
  const pieChartDataByStatus = byStatus.map((item) => ({
    name: item.status,
    value: item.count,
  }));

  return (
    <ProtectedPage requiredPermission={["view_payments", "process_refunds"]}>
      <PageHeader
        title="Payment Analytics"
        description="Overview of payment trends and statistics."
        actionButtons={
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[240px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            {/* {canExportData && (
              <Button onClick={handleExport} variant="outline">
                Export Analytics
              </Button>
            )} */}
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <DashboardCard
          title="Total Payments"
          value={analytics?.total_transactions ?? 0}
          description="Number of transactions"
          isLoading={loading}
        />
        <DashboardCard
          title="Total Amount Received"
          value={analytics?.total_revenue ?? 0}
          prefix={analytics?.currency || "$"}
          decimals={2}
          description="Gross revenue"
          isLoading={loading}
        />
        <DashboardCard
          title="Avg. Amount per Payment"
          value={
            analytics && analytics.success_transactions > 0
              ? analytics.total_revenue / analytics.success_transactions
              : 0
          }
          prefix={analytics?.currency || "$"}
          decimals={2}
          description="Average transaction value"
          isLoading={loading}
        />

        <DashboardCard
          title="Active Plans Contributing"
          value={byPlan.length}
          description="Number of plans with payments"
          isLoading={loading}
        />
      </div>

      <div className="grid gap-8 md:grid-cols-2 mb-8">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline">Revenue by Plan</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            {loading ? (
              <Skeleton className="w-full h-full bg-muted rounded-md" />
            ) : pieChartDataByPlan.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartDataByPlan}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={40}
                    cornerRadius={8}
                    paddingAngle={4}
                    minAngle={10}
                    labelLine={false}
                    label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      percent,
                    }) => {
                      if (percent === 0) return null;
                      const RADIAN = Math.PI / 180;
                      const radius =
                        innerRadius + (outerRadius - innerRadius) / 2;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);

                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#fff"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={14}
                          fontWeight="bold"
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {pieChartDataByPlan.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      `${analytics?.currency || "$"}${value.toLocaleString()}`
                    }
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: "0.875rem" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground pt-10">
                No data for selected period.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline">Payments by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            {loading ? (
              <Skeleton className="w-full h-full bg-muted rounded-md" />
            ) : pieChartDataByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartDataByStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={40}
                    cornerRadius={8}
                    paddingAngle={4}
                    minAngle={10}
                    labelLine={false}
                    label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      percent,
                    }) => {
                      if (percent === 0) return null;
                      const RADIAN = Math.PI / 180;
                      const radius =
                        innerRadius + (outerRadius - innerRadius) / 2;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);

                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#fff"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={14}
                          fontWeight="bold"
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {pieChartDataByStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `${value.toLocaleString()}`}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: "0.875rem" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground pt-10">
                No data for selected period.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {canProcessRefunds && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Process Refund</CardTitle>
            <CardDescription>
              Select a payment (functionality pending API for listing payments)
              and process a refund.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-8 text-center text-muted-foreground">
              <p className="mb-4">
                Payment listing and selection for refund processing will be
                implemented here once the relevant API is available.
              </p>
              <Button disabled>
                {" "}
                {}
                <Undo2 className="mr-2 h-4 w-4" /> Process a Refund
                (Placeholder)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </ProtectedPage>
  );
}
