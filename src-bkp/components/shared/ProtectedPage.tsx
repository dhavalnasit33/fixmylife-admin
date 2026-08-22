'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { Permission } from '@/config';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedPageProps {
  children: ReactNode;
  requiredPermission?: Permission | Permission[];
  fallbackMessage?: string;
}

export default function ProtectedPage({ children, requiredPermission, fallbackMessage }: ProtectedPageProps) {
  const { user, loading, hasPermission, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    // Show a loading state or skeleton while auth state is being determined
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const canAccess = requiredPermission
    ? Array.isArray(requiredPermission)
      ? requiredPermission.some(p => hasPermission(p))
      : hasPermission(requiredPermission)
    : true; // If no permission is required, allow access for authenticated users

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-6 text-center">
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle className="font-headline text-xl">Access Denied</AlertTitle>
          <AlertDescription>
            {fallbackMessage || "You do not have the necessary permissions to view this page."}
          </AlertDescription>
        </Alert>
        <button onClick={() => router.back()} className="mt-6 text-sm text-primary hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
