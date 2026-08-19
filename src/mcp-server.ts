/**
 * Shared MCP server factory for Axcient x360Recover.
 *
 * This module is **side-effect free** (importing it never starts a transport)
 * so it can be reused by every entrypoint. One factory serves BOTH protocol
 * eras via the v2 SDK serving entries: legacy 2025-era clients (classic
 * `initialize` handshake) statelessly per request, and modern 2026-07-28
 * envelope clients natively.
 *
 * Statelessness is a protocol invariant here: `tools/list` returns the same
 * module-scope TOOLS array (by reference, deterministic order) for every
 * caller, every era, every request. No sessions, no per-user variance.
 *
 * No elicitation is wired up: x360Recover's tool surface has no destructive
 * actions and no name-based create/ambiguous-search flows (every write takes
 * an explicit numeric ID), so none of the skill's §2.8 elicitation triggers
 * apply here.
 */
import { Server } from "@modelcontextprotocol/server";
import type { McpServerFactory } from "@modelcontextprotocol/server";
import { AxcientClient } from "@wyre-technology/node-axcient";
import { handleToolCall } from "./handlers/index.js";
import { errorResult } from "./handlers/results.js";
import { TOOLS } from "./tools.js";
import { logger } from "./utils/logger.js";

export const SERVER_NAME = "axcient-mcp";
export const SERVER_VERSION = "1.0.0";

/** Exact gateway header name (matches conduit vendor-config headerMapping). */
export const GATEWAY_HEADERS = ["X-Axcient-Api-Key"] as const;

export function buildCredentials(apiKey: string | undefined): { apiKey?: string; error?: string } {
  if (!apiKey) {
    return { error: "Missing credential: X-Axcient-Api-Key (or AXCIENT_API_KEY in env mode)" };
  }
  return { apiKey };
}

/** Resolve per-request gateway credentials from a (lowercased) header accessor. */
export function resolveGatewayCredentials(
  getHeader: (lowerName: string) => string | undefined
): { apiKey?: string; error?: string } {
  return buildCredentials(getHeader("x-axcient-api-key"));
}

/** Resolve env-mode credentials from AXCIENT_API_KEY. */
export function resolveEnvCredentials(
  env: Record<string, string | undefined> = process.env
): { apiKey?: string; error?: string } {
  return buildCredentials(env.AXCIENT_API_KEY);
}

/**
 * Bind createMcpServer into the McpServerFactory shape the v2 HTTP serving
 * entry (createMcpHandler) consumes. The factory runs once per HTTP request —
 * the fresh-instance-per-request stateless idiom — for BOTH protocol eras.
 *
 * In gateway mode the request's headers are read from ctx.requestInfo,
 * keeping credentials bound per request. Missing headers are answered 401 by
 * the HTTP layer BEFORE serving ever starts — the factory itself never
 * throws (a throwing factory would surface as a 500).
 */
export function makeMcpServerFactory(options: { gatewayMode: boolean }): McpServerFactory {
  return (ctx) => {
    if (options.gatewayMode) {
      const { apiKey } = resolveGatewayCredentials(
        (name) => ctx.requestInfo?.headers.get(name) ?? undefined
      );
      return createMcpServer(apiKey);
    }
    const { apiKey } = resolveEnvCredentials();
    return createMcpServer(apiKey);
  };
}

// ── Pure request-handler bodies (exported for tests) ───────────────────────

export function listToolsResult(): { tools: typeof TOOLS } {
  // By reference, never rebuilt/sorted/filtered — deterministic for every caller.
  return { tools: TOOLS };
}

/**
 * Create a fresh MCP server. Called once for stdio, per-request for HTTP.
 * The API key may be absent (e.g. env mode without vars): `tools/list` still
 * serves the full deterministic surface; `tools/call` answers a clear
 * isError result instead of throwing.
 */
export function createMcpServer(apiKey?: string): Server {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } }
  );

  let client: AxcientClient | undefined;

  server.setRequestHandler("tools/list", async () => listToolsResult());

  server.setRequestHandler("tools/call", async (request) => {
    const { name, arguments: args } = request.params;
    logger.debug("Tool call received", { tool: name });

    if (!apiKey) {
      return errorResult(
        "Missing Axcient API key. Set AXCIENT_API_KEY (env mode) or send the " +
          "X-Axcient-Api-Key gateway header."
      );
    }
    try {
      client ??= new AxcientClient({ apiKey });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return errorResult(`Invalid Axcient API key: ${message}`);
    }

    return handleToolCall(client, name, (args ?? {}) as Record<string, unknown>);
  });

  return server;
}
