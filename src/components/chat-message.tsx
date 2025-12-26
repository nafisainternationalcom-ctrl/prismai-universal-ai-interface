import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import { User, Bot, Terminal, CheckCircle2, AlertCircle, CloudSun, Search } from 'lucide-react';
import type { Message, ToolCall } from '../../worker/types';
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
      "inline-flex flex-col gap-1 p-2 rounded-lg border text-xs transition-all",
      isError 
        ? "bg-destructive/10 border-destructive/20 text-destructive-foreground" 
        : "bg-accent/30 border-accent/50 text-accent-foreground"
    )}>
      <div className="flex items-center gap-2 font-medium">
        {icon}
        <span>{label}</span>
      </div>
      {details && <div className="opacity-70 truncate max-w-[200px]">{details}</div>}
    </div>
  );
};
export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  return (
    <div className={cn("flex w-full gap-4 py-6 px-4 md:px-6 transition-colors", isUser ? "bg-background" : "bg-muted/30")}>
      <div className="flex-shrink-0 mt-1">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg shadow-sm", isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {isUser ? 'You' : 'PrismAI'}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="prose prose-zinc dark:prose-invert max-w-none prose-pre:p-0">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <div className="relative group">
                    <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Terminal size={14} className="text-muted-foreground" />
                    </div>
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-md !my-0 !bg-[#1e1e1e]"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code className={cn("bg-muted px-1.5 py-0.5 rounded text-sm font-mono", className)} {...props}>
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
          <div className="mt-4 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {message.toolCalls.map((tc) => (
              <ToolResultDisplay key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}