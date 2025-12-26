import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SessionInfo, ProviderConfig } from '../../worker/types';
export interface AppState {
  activeSessionId: string | null;
  sessions: SessionInfo[];
  sidebarOpen: boolean;
  settingsOpen: boolean;
  globalConfig: ProviderConfig;
  setActiveSessionId: (id: string | null) => void;
  setSessions: (sessions: SessionInfo[]) => void;
  setSidebarOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setGlobalConfig: (config: ProviderConfig) => void;
}
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeSessionId: null,
      sessions: [],
      sidebarOpen: true,
      settingsOpen: false,
      globalConfig: {
        baseUrl: '',
        apiKey: '',
        model: '@cf/meta/llama-3.1-8b-instruct'
      },
      setActiveSessionId: (id) => set({ activeSessionId: id }),
      setSessions: (sessions) => set({ sessions }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSettingsOpen: (open) => set({ settingsOpen: open }),
      setGlobalConfig: (config) => set((state) => ({
        globalConfig: { ...state.globalConfig, ...config }
      })),
    }),
    {
      name: 'nafisa-ai-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        globalConfig: state.globalConfig,
        sidebarOpen: state.sidebarOpen,
        activeSessionId: state.activeSessionId
      }),
    }
  )
);