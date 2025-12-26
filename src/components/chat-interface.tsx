import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Sparkles, Zap, Cpu, Terminal, Globe, MousePointer2 } from 'lucide-react';
import { ChatMessage } from './chat-message';
import { chatService, CLOUDFLARE_MODELS, isCloudflareModel, getModelLabel } from '@/lib/chat';
import { useAppStore } from '@/lib/stores';
import type { Message } from '../../worker/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
export function ChatInterface() {
  const activeSessionId = useAppStore(s => s.activeSessionId);
  const globalConfig = useAppStore(useShallow(s => s.globalConfig));
  const setGlobalConfig = useAppStore(s => s.setGlobalConfig);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSyncedConfig = useRef<string | null>(null);
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
      const configStr = JSON.stringify(globalConfig);
      if (lastSyncedConfig.current !== configStr) {
        chatService.updateSessionConfig(globalConfig);
        lastSyncedConfig.current = configStr;
      }
    } else {
      setMessages([]);
      lastSyncedConfig.current = null;
    }
  }, [activeSessionId, globalConfig, loadMessages]);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent]);
  const handleSend = async () => {
    const userPrompt = input.trim();
    if (!userPrompt || isLoading || !activeSessionId) return;
    setInput('');
    setIsLoading(true);
    setStreamingContent('');
    const tempUserMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userPrompt,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    const res = await chatService.sendMessage(userPrompt, globalConfig.model, (chunk) => {
      setStreamingContent(prev => prev + chunk);
    });
    if (res.success) {
      await loadMessages();
    } else {
      toast.error(res.error || 'Connection interrupted');
    }
    setStreamingContent('');
    setIsLoading(false);
  };
  const startWithModel = async (modelId: string) => {
    const isCF = isCloudflareModel(modelId);
    const newConfig = {
      ...globalConfig,
      model: modelId,
      ...(isCF ? { baseUrl: '', apiKey: '' } : {})
    };
    setGlobalConfig(newConfig);
    if (activeSessionId) {
      await chatService.updateSessionConfig(newConfig);
    }
    toast.info(`Nafisa initialized with ${getModelLabel(modelId)}`);
  };
  if (!activeSessionId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <div className="h-28 w-28 bg-gradient-rainbow rounded-[2.5rem] flex items-center justify-center text-white rotate-6 shadow-2xl shadow-orange-500/40 relative z-10 animate-float-slow">
            <Sparkles size={56} />
          </div>
          <div className="absolute -inset-4 bg-orange-500/20 blur-3xl rounded-full animate-pulse-glow" />
        </motion.div>
        <div className="space-y-4 max-w-lg relative z-10">
          <h2 className="text-5xl font-black tracking-tighter text-gradient-vibrant">Nafisa AI Edge</h2>
          <p className="text-muted-foreground text-lg font-medium leading-relaxed px-4">
            Experience the future of universal AI. Low latency, high precision, running entirely at the edge.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl relative z-10">
          {CLOUDFLARE_MODELS.slice(0, 3).map((m, idx) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * idx }} className="aspect-[4/3] md:aspect-auto">
              <Button
                variant="outline"
                className="h-full w-full py-6 px-6 flex-col gap-4 bg-background/40 backdrop-blur-md border-white/5 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all group rounded-3xl shadow-soft"
                onClick={() => {
                  chatService.createSession(m.name).then(res => {
                    if (res.success && res.data) {
                      useAppStore.getState().setActiveSessionId(res.data.sessionId);
                      startWithModel(m.id);
                    }
                  });
                }}
              >
                <div className="bg-orange-500/10 p-4 rounded-2xl text-orange-500 group-hover:scale-110 group-hover:bg-orange-500/20 transition-all duration-300">
                  {m.category === 'Coding' ? <Terminal size={24} /> : <Cpu size={24} />}
                </div>
                <div className="text-center space-y-1">
                  <div className="text-sm font-bold tracking-tight">{m.name}</div>
                  <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{m.category}</div>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative">
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 space-y-2">
          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}
          <AnimatePresence>
            {streamingContent && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <ChatMessage message={{ id: 'streaming', role: 'assistant', content: streamingContent, timestamp: Date.now() }} />
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={scrollRef} className="h-40" />
        </div>
      </ScrollArea>
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-background via-background/95 to-transparent z-20">
        <div className="max-w-3xl mx-auto relative">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-rainbow rounded-3xl blur opacity-10 group-focus-within:opacity-25 transition duration-500" />
            <div className="relative flex items-end gap-3 bg-background/60 backdrop-blur-3xl border border-white/10 rounded-2xl p-2 shadow-2xl">
              <Textarea
                placeholder={`Ask Nafisa AI anything about ${getModelLabel(globalConfig.model || '')}...`}
                className="flex-1 min-h-[50px] max-h-48 bg-transparent border-0 focus-visible:ring-0 resize-none py-4 px-5 text-sm font-medium placeholder:text-muted-foreground/50"
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
                className="mb-2 mr-2 rounded-xl shrink-0 h-11 w-11 bg-gradient-rainbow text-white shadow-lg shadow-orange-500/20 active:scale-90 transition-transform disabled:opacity-50"
                disabled={isLoading || !input.trim()}
                onClick={handleSend}
              >
                <Send size={20} />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 px-2">
            <div className="flex items-center gap-3">
               {isCloudflareModel(globalConfig.model || '') ? (
                 <Badge variant="outline" className="text-[10px] h-5 bg-orange-500/10 border-orange-500/20 text-orange-500 flex gap-1.5 items-center px-2 font-black uppercase tracking-tight">
                   <Zap size={10} fill="currentColor" /> Native Edge
                 </Badge>
               ) : (
                 <Badge variant="outline" className="text-[10px] h-5 flex gap-1.5 items-center px-2 border-indigo-500/30 text-indigo-500 bg-indigo-500/5 font-black uppercase tracking-tight">
                   <Globe size={10} /> External Provider
                 </Badge>
               )}
               <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
               <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.15em]">Secure TLS 1.3</span>
            </div>
            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -8, 0], scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.2, ease: "easeInOut" }}
                      className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]"
                    />
                  ))}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Nafisa Thinking</span>
              </div>
            )}
          </div>
        </div>
        <p className="text-[9px] text-center mt-6 text-muted-foreground/40 font-medium">
          Note: High AI demand may cause intermittent latency. Limit 50 req/min.
        </p>
      </div>
    </div>
  );
}