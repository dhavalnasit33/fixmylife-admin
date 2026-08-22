"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle,
  Briefcase,
  BarChart2,
  CreditCard,
  History,
  Hash,
  CalendarDays,
  MailCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import apiService from "@/lib/apiService";
import type {
  UserDetailsResponseData,
  SingleResponse,
  UserHistoryItem,
  UserHistoryResponse,
} from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import ViewHistoryItemDialog from "./ViewHistoryItemDialog";
import ClientFormattedDate from "@/components/shared/ClientFormattedDate";
import * as React from "react";

interface ViewUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userId: string | null;
}

const HISTORY_ITEMS_PER_PAGE = 5;

const DetailItem = ({
  label,
  value,
  children,
  icon: Icon,
}: {
  label: string;
  value?: string | number | boolean | null;
  children?: React.ReactNode;
  icon?: React.ElementType;
}) => (
  <div className="flex items-start py-2">
    {Icon && (
      <Icon className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" />
    )}
    <span className="text-sm font-medium text-muted-foreground min-w-[120px]">
      {label}:
    </span>
    <span className="text-sm text-foreground ml-2 break-words">
      {children ? (
        children // If children are provided, render them directly
      ) : typeof value === "boolean" ? ( // Handle booleans
        value ? (
          <CheckCircle className="h-5 w-5 text-green-500 inline" />
        ) : (
          <AlertCircle className="h-5 w-5 text-yellow-500 inline" />
        )
      ) : (
        (value ?? "N/A") // For other primitives or null/undefined
      )}
    </span>
  </div>
);

