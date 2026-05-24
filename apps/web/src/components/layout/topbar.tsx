'use client';

import { useSession, useLogout } from '@/hooks/use-auth';
import { useUiStore } from '@/stores/ui.store';
import { Breadcrumbs } from './breadcrumbs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  PanelLeft,
  Search,
  LogOut,
  User,
} from 'lucide-react';

export function Topbar() {
  const { data: session } = useSession();
  const logout = useLogout();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-400 hover:text-zinc-200"
          onClick={toggleSidebar}
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-2">
        {/* Workspace indicator */}
        <div className="hidden items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 sm:flex">
          <span>acme-corp</span>
        </div>

        {/* Command palette trigger */}
        <Button
          variant="outline"
          size="sm"
          className="hidden h-8 gap-2 border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 md:flex"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="h-3 w-3" />
          <span>Search...</span>
          <kbd className="ml-2 rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-[10px] font-mono text-zinc-500">
            ⌘K
          </kbd>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-zinc-800 text-xs text-zinc-300">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 border-zinc-800 bg-zinc-900">
            <div className="px-2 py-1.5">
              <p className="text-sm text-zinc-200">{user?.name ?? 'User'}</p>
              <p className="text-xs text-zinc-500">{user?.email}</p>
            </div>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem className="text-zinc-400 focus:bg-zinc-800 focus:text-zinc-200">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              className="text-zinc-400 focus:bg-zinc-800 focus:text-zinc-200"
              onClick={() => logout.mutate()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
