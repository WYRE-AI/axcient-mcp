/** Credential resolution + stateless tool-list invariants. */
import { describe, expect, it } from "vitest";
import {
  buildCredentials,
  createMcpServer,
  GATEWAY_HEADERS,
  listToolsResult,
  makeMcpServerFactory,
  resolveEnvCredentials,
  resolveGatewayCredentials,
} from "../mcp-server.js";
import { TOOLS } from "../tools.js";

describe("buildCredentials", () => {
  it("accepts an API key", () => {
    const { apiKey, error } = buildCredentials("k");
    expect(error).toBeUndefined();
    expect(apiKey).toBe("k");
  });

  it("errors naming the required header when missing", () => {
    const { apiKey, error } = buildCredentials(undefined);
    expect(apiKey).toBeUndefined();
    expect(error).toContain("X-Axcient-Api-Key");
  });
});

describe("resolveGatewayCredentials", () => {
  it("reads the exact lowercased x-axcient-api-key header", () => {
    const headers: Record<string, string> = { "x-axcient-api-key": "gk" };
    const seen: string[] = [];
    const { apiKey } = resolveGatewayCredentials((name) => {
      seen.push(name);
      return headers[name];
    });
    expect(apiKey).toBe("gk");
    expect(seen).toEqual(["x-axcient-api-key"]);
  });

  it("errors when the header is absent", () => {
    const { error } = resolveGatewayCredentials(() => undefined);
    expect(error).toBeTruthy();
    expect(GATEWAY_HEADERS).toEqual(["X-Axcient-Api-Key"]);
  });
});

describe("resolveEnvCredentials", () => {
  it("reads AXCIENT_API_KEY", () => {
    const { apiKey } = resolveEnvCredentials({ AXCIENT_API_KEY: "ek" });
    expect(apiKey).toBe("ek");
  });
});

describe("stateless tool surface", () => {
  it("returns the module-scope TOOLS array by reference every time", () => {
    expect(listToolsResult().tools).toBe(TOOLS);
    expect(listToolsResult().tools).toBe(listToolsResult().tools);
  });

  it("is identical (same order) regardless of credentials", () => {
    createMcpServer();
    const withoutCreds = listToolsResult().tools.map((t) => t.name);
    createMcpServer("some-key");
    const withCreds = listToolsResult().tools.map((t) => t.name);
    expect(withoutCreds).toEqual(withCreds);
  });
});

describe("makeMcpServerFactory", () => {
  it("builds a server from the gateway header per request", () => {
    const factory = makeMcpServerFactory({ gatewayMode: true });
    const headers = new Map<string, string>([["x-axcient-api-key", "gk"]]);
    const server = factory({
      requestInfo: { headers: { get: (n: string) => headers.get(n) ?? null } },
    } as never);
    expect(server).toBeTruthy();
  });

  it("never throws even with no credentials (401 gate lives in the HTTP layer)", () => {
    const factory = makeMcpServerFactory({ gatewayMode: true });
    expect(() =>
      factory({
        requestInfo: { headers: { get: () => null } },
      } as never)
    ).not.toThrow();
  });
});
