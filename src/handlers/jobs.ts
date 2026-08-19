import type { AxcientClient } from "@wyre-technology/node-axcient";
import { jsonResult, optionalInteger, requireInteger, type ToolResult } from "./results.js";

export async function listJobsByDevice(
  client: AxcientClient,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const clientId = requireInteger(args, "client_id");
  const deviceId = requireInteger(args, "device_id");
  return jsonResult(await client.jobs.listByDevice(clientId, deviceId));
}

export async function getJob(
  client: AxcientClient,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const clientId = requireInteger(args, "client_id");
  const deviceId = requireInteger(args, "device_id");
  const jobId = requireInteger(args, "job_id");
  return jsonResult(await client.jobs.get(clientId, deviceId, jobId));
}

export async function getJobHistory(
  client: AxcientClient,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const clientId = requireInteger(args, "client_id");
  const deviceId = requireInteger(args, "device_id");
  const jobId = requireInteger(args, "job_id");
  const result = await client.jobs.getHistory(clientId, deviceId, jobId, {
    limit: optionalInteger(args, "limit"),
    offset: optionalInteger(args, "offset"),
    startTimeBegin: optionalInteger(args, "start_time_begin"),
  });
  return jsonResult(result);
}
