/**
 * tools/call dispatch. The SDK client is bound per request by the caller
 * (mcp-server.ts); this module maps tool names to handlers and normalizes
 * every failure into an isError text result — errors are never thrown out.
 */
import { ServiceError, type AxcientClient } from "@wyre-technology/node-axcient";
import { getAppliance, listAppliances, listAppliancesByClient } from "./appliances.js";
import { getClient, getD2CAgentToken, listClients } from "./clients.js";
import {
  getDevice,
  getDeviceAutoVerify,
  getDeviceRestorePoints,
  listDevices,
  listDevicesByClient,
} from "./devices.js";
import { getJob, getJobHistory, listJobsByDevice } from "./jobs.js";
import { getOrganization, testConnection } from "./organization.js";
import { getVault, getVaultThreshold, listVaults, setVaultThreshold } from "./vaults.js";
import { errorResult, ToolInputError, type ToolResult } from "./results.js";

type ToolHandler = (client: AxcientClient, args: Record<string, unknown>) => Promise<ToolResult>;

const HANDLERS: Record<string, ToolHandler> = {
  axcient_test_connection: (client) => testConnection(client),
  axcient_get_organization: (client) => getOrganization(client),

  axcient_list_clients: listClients,
  axcient_get_client: getClient,
  axcient_get_d2c_agent_token: getD2CAgentToken,

  axcient_list_devices: listDevices,
  axcient_list_devices_by_client: listDevicesByClient,
  axcient_get_device: getDevice,
  axcient_get_device_autoverify: getDeviceAutoVerify,
  axcient_get_device_restore_points: getDeviceRestorePoints,

  axcient_list_jobs_by_device: listJobsByDevice,
  axcient_get_job: getJob,
  axcient_get_job_history: getJobHistory,

  axcient_list_vaults: listVaults,
  axcient_get_vault: getVault,
  axcient_get_vault_threshold: getVaultThreshold,
  axcient_set_vault_threshold: setVaultThreshold,

  axcient_list_appliances: listAppliances,
  axcient_list_appliances_by_client: listAppliancesByClient,
  axcient_get_appliance: getAppliance,
};

function describeServiceError(error: ServiceError): string {
  let body = "";
  if (error.response !== undefined && error.response !== null && error.response !== "") {
    try {
      body = ` Response: ${JSON.stringify(error.response)}`;
    } catch {
      body = "";
    }
  }
  return `Axcient API error (HTTP ${error.statusCode}): ${error.message}.${body}`;
}

export async function handleToolCall(
  client: AxcientClient,
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const handler = HANDLERS[name];
  if (!handler) {
    return errorResult(`Unknown tool: ${name}`);
  }
  try {
    return await handler(client, args);
  } catch (error) {
    if (error instanceof ToolInputError) {
      return errorResult(`Invalid arguments for ${name}: ${error.message}`);
    }
    if (error instanceof ServiceError) {
      return errorResult(describeServiceError(error));
    }
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(`Error calling ${name}: ${message}`);
  }
}
