import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CLOUDFLARE_MODELS, EXTERNAL_MODELS } from '@/lib/chat';
import { Zap, ShieldCheck, Cpu } from 'lucide-react';
export function TemplateDemo() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-full bg-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="text-primary" size={20} />
            <CardTitle>Welcome to PrismAI</CardTitle>
          </div>
          <CardDescription>
            A high-performance universal AI interface running on Cloudflare Workers.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          PrismAI combines the speed of Cloudflare Workers AI with the flexibility of Bring Your Own Key (BYOK) providers. 
          Select a model below or in the settings to start.
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Cpu size={16} /> Cloudflare Models
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {CLOUDFLARE_MODELS.slice(0, 4).map((model) => (
            <div key={model.id} className="flex items-center justify-between text-xs">
              <span>{model.name}</span>
              <Badge variant="outline" className="text-[10px] py-0">{model.category}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ShieldCheck size={16} /> BYOK Support
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {EXTERNAL_MODELS.map((model) => (
            <div key={model.id} className="flex items-center justify-between text-xs">
              <span>{model.name}</span>
              <span className="text-muted-foreground italic">{model.provider}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}