const getInitials = (name?: string) => {
  if (!name) return "U";
  const names = name.split(" ");
  return names.length > 1
    ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

export default function ViewUserDialog({
  isOpen,
  onOpenChange,
  userId,
}: ViewUserDialogProps) {
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserDetailsResponseData | null>(
    null,
  );
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  const [historyItems, setHistoryItems] = useState<UserHistoryItem[]>([]);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const [selectedHistoryItemForDetail, setSelectedHistoryItemForDetail] =
    useState<UserHistoryItem | null>(null);
  const [isHistoryItemDetailOpen, setIsHistoryItemDetailOpen] = useState(false);

  const fetchUserData = useCallback(async () => {
    if (!userId) return;
    setIsLoadingUser(true);
    try {
      const response = await apiService<
        SingleResponse<UserDetailsResponseData>
      >(`/users/${userId}`);
      if (response.success) {
        setUserData(response.data);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load user details.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "An unexpected error occurred loading user data.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUser(false);
    }
  }, [userId, toast]);

  const fetchUserHistory = useCallback(
    async (page: number) => {
      if (!userId) return;
      setIsHistoryLoading(true);
      try {
        const response = await apiService<UserHistoryResponse>(
          `/users/${userId}/history`,
          {
            params: { page, limit: HISTORY_ITEMS_PER_PAGE },
          },
        );
        if (response.success) {
          setHistoryItems(response.data);
          setHistoryCurrentPage(Number(response.pagination.current));
          setHistoryTotalPages(Number(response.pagination.pages));
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to load user history.",
            variant: "destructive",
          });
          setHistoryItems([]);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description:
            error.message || "An unexpected error occurred loading history.",
          variant: "destructive",
        });
        setHistoryItems([]);
      } finally {
        setIsHistoryLoading(false);
      }
    },
    [userId, toast],
  );

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserData();
      fetchUserHistory(1);
    } else if (!isOpen) {
      setUserData(null);
      setHistoryItems([]);
      setHistoryCurrentPage(1);
      setHistoryTotalPages(1);
      setSelectedHistoryItemForDetail(null);
      setIsHistoryItemDetailOpen(false);
    }
  }, [isOpen, userId, fetchUserData, fetchUserHistory]);

  const handleHistoryPageChange = (newPage: number) => {
    if (
      newPage >= 1 &&
      newPage <= historyTotalPages &&
      newPage !== historyCurrentPage
    ) {
      fetchUserHistory(newPage);
    }
  };

  const handleHistoryItemClick = (item: UserHistoryItem) => {
    setSelectedHistoryItemForDetail(item);
    setIsHistoryItemDetailOpen(true);
  };

  const user = userData?.user;
  const usageStats = userData?.usage_stats;
  const paymentStats = userData?.payment_stats;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-11/12 max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            User Details:{" "}
            {isLoadingUser || !user ? (
              <Skeleton className="h-6 w-32 inline-block" />
            ) : (
              user.name
            )}
          </DialogTitle>
          {user && (
            <DialogDescription>
              Comprehensive overview of {user.name}.
            </DialogDescription>
          )}
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-150px)] pr-6">
          <div className="py-4 space-y-6">
            {isLoadingUser ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : user ? (
              <>
                <Card className="shadow-md">
                  <CardHeader className="flex flex-row items-start gap-4">
                    <Avatar className="h-20 w-20 border">
                      <AvatarImage
                        src={user.profile_picture || undefined}
                        alt={user.name}
                      />
                      <AvatarFallback className="text-2xl">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-headline">
                        {user.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge key={role} variant="secondary">
                            {role}
                          </Badge>
                        ))}
                        <Badge
                          variant={
                            user.status === "active"
                              ? "default"
                              : user.status === "suspended"
                                ? "destructive"
                                : "secondary"
                          }
                          className="capitalize"
                        >
                          {user.status}
                        </Badge>
                      </div>
                      {user.interests && user.interests.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {user.interests.map((interest, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] bg-primary/5">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <DetailItem
                      label="Current Plan"
                      value={user.plan}
                      icon={Briefcase}
                    />
                    <DetailItem
                      label="Remaining Tokens"
                      value={user.remaining_tokens.toLocaleString()}
                      icon={Hash}
                    />
                    <DetailItem
                      label="Email Verified"
                      value={user.emailVerified}
                      icon={MailCheck}
                    />
                    <DetailItem label="Last Login" icon={CalendarDays}>
                      <ClientFormattedDate
                        dateInput={user.lastLogin}
                        relative={false}
                        formatString="PPpp"
                        fallback="Never"
                      />
                    </DetailItem>
                    <DetailItem label="Joined" icon={CalendarDays}>
                      <ClientFormattedDate
                        dateInput={user.createdAt}
                        formatString="PP"
                      />
                    </DetailItem>
                  </CardContent>
                </Card>

                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      📱 Device Information
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {user?.devices && user?.devices?.length > 0 ? (
                      user?.devices
                        .slice()
                        .reverse()
                        .slice(0, 5)
                        .map((device, index) => (
                          <div
                            key={index}
                            className="border rounded-lg p-3 text-sm flex flex-col gap-1"
                          >
                            <DetailItem
                              label="Device"
                              value={device?.deviceType}
                            />
                            <DetailItem
                              label="Browser"
                              value={device?.browser}
                            />
                            <DetailItem label="OS" value={device?.os} />
                            <DetailItem label="IP Address" value={device?.ip} />
                            {/* <DetailItem label="Login Time">
                              <ClientFormattedDate
                                dateInput={device?.loginAt}
                                formatString="PPpp"
                              />
                            </DetailItem> */}
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No device data available
                      </p>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <BarChart2 className="mr-2 h-5 w-5 text-primary" />{" "}
                        Usage Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <DetailItem
                        label="Total Prompts"
                        value={
                          usageStats?.total_prompts?.toLocaleString() ?? "N/A"
                        }
                      />
                      <DetailItem
                        label="Total Tokens Used"
                        value={
                          usageStats?.total_tokens_used?.toLocaleString() ??
                          "N/A"
                        }
                      />
                      <DetailItem
                        label="Successful Prompts"
                        value={
                          usageStats?.successful_prompts?.toLocaleString() ??
                          "N/A"
                        }
                      />
                      <DetailItem
                        label="Avg. Response Time"
                        value={
                          usageStats?.avg_response_time
                            ? `${(usageStats.avg_response_time / 1000).toFixed(2)}s`
                            : "N/A"
                        }
                      />
                    </CardContent>
                  </Card>
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <CreditCard className="mr-2 h-5 w-5 text-primary" />{" "}
                        Payment Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <DetailItem
                        label="Total Payments"
                        value={
                          paymentStats?.total_payments?.toLocaleString() ??
                          "N/A"
                        }
                      />
                      <DetailItem
                        label="Total Spent"
                        value={
                          paymentStats?.total_spent
                            ? `$${paymentStats.total_spent.toFixed(2)}`
                            : "N/A"
                        }
                      />
                      <DetailItem
                        label="Successful Payments"
                        value={
                          paymentStats?.successful_payments?.toLocaleString() ??
                          "N/A"
                        }
                      />
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground p-8">
                No user data available or user not found.
              </p>
            )}
          </div>
        </ScrollArea>
        {/* <DialogFooter className="mt-auto pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter> */}
        {selectedHistoryItemForDetail && (
          <ViewHistoryItemDialog
            isOpen={isHistoryItemDetailOpen}
            onOpenChange={setIsHistoryItemDetailOpen}
            historyItem={selectedHistoryItemForDetail}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
