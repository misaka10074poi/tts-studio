import { create } from 'zustand';

export type WorkspaceMode = 'builtin' | 'clone';

interface WorkspaceState {
  mode: WorkspaceMode;
  setMode: (mode: WorkspaceMode) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  mode: 'builtin',
  setMode: (mode) => set({ mode }),
}));
