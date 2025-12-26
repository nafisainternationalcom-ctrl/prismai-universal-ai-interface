import type { Message, ChatState, ToolCall, SessionInfo, ProviderConfig } from '../../worker/types';
export interface ChatResponse {
  success: boolean;
  data?: ChatState;
  error?: string;
}
export const CLOUDFLARE_MODELS = [
  { id: '@cf/meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', category: 'General' },
  { id: '@cf/meta/llama-3-8b-instruct', name: 'Llama 3 8B', category: 'General' },
  { id: '@cf/mistral/mistral-7b-instruct-v0.2', name: 'Mistral 7B v0.2', category: 'General' },
  { id: '@cf/google/gemma-2-9b-it', name: 'Gemma 2 9B', category: 'General' },
  { id: '@cf/qwen/qwen2.5-7b-instruct', name: 'Qwen 2.5 7B', category: 'General' },
  { id: '@cf/microsoft/phi-3.5-mini-instruct', name: 'Phi 3.5 Mini', category: 'Lightweight' },
  { id: '@cf/deepseek-ai/deepseek-coder-6.7b-instruct', name: 'DeepSeek Coder 6.7B', category: 'Coding' },
];
export const EXTERNAL_MODELS = [
  // Groq
  { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', provider: 'Groq', defaultBaseUrl: 'https://api.groq.com/openai/v1' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B', provider: 'Groq', defaultBaseUrl: 'https://api.groq.com/openai/v1' },
  // Together AI
  { id: 'meta-llama/Llama-3.1-405B-Instruct-Turbo', name: 'Llama 3.1 405B', provider: 'Together AI', defaultBaseUrl: 'https://api.together.xyz/v1' },
  { id: 'mistralai/Mixtral-8x22B-Instruct-v0.1', name: 'Mixtral 8x22B', provider: 'Together AI', defaultBaseUrl: 'https://api.together.xyz/v1' },
  // Fireworks
  { id: 'accounts/fireworks/models/mixtral-8x22b-instruct', name: 'Mixtral 8x22B', provider: 'Fireworks', defaultBaseUrl: 'https://api.fireworks.ai/inference/v1' },
  // DeepInfra
  { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct', name: 'Llama 3.1 70B', provider: 'DeepInfra', defaultBaseUrl: 'https://api.deepinfra.com/v1/openai' },
  // OpenAI & Anthropic (OpenRouter defaults)
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', defaultBaseUrl: 'https://api.openai.com/v1' },
  { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', defaultBaseUrl: 'https://openrouter.ai/api/v1' },
];
export const getModelLabel = (modelId: string): string => {
  const cfModel = CLOUDFLARE_MODELS.find(m => m.id === modelId);
  if (cfModel) return cfModel.name;
  const extModel = EXTERNAL_MODELS.find(m => m.id === modelId);
  if (extModel) return extModel.name;
  return modelId.split('/').pop() || modelId;
};
export const isCloudflareModel = (modelId: string): boolean => {
  return modelId.startsWith('@cf/') || CLOUDFLARE_MODELS.some(m => m.id === modelId);
};
class ChatService {
  private sessionId: string;
  private baseUrl: string;
  constructor() {
    this.sessionId = crypto.randomUUID();
    this.baseUrl = `/api/chat/${this.sessionId}`;
  }
  async updateSessionConfig(config: ProviderConfig): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to update session config:', error);
      return { success: false, error: 'Failed to update session config' };
    }
  }
  async sendMessage(
    message: string,
    model?: string,
    onChunk?: (chunk: string) => void
  ): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, model, stream: !!onChunk }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Unknown error'}`);
      }
      if (onChunk && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            if (chunk) onChunk(chunk);
          }
        } finally {
          reader.releaseLock();
        }
        return { success: true };
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to send message:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to send message' };
    }
  }
  async getMessages(): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get messages:', error);
      return { success: false, error: 'Failed to load messages' };
    }
  }
  async clearMessages(): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/clear`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to clear messages:', error);
      return { success: false, error: 'Failed to clear messages' };
    }
  }
  getSessionId(): string { return this.sessionId; }
  newSession(): void {
    this.sessionId = crypto.randomUUID();
    this.baseUrl = `/api/chat/${this.sessionId}`;
  }
  switchSession(sessionId: string): void {
    this.sessionId = sessionId;
    this.baseUrl = `/api/chat/${sessionId}`;
  }
  async createSession(title?: string, sessionId?: string, firstMessage?: string): Promise<{ success: boolean; data?: { sessionId: string; title: string }; error?: string }> {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, sessionId, firstMessage })
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to create session' };
    }
  }
  async listSessions(): Promise<{ success: boolean; data?: SessionInfo[]; error?: string }> {
    try {
      const response = await fetch('/api/sessions');
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to list sessions' };
    }
  }
  async deleteSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to delete session' };
    }
  }
  async updateSessionTitle(sessionId: string, title: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/title`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to update session title' };
    }
  }
  async clearAllSessions(): Promise<{ success: boolean; data?: { deletedCount: number }; error?: string }> {
    try {
      const response = await fetch('/api/sessions', { method: 'DELETE' });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to clear all sessions' };
    }
  }
}
export const chatService = new ChatService();
export const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};