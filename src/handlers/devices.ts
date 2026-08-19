import type { AxcientClient } from "@wyre-technology/node-axcient";
import {
  jsonResult,
  optionalBoolean,
  optionalInteger,
  optionalString,
  requireInteger,
  type ToolResult,
} from "./results.js";

export async function listDevices(
  client: AxcientClient,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const result = await client.devices.list({
    limit: optionalInteger(args, "limit"),
    offset: optionalInteger(args, "offset"),
  });
  return jsonResult(result);
}

export async function listDevicesByClient(
  client: AxcientClient,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const clientId = requireInteger(args, "client_id");
  const result = await client.devices.listByClient(clientId, {
    serviceId: optionalString(args, "service_id"),
    d2cOnly: optionalBoolean(args, "d2c_only"),
  });
  return jsonResult(result);
}

export async function getDevice(
  client: AxcientClient,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const deviceId = requireInteger(args, "device_id");
  return jsonResult(await client.devices.get(deviceId));
}

export async function getDeviceAutoVerify(
  client: AxcientClient,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const deviceId = requireInteger(args, "device_id");
  return jsonResult(await client.devices.getAutoVerify(deviceId));
}

export async function getDeviceRestorePoints(
  client: AxcientClient,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const deviceId = requireInteger(args, "device_id");
  return jsonResult(await client.devices.getRestorePoints(deviceId));
}
