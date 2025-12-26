import React, { useEffect, useCallback } from 'react';
import { ChatInterface } from '@/components/chat-interface';
import { SettingsModal } from '@/components/settings-modal';
import { useAppStore } from '@/lib/stores';
import { chatService } from '@/lib/chat';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SidebarHeader, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarGroupLabel, SidebarMenuAction, Sidebar, SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { MessageSquare, Plus, Settings, Trash2, Bot } from 'lucide-react';
export function HomePage() {
  const activeSessionId = useAppStore(s => s.activeSessionId);
  const setActiveSessionId = useAppStore(s => s.setActiveSessionId);
  const sessions = useAppStore(s => s.sessions);
  const setSessions = useAppStore(s => s.setSessions);
  const setSettingsOpen = useAppStore(s => s.setSettingsOpen);
  const refreshSessions = useCallback(async () => {
    const res = await chatService.listSessions();
    if (res.success && res.data) {
      setSessions(res.data);
    }
  }, [setSessions]);
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);
  const createNewChat = async () => {
    const res = await chatService.createSession();
    if (res.success && res.data) {
      setActiveSessionId(res.data.sessionId);
      await refreshSessions();
    }
  };
  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await chatService.deleteSession(id);
    if (res.success) {
      if (activeSessionId === id) setActiveSessionId(null);
      await refreshSessions();
    }
  };
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
                  <SidebarMenuButton onClick={createNewChat} className="w-full justify-start gap-2 bg-accent/50 hover:bg-accent text-accent-foreground font-medium py-6 px-4">
                    <Plus size={18} />
                    <span>New Chat</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Recent Conversations</SidebarGroupLabel>
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
            <Button variant="ghost" className="w-full justify-start gap-3 py-6 px-4 hover:bg-accent/50" onClick={() => setSettingsOpen(true)}>
              <Settings size={18} className="text-muted-foreground" />
              <span className="font-medium">Settings</span>
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col relative">
          <header className="h-14 flex items-center px-4 border-b border-border/50 bg-background/50 backdrop-blur-md z-10 sticky top-0 justify-between">
            <div className="flex items-center min-w-0">
              <SidebarTrigger className="mr-4" />
              <div className="font-medium text-sm text-muted-foreground truncate">
                {sessions.find(s => s.id === activeSessionId)?.title || "Select a session"}
              </div>
            </div>
            <ThemeToggle className="relative right-0 top-0" />
          </header>
          <ChatInterface />
        </SidebarInset>
      </div>
      <SettingsModal />
      <Toaster position="top-center" richColors />
    </SidebarProvider>
  );
}