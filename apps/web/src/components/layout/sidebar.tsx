'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui.store';
import {
  LayoutDashboard,
  Boxes,
  Rocket,
  Shield,
  DollarSign,
  Activity,
  AlertTriangle,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navItems = [
  { href: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/services', label: 'Services', icon: Boxes },
  { href: '/app/deployments', label: 'Deployments', icon: Rocket },
  { href: '/app/security', label: 'Security', icon: Shield },
  { href: '/app/cost', label: 'Cost', icon: DollarSign },
  { href: '/app/observability', label: 'Observability', icon: Activity },
  { href: '/app/incidents', label: 'Incidents', icon: AlertTriangle },
  { href: '/app/audit', label: 'Audit Trail', icon: ScrollText },
];

const bottomItems = [
  { href: '/app/settings/workspace', label: 'Settings', icon: Settings },
];

function NavItem({
  href,
  label,
  icon: Icon,
  collapsed,
  active,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  collapsed: boolean;
  active: boolean;
}) {
  const content = (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-zinc-800 text-zinc-50'
          : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200',
        collapsed && 'justify-center px-2',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-zinc-800 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
          <span className="text-xs font-bold text-white">F</span>
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold text-zinc-50">ForgeOps</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            collapsed={collapsed}
            active={pathname.startsWith(item.href)}
          />
        ))}
      </nav>

      {/* Bottom items + collapse toggle */}
      <div className="space-y-1 border-t border-zinc-800 p-2">
        {bottomItems.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            collapsed={collapsed}
            active={pathname.startsWith(item.href)}
          />
        ))}
        <button
          onClick={toggle}
          className="flex w-full items-center justify-center rounded-md py-2 text-zinc-500 transition-colors hover:bg-zinc-800/50 hover:text-zinc-300"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
