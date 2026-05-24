'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useUiStore } from '@/stores/ui.store';
import {
  LayoutDashboard,
  Boxes,
  Rocket,
  Shield,
  Activity,
  AlertTriangle,
  ScrollText,
  Settings,
  Plus,
} from 'lucide-react';

export function CommandPalette() {
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, setOpen]);

  const navigate = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => navigate('/app/dashboard')}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => navigate('/app/services')}>
            <Boxes className="mr-2 h-4 w-4" />
            Services
          </CommandItem>
          <CommandItem onSelect={() => navigate('/app/deployments')}>
            <Rocket className="mr-2 h-4 w-4" />
            Deployments
          </CommandItem>
          <CommandItem onSelect={() => navigate('/app/security')}>
            <Shield className="mr-2 h-4 w-4" />
            Security
          </CommandItem>
          <CommandItem onSelect={() => navigate('/app/observability')}>
            <Activity className="mr-2 h-4 w-4" />
            Observability
          </CommandItem>
          <CommandItem onSelect={() => navigate('/app/incidents')}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Incidents
          </CommandItem>
          <CommandItem onSelect={() => navigate('/app/audit')}>
            <ScrollText className="mr-2 h-4 w-4" />
            Audit Trail
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => navigate('/app/services/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Service
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => navigate('/app/settings/workspace')}>
            <Settings className="mr-2 h-4 w-4" />
            Workspace Settings
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
