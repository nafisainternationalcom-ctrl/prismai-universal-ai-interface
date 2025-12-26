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
    model: '@cf/meta/llama-3.1-8b-instruct',
    config: {}
  };
  async onStart(): Promise<void> {
    const config = this.state.config ?? {};
    const baseUrl = config.baseUrl || this.env.CF_AI_BASE_URL || '';
    const apiKey = config.apiKey || this.env.CF_AI_API_KEY || '';
    const model = config.model || this.state.model;
    if (!baseUrl?.startsWith('http') || !apiKey || baseUrl.includes('YOUR') || apiKey === 'YOUR_API_KEY') {
      console.warn(`[ChatAgent] Invalid AI config for session ${this.id}. BaseUrl: ${baseUrl}`);
      return;
    }
    try {
      this.chatHandler = new ChatHandler(baseUrl, apiKey, model);
    } catch (e) {
      console.error(`[ChatAgent] Initialization failed for session ${this.id}:`, e);
    }
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
      const updatedConfig = { ...this.state.config, ...config };
      const newModel = config.model || this.state.model;
      this.setState({
        ...this.state,
        config: updatedConfig,
        model: newModel
      });
      const fullConfig = {
        baseUrl: updatedConfig.baseUrl || this.env.CF_AI_BASE_URL || '',
        apiKey: updatedConfig.apiKey || this.env.CF_AI_API_KEY || '',
        model: newModel
      };
      if (fullConfig.baseUrl.startsWith('http') && fullConfig.apiKey) {
        if (!this.chatHandler) {
          this.chatHandler = new ChatHandler(fullConfig.baseUrl, fullConfig.apiKey, fullConfig.model);
        } else {
          this.chatHandler.updateConfig(fullConfig);
        }
      }
      return Response.json({ success: true, data: this.state });
    }
    if (method === 'DELETE' && url.pathname === '/clear') {
      this.setState({ ...this.state, messages: [] });
      return Response.json({ success: true, data: this.state });
    }
    return Response.json({ success: false, error: API_RESPONSES.NOT_FOUND }, { status: 404 });
  }
  private async handleChatMessage(body: { message: string; stream?: boolean; model?: string }): Promise<Response> {
    const { message, stream, model } = body;
    if (!message?.trim()) {
      return Response.json({ success: false, error: API_RESPONSES.MISSING_MESSAGE }, { status: 400 });
    }
    // Force model synchronization if missing or changed
    const targetModel = model || this.state.model;
    if (targetModel !== this.state.model) {
      this.setState({ ...this.state, model: targetModel });
    }
    if (!this.chatHandler) {
      // Lazy attempt to recover handler if it failed at onStart due to empty config
      await this.onStart();
      if (!this.chatHandler) {
        return Response.json({
          success: false,
          error: 'AI Node configuration invalid. Check your API key and Base URL in settings.'
        }, { status: 503 });
      }
    }
    // Ensure model is updated in handler before processing
    this.chatHandler.updateModel(targetModel);
    const userMsg = createMessage('user', message.trim());
    this.setState({
      ...this.state,
      messages: [...this.state.messages, userMsg],
      isProcessing: true
    });
    try {
      if (stream) {
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = createEncoder();
        let streamingMessage = '';
        (async () => {
          try {
            this.setState({ ...this.state, streamingMessage: '' });
            const response = await this.chatHandler!.processMessage(
              message,
              this.state.messages.slice(0, -1),
              (chunk) => {
                streamingMessage += chunk;
                this.setState({ ...this.state, streamingMessage });
                writer.write(encoder.encode(chunk));
              }
            );
            const assistantMsg = createMessage('assistant', response.content, response.toolCalls);
            this.setState({
              ...this.state,
              messages: [...this.state.messages, assistantMsg],
              isProcessing: false,
              streamingMessage: ''
            });
          } catch (e) {
            console.error('[ChatAgent] Streaming error:', e);
            writer.write(encoder.encode(`\n\n[Error]: Node connection failure. ${String(e)}`));
            this.setState({ ...this.state, isProcessing: false, streamingMessage: '' });
          } finally {
            writer.close();
          }
        })();
        return createStreamResponse(readable);
      }
      const response = await this.chatHandler!.processMessage(message, this.state.messages.slice(0, -1));
      const assistantMsg = createMessage('assistant', response.content, response.toolCalls);
      this.setState({
        ...this.state,
        messages: [...this.state.messages, assistantMsg],
        isProcessing: false
      });
      return Response.json({ success: true, data: this.state });
    } catch (error) {
      console.error('[ChatAgent] Processing error:', error);
      this.setState({ ...this.state, isProcessing: false });
      return Response.json({ success: false, error: String(error) || API_RESPONSES.PROCESSING_ERROR }, { status: 500 });
    }
  }
}