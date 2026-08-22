import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actionButtons?: ReactNode;
  className?: string;
}

export default function PageHeader({ title, description, actionButtons, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 md:mb-8 border-b pb-4 animate-fade-in", className)}>
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline md:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actionButtons && <div className="flex shrink-0 items-center gap-2">{actionButtons}</div>}
      </div>
    </div>
  );
}
