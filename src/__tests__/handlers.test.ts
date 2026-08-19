/** tools/call dispatch: routing, argument validation, and error normalization. */
import { describe, expect, it, vi } from "vitest";
import { AuthenticationError, NotFoundError } from "@wyre-technology/node-axcient";
import { handleToolCall } from "../handlers/index.js";

function fakeClient(overrides: Record<string, unknown> = {}) {
  return {
    organization: { get: vi.fn().mockResolvedValue({ id: 1, name: "Org", active: true }) },
    clients: {
      list: vi.fn().mockResolvedValue([{ id: 1, name: "Client", active: true }]),
      get: vi.fn().mockResolvedValue({ id: 1, name: "Client", active: true }),
      getD2CAgentToken: vi.fn().mockResolvedValue({ token_id: "tok" }),
    },
    devices: {
      list: vi.fn().mockResolvedValue([]),
      listByClient: vi.fn().mockResolvedValue([]),
      get: vi.fn().mockResolvedValue({ id: 1, name: "Device" }),
      getAutoVerify: vi.fn().mockResolvedValue([]),
      getRestorePoints: vi.fn().mockResolvedValue([]),
    },
    jobs: {
      listByDevice: vi.fn().mockResolvedValue([]),
      get: vi.fn().mockResolvedValue({ id: 1, name: "Job" }),
      getHistory: vi.fn().mockResolvedValue({ status: "Completed" }),
    },
    vaults: {
      list: vi.fn().mockResolvedValue([]),
      get: vi.fn().mockResolvedValue({ id: 1, name: "Vault" }),
      getThreshold: vi.fn().mockResolvedValue({ vault_id: 1, connectivity_threshold: 240 }),
      setThreshold: vi.fn().mockResolvedValue({ vault_id: 1, connectivity_threshold: 300 }),
    },
    appliances: {
      list: vi.fn().mockResolvedValue([]),
      listByClient: vi.fn().mockResolvedValue([]),
      get: vi.fn().mockResolvedValue({ id: 1, alias: "Appliance" }),
    },
    ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("handleToolCall dispatch", () => {
  it("returns an isError result for an unknown tool", async () => {
    const result = await handleToolCall(fakeClient(), "axcient_does_not_exist", {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Unknown tool");
  });

  it("calls organization.get for axcient_test_connection and axcient_get_organization", async () => {
    const client = fakeClient();
    await handleToolCall(client, "axcient_test_connection", {});
    await handleToolCall(client, "axcient_get_organization", {});
    expect(client.organization.get).toHaveBeenCalledTimes(2);
  });

  it("routes client_id/vault_id through to clients.getD2CAgentToken", async () => {
    const client = fakeClient();
    const result = await handleToolCall(client, "axcient_get_d2c_agent_token", {
      client_id: 26,
      vault_id: 234,
    });
    expect(client.clients.getD2CAgentToken).toHaveBeenCalledWith(26, 234);
    expect(result.isError).toBeUndefined();
  });

  it("validates required integer arguments before calling the SDK", async () => {
    const client = fakeClient();
    const result = await handleToolCall(client, "axcient_get_device", { device_id: "not-a-number" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Invalid arguments for axcient_get_device');
    expect(client.devices.get).not.toHaveBeenCalled();
  });

  it("validates vault_type enum for axcient_list_vaults", async () => {
    const client = fakeClient();
    const result = await handleToolCall(client, "axcient_list_vaults", { vault_type: "Nope" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/"Private" or "Cloud"/);
  });

  it("passes threshold_minutes through to vaults.setThreshold", async () => {
    const client = fakeClient();
    await handleToolCall(client, "axcient_set_vault_threshold", {
      vault_id: 234,
      threshold_minutes: 300,
    });
    expect(client.vaults.setThreshold).toHaveBeenCalledWith(234, 300);
  });

  it("maps NotFoundError to a descriptive isError result", async () => {
    const client = fakeClient({
      clients: {
        get: vi.fn().mockRejectedValue(new NotFoundError("Client not found", { status: 404 })),
      },
    });
    const result = await handleToolCall(client, "axcient_get_client", { client_id: 999999 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("HTTP 404");
    expect(result.content[0].text).toContain("Client not found");
  });

  it("maps AuthenticationError to a descriptive isError result", async () => {
    const client = fakeClient({
      organization: {
        get: vi.fn().mockRejectedValue(new AuthenticationError("Invalid API key", { message: "Unauthorized" })),
      },
    });
    const result = await handleToolCall(client, "axcient_get_organization", {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("HTTP 401");
  });

  it("maps an unexpected thrown error to a generic isError result", async () => {
    const client = fakeClient({
      devices: { list: vi.fn().mockRejectedValue(new Error("boom")) },
    });
    const result = await handleToolCall(client, "axcient_list_devices", {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("boom");
  });
});
