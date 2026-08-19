import type { AxcientClient } from "@wyre-technology/node-axcient";
import {
  jsonResult,
  optionalBoolean,
  optionalString,
  requireInteger,
  type ToolResult,
} from "./results.js";

export async function listAppliances(
  client: AxcientClient,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const result = await client.appliances.list({
    serviceId: optionalString(args, "service_id"),
    includeDevices: optionalBoolean(args, "include_devices"),
  });
  return jsonResult(result);
}

export async function listAppliancesByClient(
  client: AxcientClient,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const clientId = requireInteger(args, "client_id");
  const result = await client.appliances.listByClient(clientId, {
    includeDevices: optionalBoolean(args, "include_devices"),
  });
  return jsonResult(result);
}

export async function getAppliance(
  client: AxcientClient,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const applianceId = requireInteger(args, "appliance_id");
  const result = await client.appliances.get(applianceId, {
    includeDevices: optionalBoolean(args, "include_devices"),
  });
  return jsonResult(result);
}
