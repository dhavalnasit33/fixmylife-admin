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
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldCheck, Lock, Unlock, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import apiService from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";

interface ViolationEvent {
  _id: string;
  userId: {
    _id: string;
    name?: string;
    email?: string;
    status?: string;
  } | null;
  categories: string[];
  scores: Record<string, number>;
  tool: string;
  source: string;
  action: string;
  promptHash: string;
  createdAt: string;
}

interface SuspendedUser {
  _id: string;
  name?: string;
  email?: string;
  plan?: string;
  status: string;
  updatedAt: string;
}

interface SafetyStats {
  totalViolations: number;
  violations30Days: number;
  suspendedUsersCount: number;
  topCategories: { category: string; count: number }[];
}

interface PaginatedApiResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

export default function SafetyViolationsPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<SafetyStats | null>(null);
  
  // Violations state & pagination
  const [violations, setViolations] = useState<ViolationEvent[]>([]);
  const [violationsPage, setViolationsPage] = useState(1);
  const [violationsTotalPages, setViolationsTotalPages] = useState(1);
  const [violationsTotalItems, setViolationsTotalItems] = useState(0);

  // Suspended users state & pagination
  const [suspendedUsers, setSuspendedUsers] = useState<SuspendedUser[]>([]);
  const [suspendedPage, setSuspendedPage] = useState(1);
  const [suspendedTotalPages, setSuspendedTotalPages] = useState(1);
  const [suspendedTotalItems, setSuspendedTotalItems] = useState(0);

  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingViolations, setIsLoadingViolations] = useState(true);
  const [isLoadingSuspended, setIsLoadingSuspended] = useState(true);
  const [unbanningId, setUnbanningId] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      const res = await apiService<{ success: boolean; data: SafetyStats }>("/admin/safety/stats");
      if (res.success) {
        setStats(res.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch safety stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  const fetchViolations = useCallback(async (page: number = violationsPage) => {
    try {
      setIsLoadingViolations(true);
      const res = await apiService<PaginatedApiResponse<ViolationEvent>>("/admin/safety/violations", {
        params: { page, limit: 10 },
      });
      if (res.success) {
        setViolations(res.data || []);
        if (res.pagination) {
          setViolationsPage(res.pagination.current);
          setViolationsTotalPages(res.pagination.pages || 1);
          setViolationsTotalItems(res.pagination.total || 0);
        }
      }
    } catch (error: any) {
      console.error("Failed to fetch violations:", error);
    } finally {
      setIsLoadingViolations(false);
    }
  }, [violationsPage]);

  const fetchSuspendedUsers = useCallback(async (page: number = suspendedPage) => {
    try {
      setIsLoadingSuspended(true);
      const res = await apiService<PaginatedApiResponse<SuspendedUser>>("/admin/safety/suspended-users", {
        params: { page, limit: 10 },
      });
      if (res.success) {
        setSuspendedUsers(res.data || []);
        if (res.pagination) {
          setSuspendedPage(res.pagination.current);
          setSuspendedTotalPages(res.pagination.pages || 1);
          setSuspendedTotalItems(res.pagination.total || 0);
        }
      }
    } catch (error: any) {
      console.error("Failed to fetch suspended users:", error);
    } finally {
      setIsLoadingSuspended(false);
    }
  }, [suspendedPage]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchViolations(violationsPage);
  }, [violationsPage]);

  useEffect(() => {
    fetchSuspendedUsers(suspendedPage);
  }, [suspendedPage]);

  const handleUnbanUser = async (userId: string, email?: string) => {
    try {
      setUnbanningId(userId);
      const res = await apiService<{ success: boolean; message: string }>(`/admin/safety/users/${userId}/unban`, {
        method: "POST",
      });

      if (res.success) {
        toast({
          title: "User Account Restored",
          description: res.message || `User ${email || userId} has been unbanned.`,
        });
        fetchStats();
        fetchSuspendedUsers(suspendedPage);
        fetchViolations(violationsPage);
      }
    } catch (error: any) {
      toast({
        title: "Unban Failed",
        description: error.message || "Failed to restore user account.",
        variant: "destructive",
      });
    } finally {
      setUnbanningId(null);
    }
  };

  return (
    <ProtectedPage requiredPermission="User">
      <div className="space-y-6">
        <PageHeader
          title="Content Safety & Violation Audit"
          description="Monitor automated content safety blocks, review violation events, and manage suspended user accounts."
        />

        {/* METRICS OVERVIEW CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border p-5 rounded-lg shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Safety Blocks</p>
              <h3 className="text-2xl font-bold mt-1">{isLoadingStats ? "..." : stats?.totalViolations ?? 0}</h3>
              <p className="text-xs text-muted-foreground mt-1">All-time blocked prompts & outputs</p>
            </div>
            <div className="p-3 bg-red-500/10 text-red-500 rounded-full">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-card border p-5 rounded-lg shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Blocks (Last 30 Days)</p>
              <h3 className="text-2xl font-bold mt-1">{isLoadingStats ? "..." : stats?.violations30Days ?? 0}</h3>
              <p className="text-xs text-muted-foreground mt-1">Recent violation events</p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-card border p-5 rounded-lg shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Suspended User Accounts</p>
              <h3 className="text-2xl font-bold mt-1">{isLoadingStats ? "..." : stats?.suspendedUsersCount ?? 0}</h3>
              <p className="text-xs text-muted-foreground mt-1">Locked due to safety violations</p>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-full">
              <Lock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* SUSPENDED USERS MANAGEMENT TABLE */}
        <div className="bg-card border rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-500" />
                Suspended Accounts Management
              </h3>
              <p className="text-sm text-muted-foreground">Review users locked out for child safety or 5+ repeat violations.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchSuspendedUsers(suspendedPage)} disabled={isLoadingSuspended}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingSuspended ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingSuspended ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Loading suspended users...</TableCell>
                  </TableRow>
                ) : suspendedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No suspended user accounts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  suspendedUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.email || user.name || user._id}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">Suspended</Badge>
                      </TableCell>
                      <TableCell className="capitalize">{user.plan || "basic"}</TableCell>
                      <TableCell>{new Date(user.updatedAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={unbanningId === user._id}
                          onClick={() => handleUnbanUser(user._id, user.email)}
                        >
                          <Unlock className="w-4 h-4 mr-1.5" />
                          {unbanningId === user._id ? "Unbanning..." : "Unban User"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* SUSPENDED USERS PAGINATION CONTROLS */}
          {suspendedTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Showing page {suspendedPage} of {suspendedTotalPages} ({suspendedTotalItems} total suspended users)
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSuspendedPage((prev) => Math.max(prev - 1, 1))}
                  disabled={suspendedPage === 1 || isLoadingSuspended}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSuspendedPage((prev) => Math.min(prev + 1, suspendedTotalPages))}
                  disabled={suspendedPage === suspendedTotalPages || isLoadingSuspended}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* VIOLATION LOGS TABLE */}
        <div className="bg-card border rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                Logged Violation Events
              </h3>
              <p className="text-sm text-muted-foreground">Audit log of blocked content safety attempts.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchViolations(violationsPage)} disabled={isLoadingViolations}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingViolations ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Tool / Endpoint</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Flagged Categories</TableHead>
                  <TableHead>Prompt Fingerprint</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingViolations ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Loading violation events...</TableCell>
                  </TableRow>
                ) : violations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No content safety violation events logged yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  violations.map((v) => (
                    <TableRow key={v._id}>
                      <TableCell className="whitespace-nowrap text-xs">{new Date(v.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="font-medium text-xs">
                        {v.userId ? (
                          <div>
                            <div>{v.userId.email || v.userId.name || v.userId._id}</div>
                            {v.userId.status === "suspended" && (
                              <Badge variant="destructive" className="text-[10px] py-0 mt-0.5">Suspended</Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground font-mono">Anonymous</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{v.tool || "unknown"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">
                          {v.source || "input_check"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(v.categories || []).map((cat, idx) => (
                            <Badge
                              key={idx}
                              variant={cat.includes("minors") || cat.includes("self-harm") ? "destructive" : "secondary"}
                              className="text-[11px]"
                            >
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground truncate max-w-[150px]" title={v.promptHash}>
                        {v.promptHash}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* VIOLATIONS PAGINATION CONTROLS */}
          {violationsTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Showing page {violationsPage} of {violationsTotalPages} ({violationsTotalItems} total violation events)
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViolationsPage((prev) => Math.max(prev - 1, 1))}
                  disabled={violationsPage === 1 || isLoadingViolations}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViolationsPage((prev) => Math.min(prev + 1, violationsTotalPages))}
                  disabled={violationsPage === violationsTotalPages || isLoadingViolations}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}
