import type { AxcientClient } from "@wyre-technology/node-axcient";
import { jsonResult, optionalBoolean, requireInteger, type ToolResult } from "./results.js";

export async function listClients(
  client: AxcientClient,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const result = await client.clients.list({
    includeAppliances: optionalBoolean(args, "include_appliances"),
  });
  return jsonResult(result);
}

export async function getClient(
  client: AxcientClient,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const clientId = requireInteger(args, "client_id");
  const result = await client.clients.get(clientId, {
    includeAppliances: optionalBoolean(args, "include_appliances"),
  });
  return jsonResult(result);
}

export async function getD2CAgentToken(
  client: AxcientClient,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const clientId = requireInteger(args, "client_id");
  const vaultId = requireInteger(args, "vault_id");
  const result = await client.clients.getD2CAgentToken(clientId, vaultId);
  return jsonResult(result);
}
