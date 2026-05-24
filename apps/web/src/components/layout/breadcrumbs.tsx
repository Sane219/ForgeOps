'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

const labelMap: Record<string, string> = {
  app: 'App',
  dashboard: 'Dashboard',
  services: 'Services',
  deployments: 'Deployments',
  security: 'Security',
  cost: 'Cost',
  observability: 'Observability',
  incidents: 'Incidents',
  audit: 'Audit Trail',
  settings: 'Settings',
  workspace: 'Workspace',
  new: 'New',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  // Filter out 'app' prefix and dynamic segments
  const crumbs = segments
    .filter((s) => s !== 'app')
    .map((segment, i, arr) => {
      const href = `/app/${arr.slice(0, i + 1).join('/')}`;
      const label = labelMap[segment] ?? segment;
      const isLast = i === arr.length - 1;
      return { href, label, isLast, segment };
    });

  if (crumbs.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm">
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {!crumb.isLast && (
            <ChevronRight className="h-3 w-3 text-zinc-600" />
          )}
          {crumb.isLast ? (
            <span className="text-zinc-200">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="text-zinc-500 transition-colors hover:text-zinc-300"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
