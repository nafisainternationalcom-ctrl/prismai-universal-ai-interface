import { Agent } from 'agents';
import type { Env } from './core-utils';
import type { ChatState, ProviderConfig } from './types';
import { ChatHandler } from './chat';
import { API_RESPONSES } from './config';
import { createMessage, createStreamResponse, createEncoder } from './utils';
export class ChatAgent extends Agent<Env, ChatState> {
  private chatHandler?: ChatHandler;
  initialState: ChatState = {
    messages: [],
    sessionId: '',
    isProcessing: false,
    model: 'google-ai-studio/gemini-2.5-flash',
    config: {}
  };
  async onStart(): Promise<void> {
    this.chatHandler = new ChatHandler(
      this.state.config?.baseUrl || this.env.CF_AI_BASE_URL,
      this.state.config?.apiKey || this.env.CF_AI_API_KEY,
      this.state.config?.model || this.state.model
    );
  }
  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    if (method === 'GET' && url.pathname === '/messages') {
      return Response.json({ success: true, data: this.state });
    }
    if (method === 'POST' && url.pathname === '/chat') {
      return this.handleChatMessage(await request.json());
    }
    if (method === 'POST' && url.pathname === '/config') {
      const config = await request.json() as ProviderConfig;
      this.setState({ ...this.state, config: { ...this.state.config, ...config } });
      if (config.model) this.setState({ ...this.state, model: config.model });
      this.chatHandler?.updateConfig(this.state.config!);
      return Response.json({ success: true, data: this.state });
    }
    if (method === 'DELETE' && url.pathname === '/clear') {
      this.setState({ ...this.state, messages: [] });
      return Response.json({ success: true, data: this.state });
    }
    return Response.json({ success: false, error: API_RESPONSES.NOT_FOUND }, { status: 404 });
  }
  private async handleChatMessage(body: { message: string; stream?: boolean }): Promise<Response> {
    const { message, stream } = body;
    if (!message?.trim()) return Response.json({ success: false, error: API_RESPONSES.MISSING_MESSAGE }, { status: 400 });
    const userMsg = createMessage('user', message.trim());
    this.setState({ ...this.state, messages: [...this.state.messages, userMsg], isProcessing: true });
    try {
      if (stream) {
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = createEncoder();
        (async () => {
          try {
            this.setState({ ...this.state, streamingMessage: '' });
            const response = await this.chatHandler!.processMessage(message, this.state.messages.slice(0, -1), (chunk) => {
              this.setState({ ...this.state, streamingMessage: (this.state.streamingMessage || '') + chunk });
              writer.write(encoder.encode(chunk));
            });
            const assistantMsg = createMessage('assistant', response.content, response.toolCalls);
            this.setState({ ...this.state, messages: [...this.state.messages, assistantMsg], isProcessing: false, streamingMessage: '' });
          } catch (e) {
            writer.write(encoder.encode("Error processing stream."));
            this.setState({ ...this.state, isProcessing: false, streamingMessage: '' });
          } finally {
            writer.close();
          }
        })();
        return createStreamResponse(readable);
      }
      const response = await this.chatHandler!.processMessage(message, this.state.messages.slice(0, -1));
      const assistantMsg = createMessage('assistant', response.content, response.toolCalls);
      this.setState({ ...this.state, messages: [...this.state.messages, assistantMsg], isProcessing: false });
      return Response.json({ success: true, data: this.state });
    } catch (error) {
      this.setState({ ...this.state, isProcessing: false });
      return Response.json({ success: false, error: API_RESPONSES.PROCESSING_ERROR }, { status: 500 });
    }
  }
}