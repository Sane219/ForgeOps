import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function KpiCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-4', className)}>
      <Skeleton className="h-3 w-24 bg-zinc-800" />
      <Skeleton className="mt-3 h-8 w-20 bg-zinc-800" />
      <Skeleton className="mt-2 h-3 w-16 bg-zinc-800" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4, className }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-zinc-800/80', className)}>
      {/* Header */}
      <div className="flex gap-4 border-b border-zinc-800/80 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1 bg-zinc-800" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-4 border-b border-zinc-800/40 px-4 py-3 last:border-0">
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton key={col} className="h-3 flex-1 bg-zinc-800/60" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function PanelSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-5', className)}>
      <Skeleton className="h-4 w-32 bg-zinc-800" />
      <div className="mt-4 space-y-3">
        <Skeleton className="h-3 w-full bg-zinc-800/60" />
        <Skeleton className="h-3 w-4/5 bg-zinc-800/60" />
        <Skeleton className="h-3 w-3/5 bg-zinc-800/60" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-5', className)}>
      <Skeleton className="mb-4 h-4 w-28 bg-zinc-800" />
      <Skeleton className="h-40 w-full rounded-md bg-zinc-800/40" />
    </div>
  );
}
