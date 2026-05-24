import { create } from 'zustand';

interface UiState {
  sidebarCollapsed: boolean;
  commandOpen: boolean;
  workspaceSlug: string | null;

  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setCommandOpen: (v: boolean) => void;
  setWorkspaceSlug: (slug: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  commandOpen: false,
  workspaceSlug: null,

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setCommandOpen: (v) => set({ commandOpen: v }),
  setWorkspaceSlug: (slug) => set({ workspaceSlug: slug }),
}));
