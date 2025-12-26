import React, { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/stores';
import { CLOUDFLARE_MODELS, EXTERNAL_MODELS, isCloudflareModel, chatService } from '@/lib/chat';
import { toast } from 'sonner';
import { Info, ShieldCheck, Zap, Globe, Sparkles } from 'lucide-react';
export function SettingsModal() {
  const open = useAppStore(s => s.settingsOpen);
  const setOpen = useAppStore(s => s.setSettingsOpen);
  const config = useAppStore(useShallow(s => s.globalConfig));
  const setConfig = useAppStore(s => s.setGlobalConfig);
  const activeSessionId = useAppStore(s => s.activeSessionId);
  const [form, setForm] = useState(config);
  const [activeTab, setActiveTab] = useState(isCloudflareModel(config.model || '') ? 'cloudflare' : 'byok');
  useEffect(() => {
    if (open) {
      setForm(config);
      setActiveTab(isCloudflareModel(config.model || '') ? 'cloudflare' : 'byok');
    }
  }, [open, config]);
  const handleSave = async () => {
    setConfig(form);
    if (activeSessionId) {
      await chatService.updateSessionConfig(form);
    }
    setOpen(false);
    toast.success('Nafisa configuration updated');
  };
  const selectCloudflareModel = (modelId: string) => {
    setForm({
      ...form,
      model: modelId,
      baseUrl: '',
      apiKey: ''
    });
  };
  const applyPreset = (provider: string) => {
    const preset = EXTERNAL_MODELS.find(m => m.provider === provider);
    if (preset) {
      setForm({
        ...form,
        baseUrl: preset.defaultBaseUrl || '',
        model: preset.id
      });
      toast.info(`Applied ${provider} preset`);
    }
  };
  const providers = Array.from(new Set(EXTERNAL_MODELS.map(m => m.provider)));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[540px] glass-panel border-white/10 p-0 overflow-hidden rounded-3xl">
        <div className="bg-gradient-rainbow h-1 w-full" />
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
              <div className="h-8 w-8 rounded-lg bg-gradient-rainbow flex items-center justify-center text-white shadow-lg">
                <Sparkles size={18} />
              </div>
              <span className="text-gradient-vibrant">Nafisa Workspace</span>
            </DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground/80">
              Manage your edge intelligence nodes and API gateways.
            </DialogDescription>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-accent/20 h-11 p-1 rounded-xl">
              <TabsTrigger value="cloudflare" className="rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <Zap size={14} className="mr-2" /> Native AI
              </TabsTrigger>
              <TabsTrigger value="byok" className="rounded-lg font-bold text-xs uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <ShieldCheck size={14} className="mr-2" /> BYOK Nodes
              </TabsTrigger>
            </TabsList>
            <TabsContent value="cloudflare" className="space-y-5 mt-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="rounded-2xl bg-orange-500/5 p-4 border border-orange-500/20 text-[13px] text-orange-500/80 font-medium flex gap-3">
                <Info className="shrink-0 mt-0.5" size={18} />
                <p>Native models are optimized for ultra-low latency via Cloudflare's global edge network. No external API keys required.</p>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Edge Model Selection</Label>
                <Select value={form.model} onValueChange={selectCloudflareModel}>
                  <SelectTrigger className="h-12 bg-accent/20 border-white/5 rounded-xl font-semibold">
                    <SelectValue placeholder="Select a Nafisa Native model" />
                  </SelectTrigger>
                  <SelectContent className="glass-panel border-white/10">
                    <SelectGroup>
                      <SelectLabel className="text-[10px] font-black uppercase tracking-widest text-orange-500 px-3 py-2">Edge Optimized</SelectLabel>
                      {CLOUDFLARE_MODELS.map(m => (
                        <SelectItem key={m.id} value={m.id} className="font-medium">{m.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-6 rounded-2xl border-2 border-dashed border-white/5 bg-accent/5 flex flex-col items-center justify-center text-center">
                <Badge className="mb-3 bg-orange-500/20 text-orange-500 border-none font-black uppercase tracking-widest px-4 py-1">
                  Nafisa Auto-Node
                </Badge>
                <p className="text-[11px] text-muted-foreground font-medium max-w-[240px]">
                  Internal routing and key management are handled at the Edge for maximum security.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="byok" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Gateway Presets</Label>
                <div className="flex flex-wrap gap-2">
                  {providers.map(p => (
                    <Button
                      key={p}
                      variant="outline"
                      size="sm"
                      className="h-9 px-4 text-[11px] font-bold gap-2 rounded-lg border-white/5 bg-white/5 hover:bg-indigo-600 hover:text-white transition-all"
                      onClick={() => applyPreset(p)}
                    >
                      <Globe size={14} /> {p}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 bg-accent/10 p-5 rounded-2xl border border-white/5">
                <div className="space-y-2">
                  <Label htmlFor="baseUrl" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Node Gateway URL</Label>
                  <Input
                    id="baseUrl"
                    placeholder="https://api.openai.com/v1"
                    className="h-11 bg-background/50 border-white/10 rounded-xl"
                    value={form.baseUrl}
                    onChange={e => setForm({...form, baseUrl: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Secure API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-���•••••••••••••••"
                    className="h-11 bg-background/50 border-white/10 rounded-xl"
                    value={form.apiKey}
                    onChange={e => setForm({...form, apiKey: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Target Intelligence Node</Label>
                  <div className="flex gap-2">
                    <Select value={form.model} onValueChange={m => setForm({...form, model: m})}>
                      <SelectTrigger className="flex-1 h-11 bg-background/50 border-white/10 rounded-xl font-bold">
                        <SelectValue placeholder="Preset" />
                      </SelectTrigger>
                      <SelectContent className="glass-panel border-white/10">
                        {providers.map(p => (
                          <SelectGroup key={p}>
                            <SelectLabel className="text-[10px] font-black uppercase tracking-widest opacity-50 px-3">{p}</SelectLabel>
                            {EXTERNAL_MODELS.filter(m => m.provider === p).map(m => (
                              <SelectItem key={m.id} value={m.id} className="font-medium">{m.name}</SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="w-1/3 h-11 bg-background/50 border-white/10 rounded-xl font-mono text-[11px]"
                      placeholder="Custom ID"
                      value={form.model}
                      onChange={e => setForm({...form, model: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter className="bg-accent/20 p-6 flex gap-3 border-t border-white/5">
          <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl font-bold h-11 px-6">Discard</Button>
          <Button onClick={handleSave} className="bg-gradient-rainbow text-white px-10 h-11 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all">
            Save Config
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}