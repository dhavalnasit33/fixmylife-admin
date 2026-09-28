'use client';

export const dynamic = 'force-dynamic'; // ⬅️ Force dynamic rendering on Vercel

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden sm:block w-64 border-r bg-sidebar p-4 space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-5/6" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Very brief flash before redirect
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-72 flex-1 print:sm:pl-0">
        <Header />
        <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
