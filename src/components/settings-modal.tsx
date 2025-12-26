import React, { useState, useEffect } from 'react';
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
import { Info, ShieldCheck, Zap } from 'lucide-react';
export function SettingsModal() {
  const open = useAppStore(s => s.settingsOpen);
  const setOpen = useAppStore(s => s.setSettingsOpen);
  const config = useAppStore(s => s.globalConfig);
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
    toast.success('Configuration saved');
  };
  const selectCloudflareModel = (modelId: string) => {
    setForm({
      ...form,
      model: modelId,
      baseUrl: '', // Signals backend to use env defaults
      apiKey: ''
    });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            AI Workspace Settings
          </DialogTitle>
          <DialogDescription>
            Configure your preferred AI models and API providers.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="py-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cloudflare" className="flex items-center gap-1.5">
              <Zap size={14} /> Cloudflare AI
            </TabsTrigger>
            <TabsTrigger value="byok" className="flex items-center gap-1.5">
              <ShieldCheck size={14} /> External (BYOK)
            </TabsTrigger>
          </TabsList>
          <TabsContent value="cloudflare" className="space-y-4 pt-4">
            <div className="rounded-lg bg-accent/30 p-3 border border-accent/50 text-xs text-muted-foreground flex gap-2">
              <Info className="shrink-0 text-primary" size={16} />
              <p>Built-in models run instantly on Cloudflare Workers AI. No API key or extra setup required.</p>
            </div>
            <div className="grid gap-2">
              <Label>Model Selection</Label>
              <Select value={form.model} onValueChange={selectCloudflareModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a Cloudflare model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Workers AI Models</SelectLabel>
                    {CLOUDFLARE_MODELS.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4 p-4 rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center text-center">
              <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20">
                Automatic Setup
              </Badge>
              <p className="text-[11px] text-muted-foreground">
                Base URL and API Key are handled internally.
              </p>
            </div>
          </TabsContent>
          <TabsContent value="byok" className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                placeholder="https://api.openai.com/v1"
                value={form.baseUrl}
                onChange={e => setForm({...form, baseUrl: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={form.apiKey}
                onChange={e => setForm({...form, apiKey: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model">Model Name</Label>
              <Input
                id="model"
                placeholder="gpt-4o"
                value={form.model}
                onChange={e => setForm({...form, model: e.target.value})}
              />
            </div>
            <div className="pt-2">
              <Label className="text-xs text-muted-foreground">External Presets</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {EXTERNAL_MODELS.map(m => (
                  <Button 
                    key={m.id} 
                    variant="outline" 
                    size="sm" 
                    className="text-[10px] h-7 px-2"
                    onClick={() => setForm({ ...form, model: m.id })}
                  >
                    {m.name}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter className="pt-4">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground">Save Preferences</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}