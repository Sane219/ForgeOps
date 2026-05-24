import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type Tone = 'default' | 'success' | 'warning' | 'danger';

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
  icon?: ReactNode;
  tone?: Tone;
  loading?: boolean;
  className?: string;
}

const toneStyles: Record<Tone, { card: string; accent: string }> = {
  default: {
    card: 'border-zinc-800/80 bg-zinc-900/50',
    accent: 'text-zinc-400',
  },
  success: {
    card: 'border-emerald-800/40 bg-emerald-950/20',
    accent: 'text-emerald-400',
  },
  warning: {
    card: 'border-amber-800/40 bg-amber-950/20',
    accent: 'text-amber-400',
  },
  danger: {
    card: 'border-red-800/40 bg-red-950/20',
    accent: 'text-red-400',
  },
};

export function KpiCard({ label, value, delta, trend, icon, tone = 'default', className }: KpiCardProps) {
  const styles = toneStyles[tone];

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        styles.card,
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            {label}
          </p>
          <p className="font-mono text-2xl font-semibold tracking-tight text-zinc-50">
            {value}
          </p>
        </div>
        {icon && (
          <div className={cn('rounded-md p-1.5', styles.accent, 'bg-zinc-800/50')}>
            {icon}
          </div>
        )}
      </div>
      {(delta || trend) && (
        <div className="mt-2 flex items-center gap-1.5">
          {trend === 'up' && <TrendingUp className="h-3 w-3 text-emerald-400" />}
          {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-400" />}
          {trend === 'flat' && <Minus className="h-3 w-3 text-zinc-500" />}
          {delta && (
            <span className={cn(
              'text-[11px] font-medium',
              trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-zinc-500',
            )}>
              {delta}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-4">
      <Skeleton className="h-3 w-20 bg-zinc-800" />
      <Skeleton className="mt-3 h-7 w-16 bg-zinc-800" />
      <Skeleton className="mt-2 h-3 w-28 bg-zinc-800" />
    </div>
  );
}