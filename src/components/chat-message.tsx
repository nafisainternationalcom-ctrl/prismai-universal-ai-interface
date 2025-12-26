import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import { User, Bot, Terminal } from 'lucide-react';
import type { Message } from '../../worker/types';
interface ChatMessageProps {
  message: Message;
}
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
          <div className="mt-4 flex flex-wrap gap-2">
            {message.toolCalls.map((tc) => (
              <div key={tc.id} className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-accent/50 text-accent-foreground text-xs border border-accent">
                <Terminal size={12} />
                <span>Executed: {tc.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}