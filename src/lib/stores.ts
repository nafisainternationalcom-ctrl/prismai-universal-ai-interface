import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionInfo, ProviderConfig } from '../../worker/types';
interface AppState {
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
        model: 'google-ai-studio/gemini-2.5-flash'
      },
      setActiveSessionId: (id) => set({ activeSessionId: id }),
      setSessions: (sessions) => set({ sessions }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSettingsOpen: (open) => set({ settingsOpen: open }),
      setGlobalConfig: (config) => set((state) => ({ globalConfig: { ...state.globalConfig, ...config } })),
    }),
    {
      name: 'prismai-storage',
      partialize: (state) => ({ globalConfig: state.globalConfig }),
    }
  )
);