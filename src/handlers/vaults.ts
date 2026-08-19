import type { AxcientClient, VaultType } from "@wyre-technology/node-axcient";
import {
  jsonResult,
  optionalBoolean,
  optionalInteger,
  optionalString,
  requireInteger,
  ToolInputError,
  type ToolResult,
} from "./results.js";

function optionalVaultType(
  args: Record<string, unknown>,
  key: string
): VaultType | undefined {
  const value = optionalString(args, key);
  if (value === undefined) return undefined;
  if (value !== "Private" && value !== "Cloud") {
    throw new ToolInputError(`Argument "${key}" must be "Private" or "Cloud".`);
  }
  return value;
}

export async function listVaults(
  client: AxcientClient,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const result = await client.vaults.list({
    vaultType: optionalVaultType(args, "vault_type"),
    active: optionalBoolean(args, "active"),
    withUrl: optionalBoolean(args, "with_url"),
    limit: optionalInteger(args, "limit"),
    includeDevices: optionalBoolean(args, "include_devices"),
  });
  return jsonResult(result);
}

export async function getVault(
  client: AxcientClient,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const vaultId = requireInteger(args, "vault_id");
  return jsonResult(await client.vaults.get(vaultId));
}

export async function getVaultThreshold(
  client: AxcientClient,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const vaultId = requireInteger(args, "vault_id");
  return jsonResult(await client.vaults.getThreshold(vaultId));
}

export async function setVaultThreshold(
  client: AxcientClient,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const vaultId = requireInteger(args, "vault_id");
  const thresholdMinutes = requireInteger(args, "threshold_minutes");
  const result = await client.vaults.setThreshold(vaultId, thresholdMinutes);
  return jsonResult(result);
}
