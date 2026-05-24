import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; variant?: 'default' | 'outline' };
  children?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, children, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="rounded-lg bg-zinc-900 p-3 ring-1 ring-zinc-800">
        <Icon className="h-6 w-6 text-zinc-500" />
      </div>
      <h3 className="mt-4 text-sm font-medium text-zinc-200">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-zinc-500">{description}</p>
      )}
      {action && (
        <Button
          size="sm"
          variant={action.variant ?? 'default'}
          className={cn(
            'mt-4',
            action.variant !== 'outline' && 'bg-indigo-600 text-white hover:bg-indigo-500',
            action.variant === 'outline' && 'border-zinc-700 text-zinc-300 hover:bg-zinc-800',
          )}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}
