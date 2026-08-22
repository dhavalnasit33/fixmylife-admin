"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/shared/PageHeader";
import ProtectedPage from "@/components/shared/ProtectedPage";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
} from "lucide-react";
import apiService from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { PaginatedResponse } from "@/types";
import { format } from "date-fns";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import * as XLSX from "xlsx";

const ITEMS_PER_PAGE = 10;

export default function UserPaymentsPage() {
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [plans, setPlans] = useState<
    { _id: string; name: string; display_name?: string }[]
  >([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const startDate = dateRange?.from
    ? new Date(dateRange.from).toISOString()
    : "";
  const endDate = dateRange?.to ? new Date(dateRange.to).toISOString() : "";

  const canViewPayments = hasPermission("view_payments");

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await apiService<{ success: boolean; data: any[] }>(
          "/plans"
        );
        if (response.success) {
          setPlans(response.data);
        }
      } catch (error) {
        // optional: handle error
      }
    }
    fetchPlans();
  }, []);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { page: currentPage, limit: ITEMS_PER_PAGE };
      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      if (planFilter !== "all") params.plan = planFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      // Add date filters if set

      const response = await apiService<PaginatedResponse<any>>("/payments", {
        params,
      });
      if (response.success) {
        setPayments(response.data);
        setTotalPages(response.pagination.pages);
        setTotalItems(response.pagination.total);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch payments.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error fetching payments",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    search,
    currentPage,
    statusFilter,
    planFilter,
    startDate,
    endDate,
    toast,
  ]);
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleDownloadExcel = async () => {
    const params: any = {
      limit: 1000,
      page: 1,
    };
    if (search) params.search = search;
    if (statusFilter !== "all") params.status = statusFilter;
    if (planFilter !== "all") params.plan = planFilter;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    try {
      const response = await apiService<PaginatedResponse<any>>("/payments", {
        params,
      });

      if (!response.success) throw new Error("Failed to download payment data");

      // Map backend payment data to export-friendly objects
      const rows = response.data.map((payment) => ({
        Username: payment.username,
        Email: payment.userEmail,
        Plan: payment.userPlan,
        "Billing Period": payment.billingPeriod,
        "Amount Paid": `${payment.currency} ${payment.amountPaid.toFixed(2)}`,
        "Payment Status": payment.paymentStatus,
        "Plan Start": payment.planStartDate
          ? new Date(payment.planStartDate).toLocaleDateString()
          : "—",
        "Plan End": payment.planEndDate
          ? new Date(payment.planEndDate).toLocaleDateString()
          : "—",
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");

      XLSX.writeFile(workbook, `payments_report.xlsx`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate report.",
        variant: "destructive",
      });
    }
  };

  const planSelected = plans.find((p) => p._id === planFilter);

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "success", label: "Paid" },
    { value: "pending", label: "Pending" },
    { value: "failed", label: "Failed" },
    { value: "cancelling", label: "Cancelling" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <>
      <ProtectedPage requiredPermission="view_payments">
        <PageHeader
          title="User Payments"
          description="View user payment records."
        />

        <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by username or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[240px] justify-start text-left font-normal relative"
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent popover from opening
                    setDateRange(undefined);
                  }}
                  style={{ backgroundColor: "#1ca074ff" }}
                  className="absolute right-3 bottom-4 h-5 w-5 flex items-center justify-center rounded-full p-4 font-bold text-sm text-white"
                  aria-label="Reset date range"
                >
                  ✕
                </button>
              </PopoverContent>
            </Popover>
            {/* Status filter popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-40 justify-between"
                  aria-label="Filter by Payment Status"
                >
                  {statusOptions.find((o) => o.value === statusFilter)?.label ||
                    "All Statuses"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-2 w-40">
                <div
                  role="listbox"
                  aria-label="Payment Statuses"
                  tabIndex={-1}
                  className="flex flex-col space-y-1 max-h-60 overflow-auto"
                >
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`text-left w-full px-2 py-1 rounded ${
                        statusFilter === option.value
                          ? "bg-primary text-white"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => {
                        setStatusFilter(option.value);
                        setCurrentPage(1);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Plan filter popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-48 justify-between"
                  aria-label="Filter by Plan"
                >
                  {planSelected
                    ? planSelected.display_name || planSelected.name
                    : "All Plans"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-2 w-48">
                <div
                  role="listbox"
                  aria-label="Plans"
                  tabIndex={-1}
                  className="flex flex-col space-y-1 max-h-60 overflow-auto"
                >
                  <button
                    type="button"
                    className={`text-left w-full px-2 py-1 rounded ${
                      planFilter === "all"
                        ? "bg-primary text-white"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => {
                      setPlanFilter("all");
                      setCurrentPage(1);
                    }}
                  >
                    All Plans
                  </button>
                  {plans.map((plan) => (
                    <button
                      key={plan._id}
                      type="button"
                      className={`text-left w-full px-2 py-1 rounded ${
                        planFilter === plan._id
                          ? "bg-primary text-white"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => {
                        setPlanFilter(plan._id);
                        setCurrentPage(1);
                      }}
                    >
                      {plan.display_name || plan.name}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={handleDownloadExcel}>
              <Download className="mr-2 h-4 w-4" /> Export to Excel
            </Button>
          </div>
        </div>

        <div className="rounded-md border shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Billing Period</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Plan Start</TableHead>
                <TableHead>Plan End</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                  // ... skeleton row logic same as before ...
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : payments.length > 0 ? (
                payments.map((payment) => {
                  const planEnd = payment.planEndDate
                    ? new Date(payment.planEndDate)
                    : null;

                  // Logic for row coloring based on expiry
                  const today = new Date();
                  const tomorrow = new Date(today);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(0, 0, 0, 0);

                  const planEndNormalized = planEnd
                    ? new Date(
                        planEnd.getFullYear(),
                        planEnd.getMonth(),
                        planEnd.getDate()
                      )
                    : null;

                  const isEndingTomorrow =
                    planEndNormalized &&
                    planEndNormalized.getTime() <= tomorrow.getTime();

                  return (
                    <TableRow
                      key={payment.transactionId || payment._id} // fallbacks added
                      className={isEndingTomorrow ? "bg-red-50" : ""}
                    >
                      <TableCell>{payment.username}</TableCell>
                      <TableCell>{payment.userEmail}</TableCell>
                      <TableCell>
                        {payment.planDisplayName || payment.planName}
                      </TableCell>
                      <TableCell className="capitalize">
                        {payment.billingPeriod}
                      </TableCell>
                      <TableCell>
                        {payment.currency} {payment.amountPaid?.toFixed(2)}
                      </TableCell>

                      {/* 2. UPDATE: Payment Status Cell Logic */}
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`
                              px-2 py-1 rounded-full text-xs font-medium capitalize
                              ${
                                payment.paymentStatus === "success"
                                  ? "bg-green-100 text-green-800"
                                  : payment.paymentStatus === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : payment.paymentStatus === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : payment.paymentStatus === "cancelling"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            `}
                          >
                            {payment.paymentStatus}
                          </span>

                          {/* Display date if status is cancelling */}
                          {payment.paymentStatus === "cancelling" &&
                            planEnd && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                Ends: {format(planEnd, "MMM dd, yyyy")}
                              </span>
                            )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {payment.planStartDate
                          ? format(
                              new Date(payment.planStartDate),
                              "MMM dd, yyyy"
                            )
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {payment.planEndDate
                          ? format(
                              new Date(payment.planEndDate),
                              "MMM dd, yyyy"
                            )
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">
                    No payments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of{" "}
              {totalItems} payments
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages || isLoading}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </ProtectedPage>
    </>
  );
}
