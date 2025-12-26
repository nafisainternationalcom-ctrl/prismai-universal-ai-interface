import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Sparkles, AlertCircle } from 'lucide-react';
import { ChatMessage } from './chat-message';
import { chatService } from '@/lib/chat';
import { useAppStore } from '@/lib/stores';
import type { Message } from '../../worker/types';
export function ChatInterface() {
  const activeSessionId = useAppStore(s => s.activeSessionId);
  const globalConfig = useAppStore(s => s.globalConfig);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (activeSessionId) {
      chatService.switchSession(activeSessionId);
      loadMessages();
      // Use dedicated config endpoint instead of sending a dummy message
      chatService.updateSessionConfig(globalConfig);
    } else {
      setMessages([]);
    }
  }, [activeSessionId, globalConfig]);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent]);
  const loadMessages = async () => {
    const res = await chatService.getMessages();
    if (res.success && res.data) {
      setMessages(res.data.messages);
    }
  };
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
    }
    setStreamingContent('');
    setIsLoading(false);
  };
  if (!activeSessionId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <Sparkles size={32} />
        </div>
        <h2 className="text-2xl font-bold">Welcome to PrismAI</h2>
        <p className="text-muted-foreground max-w-sm">Create a new chat or select one from the sidebar to begin your journey.</p>
      </div>
    );
  }
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
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
            <div className="relative flex items-end gap-2 bg-secondary/80 backdrop-blur-sm border border-input rounded-xl p-2 shadow-sm">
              <Textarea
                placeholder="Message PrismAI..."
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
                className="mb-1 rounded-lg shrink-0 h-9 w-9"
                disabled={isLoading || !input.trim()}
                onClick={handleSend}
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-2 px-4">
            <AlertCircle size={10} className="inline mr-1 mb-0.5" />
            Requests may be limited during high traffic. Bring Your Own Key (BYOK) for higher limits.
          </p>
        </div>
      </div>
    </div>
  );
}