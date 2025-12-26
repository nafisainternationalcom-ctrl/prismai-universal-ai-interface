import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/lib/stores';
import { toast } from 'sonner';
const PRESETS = [
  { name: 'Cloudflare AI (Default)', baseUrl: '', model: 'google-ai-studio/gemini-2.5-flash' },
  { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o' },
  { name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: 'anthropic/claude-3.5-sonnet' },
  { name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama3-70b-8192' },
];
export function SettingsModal() {
  const open = useAppStore(s => s.settingsOpen);
  const setOpen = useAppStore(s => s.setSettingsOpen);
  const config = useAppStore(s => s.globalConfig);
  const setConfig = useAppStore(s => s.setGlobalConfig);
  const [form, setForm] = useState(config);
  const handleSave = () => {
    setConfig(form);
    setOpen(false);
    toast.success('Configuration saved');
  };
  const applyPreset = (presetName: string) => {
    const preset = PRESETS.find(p => p.name === presetName);
    if (preset) {
      setForm({ ...form, baseUrl: preset.baseUrl, model: preset.model });
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>AI Provider Settings</DialogTitle>
          <DialogDescription>
            Bring your own API key to connect to any OpenAI-compatible provider.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Presets</Label>
            <Select onValueChange={applyPreset}>
              <SelectTrigger>
                <SelectValue placeholder="Select a preset" />
              </SelectTrigger>
              <SelectContent>
                {PRESETS.map(p => (
                  <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}