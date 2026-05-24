import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode; // action buttons
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-50">{title}</h1>
        {description && (
          <p className="text-sm text-zinc-400">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}
