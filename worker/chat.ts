import OpenAI from 'openai';
import type { Message, ToolCall, ProviderConfig } from './types';
import { getToolDefinitions, executeTool } from './tools';
import { ChatCompletionMessageFunctionToolCall } from 'openai/resources/index.mjs';
export class ChatHandler {
  private client: OpenAI;
  private model: string;
  private baseUrl: string;
  private apiKey: string;
  constructor(defaultBaseUrl: string, defaultApiKey: string, model: string) {
    this.baseUrl = defaultBaseUrl;
    this.apiKey = defaultApiKey;
    this.model = model;
    if (!this.baseUrl?.startsWith('http') || !this.apiKey) {
      throw new Error('Invalid OpenAI config: baseUrl must start with http and apiKey required');
    }
    this.client = new OpenAI({
      baseURL: this.baseUrl,
      apiKey: this.apiKey
    });
  }
  updateConfig(config: ProviderConfig): void {
    let changed = false;
    if (config.baseUrl && config.baseUrl !== this.baseUrl) {
      this.baseUrl = config.baseUrl;
      changed = true;
    }
    if (config.apiKey && config.apiKey !== this.apiKey) {
      this.apiKey = config.apiKey;
      changed = true;
    }
    if (config.model && config.model !== this.model) {
      this.model = config.model;
      changed = true;
    }
    if (changed) {
      if (!this.baseUrl?.startsWith('http') || !this.apiKey) {
        throw new Error('Invalid config update');
      }
      this.client = new OpenAI({
        baseURL: this.baseUrl,
        apiKey: this.apiKey
      });
    }
  }
  async processMessage(
    message: string,
    conversationHistory: Message[],
    onChunk?: (chunk: string) => void
  ): Promise<{
    content: string;
    toolCalls?: ToolCall[];
  }> {
    const messages = this.buildConversationMessages(message, conversationHistory);
    const toolDefinitions = await getToolDefinitions();
    if (onChunk) {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools: toolDefinitions.length > 0 ? toolDefinitions : undefined,
        tool_choice: toolDefinitions.length > 0 ? 'auto' : undefined,
        max_completion_tokens: 4096,
        stream: true,
      });
      return this.handleStreamResponse(stream, message, conversationHistory, onChunk);
    }
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages,
      tools: toolDefinitions.length > 0 ? toolDefinitions : undefined,
      tool_choice: toolDefinitions.length > 0 ? 'auto' : undefined,
      max_tokens: 4096,
      stream: false
    });
    return this.handleNonStreamResponse(completion, message, conversationHistory);
  }
  private async handleStreamResponse(
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
    message: string,
    conversationHistory: Message[],
    onChunk: (chunk: string) => void
  ) {
    let fullContent = '';
    const toolCallMap = new Map<number, ChatCompletionMessageFunctionToolCall>();
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        fullContent += delta.content;
        onChunk(delta.content);
      }
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (tc.index !== undefined) {
            let toolCall = toolCallMap.get(tc.index);
            if (!toolCall) {
              toolCall = {
                id: tc.id || '',
                type: 'function',
                function: { name: tc.function?.name || '', arguments: '' }
              };
              toolCallMap.set(tc.index, toolCall);
            }
            if (tc.function?.arguments) {
              toolCall.function.arguments += tc.function.arguments;
            }
          }
        }
      }
    }
    const accumulatedToolCalls = Array.from(toolCallMap.values());
    if (accumulatedToolCalls.length > 0) {
      const executedTools = await this.executeToolCalls(accumulatedToolCalls);
      const finalResponse = await this.generateToolResponse(message, conversationHistory, accumulatedToolCalls as any[], executedTools);
      return { content: finalResponse, toolCalls: executedTools };
    }
    return { content: fullContent };
  }
  private async handleNonStreamResponse(
    completion: OpenAI.Chat.Completions.ChatCompletion,
    message: string,
    conversationHistory: Message[]
  ) {
    const responseMessage = completion.choices[0]?.message;
    if (!responseMessage) return { content: 'Node returned empty response.' };
    if (responseMessage.tool_calls) {
      const toolCalls = await this.executeToolCalls(responseMessage.tool_calls as ChatCompletionMessageFunctionToolCall[]);
      const finalResponse = await this.generateToolResponse(message, conversationHistory, responseMessage.tool_calls as any[], toolCalls);
      return { content: finalResponse, toolCalls };
    }
    return { content: responseMessage.content || '' };
  }
  private async executeToolCalls(openAiToolCalls: ChatCompletionMessageFunctionToolCall[]): Promise<ToolCall[]> {
    return Promise.all(openAiToolCalls.map(async (tc) => {
      let args = {};
      let functionName = 'unknown';
      try {
        if (tc.function?.name) functionName = tc.function.name;
        args = JSON.parse(tc.function?.arguments || '{}');
      } catch (e) {
        console.error(`Failed to parse tool arguments for ${functionName}:`, e);
      }
      const result = await executeTool(functionName, args);
      return { id: tc.id, name: functionName, arguments: args, result };
    }));
  }
  private async generateToolResponse(userMsg: string, history: Message[], calls: any[], results: ToolCall[]): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: 'You are Nafisa AI. Respond concisely based on the provided tool results.' },
        ...history.slice(-10).map(m => ({ role: m.role as any, content: m.content })),
        { role: 'user', content: userMsg },
        { role: 'assistant', content: null, tool_calls: calls },
        ...results.map((r) => ({ role: 'tool' as const, content: JSON.stringify(r.result), tool_call_id: r.id }))
      ]
    });
    return completion.choices[0]?.message?.content || '';
  }
  private buildConversationMessages(userMessage: string, history: Message[]) {
    return [
      { 
        role: 'system' as const, 
        content: 'You are Nafisa AI, a sophisticated and helpful universal AI interface developed for high-performance edge computing. Help the user with their queries accurately and maintain a professional yet engaging persona.' 
      },
      ...history.slice(-15).map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userMessage }
    ];
  }
  updateModel(newModel: string): void {
    if (!newModel) return;
    if (newModel !== this.model) {
      this.model = newModel;
      this.client = new OpenAI({
        baseURL: this.baseUrl,
        apiKey: this.apiKey
      });
    }
  }
}