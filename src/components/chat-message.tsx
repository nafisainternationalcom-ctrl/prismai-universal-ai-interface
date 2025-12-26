import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import { User, Sparkles, Terminal, CheckCircle2, AlertCircle, CloudSun, Search, Copy, Check } from 'lucide-react';
import type { Message, ToolCall } from '../../worker/types';
import { useState } from 'react';
interface ChatMessageProps {
  message: Message;
}
const ToolResultDisplay = ({ toolCall }: { toolCall: ToolCall }) => {
  const result = toolCall.result as any;
  const isError = result && typeof result === 'object' && 'error' in result;
  let icon = <CheckCircle2 size={12} />;
  let label = `Executed: ${toolCall.name}`;
  let details = '';
  if (isError) {
    icon = <AlertCircle size={12} className="text-destructive" />;
    label = `Error: ${toolCall.name}`;
    details = result.error;
  } else if (toolCall.name === 'get_weather' && result) {
    icon = <CloudSun size={12} />;
    label = `Weather: ${result.location}`;
    details = `${result.temperature}°C, ${result.condition}`;
  } else if (toolCall.name === 'web_search' && result) {
    icon = <Search size={12} />;
    label = `Search: ${toolCall.arguments.query || 'Web'}`;
    details = result.content ? result.content.slice(0, 80) + '...' : 'Success';
  } else if (result && result.content) {
    details = result.content.slice(0, 60) + '...';
  }
  return (
    <div className={cn(
      "inline-flex flex-col gap-1 p-2.5 rounded-xl border text-xs transition-all glass-panel",
      isError
        ? "border-destructive/30 text-destructive-foreground bg-destructive/5"
        : "border-white/10 text-accent-foreground"
    )}>
      <div className="flex items-center gap-2 font-bold uppercase tracking-tight">
        <div className={cn("p-1 rounded-md", isError ? "bg-destructive/20" : "bg-primary/10")}>
          {icon}
        </div>
        <span>{label}</span>
      </div>
      {details && <div className="opacity-60 truncate max-w-[240px] pl-7 italic">{details}</div>}
    </div>
  );
};
export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className={cn(
      "flex w-full gap-4 md:gap-6 py-8 px-4 md:px-8 transition-all group border-b border-transparent hover:border-white/5",
      isUser ? "bg-transparent" : "bg-accent/10 backdrop-blur-sm rounded-3xl"
    )}>
      <div className="flex-shrink-0 mt-1">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl shadow-lg transition-transform group-hover:scale-110",
          isUser 
            ? "bg-secondary text-secondary-foreground border border-white/5" 
            : "bg-gradient-rainbow text-white"
        )}>
          {isUser ? <User size={20} /> : <Sparkles size={20} />}
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={cn("text-sm font-black uppercase tracking-widest", isUser ? "text-muted-foreground" : "text-gradient-vibrant")}>
              {isUser ? 'Human' : 'Nafisa AI'}
            </span>
            <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span className="text-[10px] text-muted-foreground font-medium">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-sm md:prose-p:text-base prose-pre:p-0 prose-pre:bg-transparent">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');
                return !inline && match ? (
                  <div className="relative group/code my-4 overflow-hidden rounded-xl border border-white/10 glass-panel">
                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Terminal size={12} className="text-muted-foreground" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{match[1]}</span>
                      </div>
                      <button 
                        onClick={() => handleCopy(codeString)}
                        className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-muted-foreground"
                      >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      className="!p-4 !m-0 !bg-[#0a0a0a] text-sm"
                      {...props}
                    >
                      {codeString}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code className={cn("bg-accent/50 px-1.5 py-0.5 rounded text-xs font-mono border border-white/5", className)} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {message.toolCalls.map((tc) => (
              <ToolResultDisplay key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}