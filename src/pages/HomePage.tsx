import React, { useEffect, useCallback } from 'react';
import type { AppState } from '@/lib/stores';
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
import { MessageSquare, Plus, Settings, Trash2, Bot, Zap, Globe } from 'lucide-react';
import { toast } from 'sonner';
export function HomePage() {
  const activeSessionId = useAppStore(s => s.activeSessionId);
  const setActiveSessionId = useAppStore(s => s.setActiveSessionId);
  const sessions = useAppStore((state: AppState) => state.sessions);
  const setSessions = useAppStore(s => s.setSessions);
  const setSettingsOpen = useAppStore(s => s.setSettingsOpen);
  const globalConfig = useAppStore((state: AppState) => state.globalConfig);
  const setGlobalConfig = useAppStore(s => s.setGlobalConfig);
  const refreshSessions = useCallback(async () => {
    try {
      const res = await chatService.listSessions();
      if (res.success && res.data) {
        setSessions(res.data);
      }
    } catch (error) {
      console.error('Failed to refresh sessions:', error);
    }
  }, [setSessions]);
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
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar className="border-r border-border/50">
          <SidebarHeader className="border-b border-border/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <Bot size={20} />
              </div>
              <span className="font-bold text-lg tracking-tight">PrismAI</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={createNewChat}
                    className="w-full justify-start gap-2 bg-accent/50 hover:bg-accent text-accent-foreground font-medium py-6 px-4"
                  >
                    <Plus size={18} />
                    <span>New Chat</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                Recent Conversations
              </SidebarGroupLabel>
              <SidebarMenu className="px-2">
                {sessions.map((session) => (
                  <SidebarMenuItem key={session.id}>
                    <SidebarMenuButton
                      isActive={activeSessionId === session.id}
                      onClick={() => setActiveSessionId(session.id)}
                      className="group py-5 px-3 rounded-lg transition-all pr-12"
                    >
                      <MessageSquare size={16} className="text-muted-foreground" />
                      <span className="truncate flex-1">{session.title}</span>
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      onClick={(e) => deleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive right-2"
                    >
                      <Trash2 size={14} />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-border/50 p-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 py-6 px-4 hover:bg-accent/50"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings size={18} className="text-muted-foreground" />
              <span className="font-medium">Settings</span>
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col relative">
          <header className="h-14 flex items-center px-4 border-b border-border/50 bg-background/50 backdrop-blur-md z-10 sticky top-0 justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <SidebarTrigger className="mr-4" />
              <div className="font-medium text-sm text-muted-foreground truncate max-w-[200px] md:max-w-md">
                {activeSession?.title || "Select a session"}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {activeSessionId && (
                <div className="hidden sm:flex items-center gap-2">
                  <Select value={globalConfig?.model || ''} onValueChange={handleModelChange}>
                    <SelectTrigger className="h-8 text-[11px] bg-muted/50 border-none w-[180px] focus:ring-0">
                      <SelectValue placeholder="Model" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      <SelectGroup>
                        <SelectLabel className="flex items-center gap-1.5"><Zap size={10} /> Cloudflare Edge</SelectLabel>
                        {CLOUDFLARE_MODELS.map(m => (
                          <SelectItem key={m.id} value={m.id}>
                            <span className="text-xs">{m.name}</span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      {externalProviders.map(provider => (
                        <SelectGroup key={provider}>
                          <SelectLabel className="flex items-center gap-1.5 opacity-70"><Globe size={10} /> {provider}</SelectLabel>
                          {EXTERNAL_MODELS.filter(m => m.provider === provider).map(m => (
                            <SelectItem key={m.id} value={m.id}>
                              <span className="text-xs">{m.name}</span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                  {isCloudflareModel(globalConfig?.model || '') && (
                    <Badge variant="secondary" className="h-5 text-[9px] bg-primary/10 text-primary border-none font-bold uppercase tracking-tighter">
                      Ultra-Low Latency
                    </Badge>
                  )}
                </div>
              )}
              <ThemeToggle className="relative right-0 top-0" />
            </div>
          </header>
          <ChatInterface />
        </SidebarInset>
      </div>
      <SettingsModal />
      <Toaster position="top-center" richColors />
    </SidebarProvider>
  );
}