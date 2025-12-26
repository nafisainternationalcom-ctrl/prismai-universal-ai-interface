import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Sparkles, AlertCircle, Zap, Cpu, Terminal } from 'lucide-react';
import { ChatMessage } from './chat-message';
import { chatService, CLOUDFLARE_MODELS, isCloudflareModel, getModelLabel } from '@/lib/chat';
import { useAppStore } from '@/lib/stores';
import type { Message } from '../../worker/types';
import { toast } from 'sonner';
export function ChatInterface() {
  const activeSessionId = useAppStore(s => s.activeSessionId);
  const globalConfig = useAppStore(s => s.globalConfig);
  const setGlobalConfig = useAppStore(s => s.setGlobalConfig);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadMessages = useCallback(async () => {
    const res = await chatService.getMessages();
    if (res.success && res.data) {
      setMessages(res.data.messages);
    }
  }, []);
  useEffect(() => {
    if (activeSessionId) {
      chatService.switchSession(activeSessionId);
      loadMessages();
      // Sync global config to session whenever session or config changes
      chatService.updateSessionConfig(globalConfig);
    } else {
      setMessages([]);
    }
  }, [activeSessionId, globalConfig, loadMessages]);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent]);
  const handleSend = async () => {
    if (!input.trim() || isLoading || !activeSessionId) return;
    const userPrompt = input.trim();
    setInput('');
    setIsLoading(true);
    setStreamingContent('');
    const tempUserMsg: Message = { id: crypto.randomUUID(), role: 'user', content: userPrompt, timestamp: Date.now() };
    setMessages(prev => [...prev, tempUserMsg]);
    const res = await chatService.sendMessage(userPrompt, globalConfig.model, (chunk) => {
      setStreamingContent(prev => prev + chunk);
    });
    if (res.success) {
      await loadMessages();
    } else {
      toast.error(res.error || 'Failed to send message');
    }
    setStreamingContent('');
    setIsLoading(false);
  };
  const startWithModel = async (modelId: string) => {
    const isCF = isCloudflareModel(modelId);
    const newConfig = { ...globalConfig, model: modelId, ...(isCF ? { baseUrl: '', apiKey: '' } : {}) };
    setGlobalConfig(newConfig);
    if (activeSessionId) {
      await chatService.updateSessionConfig(newConfig);
    }
    toast.info(`Using ${getModelLabel(modelId)}`);
  };
  if (!activeSessionId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary rotate-3">
          <Sparkles size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">PrismAI Edge</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">Select a model to start a high-speed conversation powered by Cloudflare.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
          {CLOUDFLARE_MODELS.slice(0, 3).map(m => (
            <Button 
              key={m.id} 
              variant="outline" 
              className="h-auto py-4 px-4 flex-col gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all group"
              onClick={() => {
                chatService.createSession(m.name).then(res => {
                  if (res.success && res.data) {
                    useAppStore.getState().setActiveSessionId(res.data.sessionId);
                    startWithModel(m.id);
                  }
                });
              }}
            >
              <div className="bg-primary/10 p-2 rounded-lg text-primary group-hover:scale-110 transition-transform">
                {m.category === 'Coding' ? <Terminal size={18} /> : <Cpu size={18} />}
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold">{m.name}</div>
                <div className="text-[10px] text-muted-foreground">{m.category}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    );
  }
  const isByok = globalConfig.apiKey && globalConfig.apiKey.length > 5;
  return (
    <div className="flex-1 flex flex-col h-full bg-background relative">
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto pb-32">
          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}
          {streamingContent && (
            <ChatMessage message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingContent,
              timestamp: Date.now()
            }} />
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-indigo-500 rounded-2xl blur opacity-10 group-focus-within:opacity-25 transition duration-500"></div>
            <div className="relative flex items-end gap-2 bg-secondary/60 backdrop-blur-xl border border-input/50 rounded-2xl p-2 shadow-sm">
              <Textarea
                placeholder={`Message ${getModelLabel(globalConfig.model || '')}...`}
                className="flex-1 min-h-[44px] max-h-48 bg-transparent border-0 focus-visible:ring-0 resize-none py-3 px-4"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                size="icon"
                className="mb-1 rounded-xl shrink-0 h-10 w-10 shadow-lg shadow-primary/20"
                disabled={isLoading || !input.trim()}
                onClick={handleSend}
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 px-1">
            <div className="flex items-center gap-2">
               {isCloudflareModel(globalConfig.model || '') ? (
                 <Badge variant="outline" className="text-[9px] h-4 bg-primary/5 border-primary/20 text-primary flex gap-1 items-center px-1.5">
                   <Zap size={8} /> Cloudflare Edge
                 </Badge>
               ) : (
                 <Badge variant="outline" className="text-[9px] h-4 flex gap-1 items-center px-1.5 border-indigo-500/30 text-indigo-500 bg-indigo-500/5">
                   <Globe size={8} className="mr-1" /> BYOK Provider
                 </Badge>
               )}
            </div>
            {!isByok && !isCloudflareModel(globalConfig.model || '') && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <AlertCircle size={10} className="text-amber-500" />
                Missing API Key
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}