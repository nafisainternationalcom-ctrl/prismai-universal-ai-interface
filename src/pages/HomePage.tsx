import React, { useEffect, useCallback, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ChatInterface } from '@/components/chat-interface';
import { SettingsModal } from '@/components/settings-modal';
import { useAppStore } from '@/lib/stores';
import { chatService, CLOUDFLARE_MODELS, EXTERNAL_MODELS, getModelLabel, isCloudflareModel } from '@/lib/chat';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  SidebarHeader, SidebarContent, SidebarGroup, SidebarMenu,
  SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarGroupLabel,
  SidebarMenuAction, Sidebar, SidebarProvider, SidebarInset, SidebarTrigger
} from '@/components/ui/sidebar';
import {
  Select, SelectContent, SelectGroup, SelectItem,
  SelectLabel, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, Settings, Trash2, Zap, Globe, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
export function HomePage() {
  const activeSessionId = useAppStore(s => s.activeSessionId);
  const setActiveSessionId = useAppStore(s => s.setActiveSessionId);
  const sessions = useAppStore(useShallow(s => s.sessions));
  const setSessions = useAppStore(s => s.setSessions);
  const setSettingsOpen = useAppStore(s => s.setSettingsOpen);
  const globalConfig = useAppStore(useShallow(s => s.globalConfig));
  const setGlobalConfig = useAppStore(s => s.setGlobalConfig);
  const initialLoadDone = useRef(false);
  const refreshSessions = useCallback(async () => {
    try {
      const res = await chatService.listSessions();
      if (res.success && res.data) {
        setSessions(res.data);
        if (activeSessionId && !initialLoadDone.current) {
          const exists = res.data.some(s => s.id === activeSessionId);
          if (!exists) {
            setActiveSessionId(null);
          }
          initialLoadDone.current = true;
        }
      }
    } catch (error) {
      console.error('Failed to refresh sessions:', error);
    }
  }, [activeSessionId, setActiveSessionId, setSessions]);
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);
  const createNewChat = async () => {
    try {
      const res = await chatService.createSession();
      if (res.success && res.data) {
        setActiveSessionId(res.data.sessionId);
        await refreshSessions();
      }
    } catch (error) {
      toast.error('Failed to create new chat');
    }
  };
  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await chatService.deleteSession(id);
      if (res.success) {
        if (activeSessionId === id) setActiveSessionId(null);
        await refreshSessions();
      }
    } catch (error) {
      toast.error('Failed to delete session');
    }
  };
  const handleModelChange = async (newModelId: string) => {
    const isCF = isCloudflareModel(newModelId);
    const preset = EXTERNAL_MODELS.find(m => m.id === newModelId);
    const newConfig = {
      ...globalConfig,
      model: newModelId,
      ...(isCF ? { baseUrl: '', apiKey: '' } : (preset ? { baseUrl: preset.defaultBaseUrl } : {}))
    };
    setGlobalConfig(newConfig);
    if (activeSessionId) {
      await chatService.updateSessionConfig(newConfig);
      toast.success(`Switched to ${getModelLabel(newModelId)}`);
    }
  };
  const activeSession = sessions.find(s => s.id === activeSessionId);
  const externalProviders = Array.from(new Set(EXTERNAL_MODELS.map(m => m.provider)));
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden bg-background relative">
        <div className="absolute inset-0 particle-overlay pointer-events-none opacity-40 z-0" />
        <Sidebar className="border-r border-white/5 bg-background/80 backdrop-blur-2xl z-10 shadow-xl">
          <SidebarHeader className="border-b border-white/5 px-6 py-6">
            <div className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-rainbow flex items-center justify-center text-white shadow-lg shadow-orange-500/30 animate-float-slow">
                <Sparkles size={22} className="group-hover:rotate-12 transition-transform duration-500" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight leading-none text-gradient-vibrant">Nafisa AI</span>
                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1.5 opacity-70">International</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup className="px-3 pt-5">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={createNewChat}
                    className="w-full justify-start gap-3 bg-gradient-rainbow text-white hover:opacity-90 font-bold py-7 px-5 rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.97] overflow-hidden relative group/btn"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                    <Plus size={20} className="relative z-10" />
                    <span className="relative z-10">Start New Journey</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="px-6 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50 mb-3">
                Recent Sessions
              </SidebarGroupLabel>
              <SidebarMenu className="px-3 space-y-1.5">
                {sessions.map((session) => (
                  <SidebarMenuItem key={session.id} className="relative group/item">
                    <SidebarMenuButton
                      isActive={activeSessionId === session.id}
                      onClick={() => setActiveSessionId(session.id)}
                      className={cn(
                        "py-6 px-4 rounded-xl transition-all relative pr-12",
                        activeSessionId === session.id
                          ? "bg-accent/50 border border-white/5 shadow-inner"
                          : "hover:bg-accent/30 border border-transparent"
                      )}
                    >
                      <MessageSquare size={16} className={cn("shrink-0", activeSessionId === session.id ? "text-orange-500" : "text-muted-foreground/60")} />
                      <span className="truncate font-semibold text-sm ml-2">{session.title}</span>
                    </SidebarMenuButton>
                    <button
                      onClick={(e) => deleteSession(session.id, e)}
                      className="opacity-0 group-hover/item:opacity-100 transition-all hover:text-destructive right-4 top-1/2 -translate-y-1/2 absolute p-1.5 hover:bg-destructive/10 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-white/5 p-4 bg-accent/5">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 py-6 px-4 hover:bg-white/10 rounded-xl transition-all group"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings size={18} className="text-muted-foreground group-hover:rotate-90 transition-transform duration-500" />
              <span className="font-bold text-sm">Workspace Settings</span>
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col relative bg-transparent z-10">
          <header className="h-16 flex items-center px-6 border-b border-border/40 bg-background/50 backdrop-blur-3xl z-20 sticky top-0 justify-between">
            <div className="flex items-center min-w-0 flex-1 gap-4">
              <SidebarTrigger className="h-9 w-9 bg-accent/30 hover:bg-accent/50 rounded-lg transition-colors shadow-sm" />
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-none mb-1.5">Active Session</span>
                <div className="font-bold text-sm truncate max-w-[200px] md:max-w-md">
                  {activeSession?.title || "Select a session"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-5">
              {activeSessionId && (
                <div className="hidden lg:flex items-center gap-4">
                  <div className="relative group">
                    <div className={cn(
                      "absolute -inset-0.5 rounded-xl blur-sm opacity-20 group-hover:opacity-40 transition duration-500 animate-pulse-glow",
                      isCloudflareModel(globalConfig?.model || '') ? "bg-gradient-to-r from-orange-500 to-rose-500" : "bg-indigo-500"
                    )} />
                    <Select value={globalConfig?.model || ''} onValueChange={handleModelChange}>
                      <SelectTrigger className="h-10 text-[11px] font-black bg-background/60 border-white/10 w-[220px] rounded-xl focus:ring-2 ring-orange-500/20 transition-all uppercase tracking-wider">
                        <SelectValue placeholder="Model" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[400px] glass-panel border-white/10 rounded-2xl shadow-2xl">
                        <SelectGroup>
                          <SelectLabel className="flex items-center gap-2 text-[10px] uppercase tracking-tighter text-orange-500 font-black px-4 py-2 border-b border-white/5 mb-2"><Zap size={12} fill="currentColor" /> Cloudflare Edge</SelectLabel>
                          {CLOUDFLARE_MODELS.map(m => (
                            <SelectItem key={m.id} value={m.id} className="text-xs font-bold focus:bg-orange-500/10 focus:text-orange-500 rounded-lg mx-1 my-0.5">
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        {externalProviders.map(provider => (
                          <SelectGroup key={provider}>
                            <SelectLabel className="flex items-center gap-2 text-[10px] uppercase tracking-tighter opacity-70 font-black mt-3 px-4 py-2 border-b border-white/5 mb-2"><Globe size={12} /> {provider}</SelectLabel>
                            {EXTERNAL_MODELS.filter(m => m.provider === provider).map(m => (
                              <SelectItem key={m.id} value={m.id} className="text-xs font-bold focus:bg-indigo-500/10 focus:text-indigo-500 rounded-lg mx-1 my-0.5">
                                {m.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {isCloudflareModel(globalConfig?.model || '') && (
                    <Badge className="h-7 text-[10px] bg-orange-500/15 text-orange-500 border-none font-black uppercase tracking-widest px-4 shadow-sm animate-pulse">
                      Lumina Speed
                    </Badge>
                  )}
                </div>
              )}
              <div className="h-10 w-[1px] bg-border/40 hidden sm:block mx-1" />
              <ThemeToggle className="relative right-0 top-0 h-10 w-10 bg-accent/30 hover:bg-accent/50 rounded-xl shadow-sm" />
            </div>
          </header>
          <main className="flex-1 overflow-hidden">
            <ChatInterface />
          </main>
        </SidebarInset>
      </div>
      <SettingsModal />
      <Toaster position="top-center" richColors theme="dark" closeButton />
    </SidebarProvider>
  );
}