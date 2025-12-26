import React from "react";
import { Home, Layers, Compass, Star, Sparkles } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarSeparator,
  SidebarInput,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
export function AppSidebar(): JSX.Element {
  return (
    <Sidebar className="border-r border-white/5 bg-background/50 backdrop-blur-xl">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-rainbow flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Sparkles size={18} />
          </div>
          <span className="text-sm font-black uppercase tracking-widest text-gradient-vibrant">Nafisa Workspace</span>
        </div>
        <div className="px-2 mt-2">
          <SidebarInput placeholder="Search sessions..." className="bg-accent/20 border-white/5 h-9" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="px-2">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive>
                <a href="#" className="gap-3"><Home size={18} /> <span className="font-semibold">Dashboard</span></a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="#" className="gap-3"><Layers size={18} /> <span className="font-semibold">Projects</span></a>
              </SidebarMenuButton>
              <SidebarMenuAction>
                <Star className="size-4" />
              </SidebarMenuAction>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="#" className="gap-3"><Compass size={18} /> <span className="font-semibold">Explore AI</span></a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator className="bg-white/5 mx-4" />
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">Quick Access</SidebarGroupLabel>
          <SidebarMenu className="px-2">
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="#" className="gap-3"><Star size={18} /> <span className="font-semibold">Starred</span></a>
              </SidebarMenuButton>
              <SidebarMenuBadge className="bg-orange-500/10 text-orange-500 border-none font-bold">5</SidebarMenuBadge>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-white/5">
        <div className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Nafisa AI v2.4 Edge</div>
      </SidebarFooter>
    </Sidebar>
  );
}