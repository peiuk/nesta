declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    FILES: R2Bucket;
    ADMIN_EMAIL?: string;
    SITE_ORIGIN?: string;
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
