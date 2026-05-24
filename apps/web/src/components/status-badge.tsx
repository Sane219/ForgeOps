import { cn } from '@/lib/utils';

type Status =
  | 'SUCCEEDED'
  | 'FAILED'
  | 'IN_PROGRESS'
  | 'PENDING'
  | 'ROLLED_BACK'
  | 'HEALTHY'
  | 'UNHEALTHY'
  | 'DEGRADED'
  | 'OPEN'
  | 'RESOLVED'
  | 'ACKNOWLEDGED';

const STATUS_CONFIG: Record<Status, { label: string; dot: string; text: string; bg: string }> = {
  SUCCEEDED: { label: 'Succeeded', dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  FAILED: { label: 'Failed', dot: 'bg-red-400', text: 'text-red-400', bg: 'bg-red-400/10' },
  IN_PROGRESS: { label: 'In progress', dot: 'bg-blue-400 animate-pulse', text: 'text-blue-400', bg: 'bg-blue-400/10' },
  PENDING: { label: 'Pending', dot: 'bg-zinc-400', text: 'text-zinc-400', bg: 'bg-zinc-400/10' },
  ROLLED_BACK: { label: 'Rolled back', dot: 'bg-amber-400', text: 'text-amber-400', bg: 'bg-amber-400/10' },
  HEALTHY: { label: 'Healthy', dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  UNHEALTHY: { label: 'Unhealthy', dot: 'bg-red-400', text: 'text-red-400', bg: 'bg-red-400/10' },
  DEGRADED: { label: 'Degraded', dot: 'bg-amber-400', text: 'text-amber-400', bg: 'bg-amber-400/10' },
  OPEN: { label: 'Open', dot: 'bg-red-400', text: 'text-red-400', bg: 'bg-red-400/10' },
  RESOLVED: { label: 'Resolved', dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ACKNOWLEDGED: { label: 'Acknowledged', dot: 'bg-amber-400', text: 'text-amber-400', bg: 'bg-amber-400/10' },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as Status] ?? {
    label: status,
    dot: 'bg-zinc-400',
    text: 'text-zinc-400',
    bg: 'bg-zinc-400/10',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        config.bg,
        config.text,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}
