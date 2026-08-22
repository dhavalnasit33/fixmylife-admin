import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  value: number; // ✅ Always number now
  prefix?: string; // ✅ For currency or other symbols
  decimals?: number; // ✅ Control decimal precision
  description?: string;
  icon?: LucideIcon;
  className?: string;
  footer?: ReactNode;
  isLoading?: boolean;
}

export default function DashboardCard({
  title,
  value,
  prefix,
  decimals = 0,
  description,
  icon: Icon,
  className,
  footer,
  isLoading = false,
}: DashboardCardProps) {
  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fade-in", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 w-24 bg-muted animate-pulse rounded-md"></div>
        ) : (
          <div className="text-3xl font-bold font-headline text-primary">
            {prefix && <span>{prefix}</span>}
            <CountUp target={value} decimals={decimals} />
          </div>
        )}
        {description && !isLoading && (
          <p className="text-xs text-muted-foreground pt-1">{description}</p>
        )}
        {isLoading && (
          <div className="mt-1 h-4 w-3/4 bg-muted animate-pulse rounded-md"></div>
        )}
        {footer && <div className="pt-2 mt-2 border-t">{footer}</div>}
      </CardContent>
    </Card>
  );
}

interface CountUpProps {
  target: number;
  duration?: number; // in ms
  decimals?: number;
}

const CountUp = ({ target, duration = 1000, decimals = 0 }: CountUpProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16); // ~60fps

    const animate = () => {
      start += increment;
      if (start < target) {
        setCount(parseFloat(start.toFixed(decimals)));
        requestAnimationFrame(animate);
      } else {
        setCount(parseFloat(target.toFixed(decimals)));
      }
    };

    animate();
  }, [target, duration, decimals]);

  return count.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};
