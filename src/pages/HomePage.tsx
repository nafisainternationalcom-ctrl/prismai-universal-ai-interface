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
        // Validate persisted session ID
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
        <Sidebar className="border-r border-border/50 bg-background/80 backdrop-blur-md z-10">
          <SidebarHeader className="border-b border-border/50 px-6 py-5">
            <div className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-rainbow flex items-center justify-center text-white shadow-lg shadow-orange-500/20 animate-float-slow">
                <Sparkles size={22} className="group-hover:rotate-12 transition-transform" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight leading-none text-gradient-vibrant">Nafisa AI</span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-1">International</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup className="px-3 pt-4">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={createNewChat}
                    className="w-full justify-start gap-3 bg-gradient-rainbow text-white hover:opacity-90 font-semibold py-7 px-4 rounded-xl shadow-md transition-all active:scale-[0.98]"
                  >
                    <Plus size={20} />
                    <span>Start New Journey</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">
                Recent Sessions
              </SidebarGroupLabel>
              <SidebarMenu className="px-3 space-y-1">
                {sessions.map((session) => (
                  <SidebarMenuItem key={session.id}>
                    <SidebarMenuButton
                      isActive={activeSessionId === session.id}
                      onClick={() => setActiveSessionId(session.id)}
                      className={cn(
                        "group py-6 px-4 rounded-xl transition-all relative pr-12 overflow-hidden",
                        activeSessionId === session.id
                          ? "bg-accent/50 border border-white/5 shadow-sm"
                          : "hover:bg-accent/30"
                      )}
                    >
                      <MessageSquare size={16} className={cn("shrink-0", activeSessionId === session.id ? "text-orange-500" : "text-muted-foreground")} />
                      <span className="truncate font-medium text-sm ml-1">{session.title}</span>
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      onClick={(e) => deleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-all hover:text-destructive right-3 top-1/2 -translate-y-1/2 absolute"
                    >
                      <Trash2 size={14} />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-border/50 p-3 bg-accent/10">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 py-6 px-4 hover:bg-white/5 rounded-xl transition-colors"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings size={18} className="text-muted-foreground" />
              <span className="font-semibold text-sm">Workspace Settings</span>
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col relative bg-transparent z-10">
          <header className="h-16 flex items-center px-6 border-b border-border/40 bg-background/40 backdrop-blur-2xl z-20 sticky top-0 justify-between">
            <div className="flex items-center min-w-0 flex-1 gap-4">
              <SidebarTrigger className="h-9 w-9 bg-accent/20 hover:bg-accent/40 rounded-lg transition-colors" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold leading-none mb-1">Active Session</span>
                <div className="font-semibold text-sm truncate max-w-[200px] md:max-w-md">
                  {activeSession?.title || "Select a session"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {activeSessionId && (
                <div className="hidden lg:flex items-center gap-3">
                  <div className="relative group">
                    <div className={cn(
                      "absolute -inset-0.5 rounded-lg blur opacity-20 group-hover:opacity-40 transition animate-pulse-glow",
                      isCloudflareModel(globalConfig?.model || '') ? "bg-gradient-to-r from-orange-500 to-rose-500" : "bg-indigo-500"
                    )} />
                    <Select value={globalConfig?.model || ''} onValueChange={handleModelChange}>
                      <SelectTrigger className="h-9 text-[11px] font-bold bg-background/50 border-white/5 w-[200px] rounded-lg focus:ring-1 ring-orange-500/50">
                        <SelectValue placeholder="Model" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[400px] glass-panel border-white/10">
                        <SelectGroup>
                          <SelectLabel className="flex items-center gap-2 text-[10px] uppercase tracking-tighter text-orange-500 font-black"><Zap size={12} /> Cloudflare Edge</SelectLabel>
                          {CLOUDFLARE_MODELS.map(m => (
                            <SelectItem key={m.id} value={m.id} className="text-xs font-medium focus:bg-orange-500/10 focus:text-orange-500">
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        {externalProviders.map(provider => (
                          <SelectGroup key={provider}>
                            <SelectLabel className="flex items-center gap-2 text-[10px] uppercase tracking-tighter opacity-70 font-black mt-2"><Globe size={12} /> {provider}</SelectLabel>
                            {EXTERNAL_MODELS.filter(m => m.provider === provider).map(m => (
                              <SelectItem key={m.id} value={m.id} className="text-xs font-medium focus:bg-indigo-500/10 focus:text-indigo-500">
                                {m.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {isCloudflareModel(globalConfig?.model || '') && (
                    <Badge className="h-6 text-[10px] bg-orange-500/10 text-orange-500 border-none font-black uppercase tracking-tight px-3">
                      Lumina Speed
                    </Badge>
                  )}
                </div>
              )}
              <div className="h-9 w-[1px] bg-border/40 hidden sm:block mx-1" />
              <ThemeToggle className="relative right-0 top-0 h-9 w-9 bg-accent/20 hover:bg-accent/40 rounded-lg" />
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