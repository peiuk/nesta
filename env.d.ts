declare module '*.sql?raw' {
  const content: string;
  export default content;
}

declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    FILES: R2Bucket;
    ADMIN_EMAIL?: string;
    SITE_ORIGIN?: string;
    SESSION_SECRET?: string;
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    GMAIL_REFRESH_TOKEN?: string;
    GMAIL_USER?: string;
  }
}

type WebMcpToolResult = Record<string, unknown> | { error: string };

interface ModelContext {
  registerTool(
    def: {
      name: string;
      description: string;
      inputSchema: {
        type: 'object';
        properties: Record<string, never>;
        additionalProperties: false;
      };
      annotations?: { readOnlyHint?: boolean };
      execute: (args?: Record<string, unknown>) => Promise<WebMcpToolResult> | WebMcpToolResult;
    },
    options?: { signal?: AbortSignal },
  ): Promise<void> | void;
}

interface Document {
  modelContext?: ModelContext;
}
