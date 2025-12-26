# Cloudflare AI Chat Agent Template

[![Deploy to Cloudflare]([![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/nafisainternationalcom-ctrl/prismai-universal-ai-interface))]([![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/nafisainternationalcom-ctrl/prismai-universal-ai-interface))

A production-ready, full-stack AI chat application powered by Cloudflare Workers. Features persistent chat sessions using Durable Objects, streaming AI responses, tool calling (weather, web search, MCP tools), and a modern React UI with session management.

## ✨ Key Features

- **Multi-Session Chat**: Persistent conversations stored in Durable Objects with automatic session listing, creation, deletion, and title updates.
- **AI-Powered**: Integrated with Cloudflare AI Gateway (OpenAI-compatible) supporting Gemini models with streaming and tool calling.
- **Tools & Functions**: Built-in tools for weather, web search (SerpAPI), URL fetching, and extensible MCP (Model Context Protocol) server integration.
- **Modern UI**: Responsive React app with shadcn/ui components, Tailwind CSS, dark mode, sidebar navigation, and real-time streaming.
- **Session Management**: RESTful APIs for sessions (`/api/sessions`), model switching, and chat state persistence.
- **Production-Ready**: Type-safe TypeScript, error handling, CORS, logging, and Cloudflare observability.
- **Zero-Cold-Start**: Agents SDK for efficient Durable Object routing.

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Lucide React, TanStack Query, React Router, Zustand, Framer Motion
- **Backend**: Cloudflare Workers, Hono, Durable Objects, Agents SDK (`@cloudflare/agents`), OpenAI SDK
- **AI & Tools**: Cloudflare AI Gateway, SerpAPI, MCP SDK (`@modelcontextprotocol/sdk`)
- **Build Tools**: Bun, Wrangler, esbuild
- **UI Libraries**: Radix UI, Tailwind Animate, Sonner (toasts)

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) installed
- Cloudflare account with [Workers AI Gateway](https://developers.cloudflare.com/ai-gateway/) configured
- [SerpAPI key](https://serpapi.com/) (optional, for web search)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd <project-name>
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Configure environment variables in `wrangler.jsonc`:
   ```json
   "vars": {
     "CF_AI_BASE_URL": "https://gateway.ai.cloudflare.com/v1/YOUR_ACCOUNT_ID/YOUR_GATEWAY_ID/openai",
     "CF_AI_API_KEY": "your-gateway-api-key",
     "SERPAPI_KEY": "your-serpapi-key",
     "OPENROUTER_API_KEY": "your-openrouter-key-if-used" // optional
   }
   ```

4. Generate Worker types:
   ```bash
   bun run cf-typegen
   ```

### Development

1. Start the dev server:
   ```bash
   bun run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) (or your configured port).

3. Edit `src/pages/HomePage.tsx` for custom UI or extend `worker/userRoutes.ts` and `worker/agent.ts` for backend logic.

### Usage Examples

- **Create new chat session**:
  ```bash
  curl -X POST /api/sessions \
    -H "Content-Type: application/json" \
    -d '{"firstMessage": "Hello AI!"}'
  ```

- **Send message** (via UI or API):
  ```
  POST /api/chat/<sessionId>/chat
  {"message": "What's the weather in London?", "stream": true}
  ```

- **List sessions**: `GET /api/sessions`
- **Switch models**: `POST /api/chat/<sessionId>/model {"model": "google-ai-studio/gemini-2.5-pro"}`

The UI provides a full chat interface with session sidebar, model selector, and streaming responses.

## ☁️ Deployment

1. Build the assets:
   ```bash
   bun run build
   ```

2. Deploy to Cloudflare Workers:
   ```bash
   bun run deploy
   ```

3. Or use the one-click deploy:

[![Deploy to Cloudflare]([![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/nafisainternationalcom-ctrl/prismai-universal-ai-interface))]([![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/nafisainternationalcom-ctrl/prismai-universal-ai-interface))

Your app will be live at `https://your-worker.your-subdomain.workers.dev` with automatic asset bundling and SPA routing.

**Post-Deployment**:
- Set vars in Cloudflare Dashboard > Workers > Your Worker > Settings > Variables.
- Enable Durable Objects in the dashboard if needed.
- Monitor with Cloudflare Observability.

## 🧪 Testing & Customization

- **Frontend**: Edit `src/pages/HomePage.tsx` and components in `src/components/`.
- **Backend Routes**: Add to `worker/userRoutes.ts`.
- **AI Logic**: Extend `worker/chat.ts` or `worker/tools.ts`.
- **Tools**: Add custom tools in `worker/tools.ts` or configure MCP servers in `worker/mcp-client.ts`.
- **Lint**: `bun run lint`
- **Type Check**: `bun tsc --noEmit`

## 🤝 Contributing

1. Fork the repo.
2. Create a feature branch (`bun install`).
3. Commit changes (`bun run lint`).
4. Open a Pull Request.

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

## 🚀 Next Steps

- Integrate more MCP tools.
- Add authentication (e.g., Cloudflare Access).
- Extend with custom agents or workflows.
- Deploy to custom domain.

Built with ❤️ for Cloudflare Workers. Questions? [Cloudflare Workers Discord](https://discord.gg/cloudflaredev).