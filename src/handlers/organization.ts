import type { AxcientClient } from "@wyre-technology/node-axcient";
import { jsonResult, type ToolResult } from "./results.js";

export async function testConnection(client: AxcientClient): Promise<ToolResult> {
  const org = await client.organization.get();
  return jsonResult({ connected: true, organization: org });
}

export async function getOrganization(client: AxcientClient): Promise<ToolResult> {
  return jsonResult(await client.organization.get());
}
