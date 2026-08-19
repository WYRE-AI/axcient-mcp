/**
 * The complete Axcient x360Recover tool surface — 20 tools, FLAT (no router).
 * Well under the skill's ~25-tool router threshold (§2.6).
 *
 * Deterministic ordering rule: all tools live in this single module-scope
 * `TOOLS` array, grouped by entity (organization → clients → devices → jobs →
 * vaults → appliances), reads before writes within each group. `tools/list`
 * returns this array by reference for every request, every era, every caller.
 * Never sorted at runtime, never filtered per-session, never varied by
 * credentials.
 *
 * No destructive tools exist in this API surface — x360Recover's public API
 * (v0.3.1) has no delete/disable/reset operations, only reads plus two
 * additive writes (mint a D2C token, set a vault's connectivity threshold).
 * Neither fits the skill's §2.7b Tier A/B destructive definitions (delete,
 * disable, reset credentials, quarantine, ...), so no warning prefix or
 * `destructiveHint` is used; both are still marked `readOnlyHint: false`.
 */
import type { Tool } from "@modelcontextprotocol/server";

const clientIdProp = {
  type: "number" as const,
  description: "The Axcient client ID (an x360Recover-managed customer/site, not the API caller).",
};
const deviceIdProp = { type: "number" as const, description: "The Axcient device (protected system) ID." };
const jobIdProp = { type: "number" as const, description: "The Axcient backup job ID." };
const vaultIdProp = { type: "number" as const, description: "The Axcient vault ID." };
const applianceIdProp = { type: "number" as const, description: "The Axcient appliance ID." };
const includeAppliancesProp = {
  type: "boolean" as const,
  description: "Include short appliance information in the response (default false).",
};
const includeDevicesProp = {
  type: "boolean" as const,
  description: "Include the device list in the response (default true).",
};
const limitProp = { type: "number" as const, description: "Max results to return." };
const offsetProp = { type: "number" as const, description: "Pagination offset." };

export const TOOLS: Tool[] = [
  {
    name: "axcient_test_connection",
    description: "Verify the configured Axcient API key works by fetching the organization record.",
    annotations: { title: "Test Axcient connection", readOnlyHint: true },
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "axcient_get_organization",
    description: "Get the organization associated with the authenticating API key.",
    annotations: { title: "Get organization", readOnlyHint: true },
    inputSchema: { type: "object", properties: {} },
  },

  {
    name: "axcient_list_clients",
    description: "List all clients (customer/site records) in the organization.",
    annotations: { title: "List clients", readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: { include_appliances: includeAppliancesProp },
    },
  },
  {
    name: "axcient_get_client",
    description: "Get a single client by ID, including its health status and protected-system counts.",
    annotations: { title: "Get client", readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: { client_id: clientIdProp, include_appliances: includeAppliancesProp },
      required: ["client_id"],
    },
  },
  {
    name: "axcient_get_d2c_agent_token",
    description:
      "Mint a D2C (direct-to-cloud) agent enrollment token for a client/vault pair, used to " +
      "install the D2C backup agent on a new protected system. Each call mints a new token; it " +
      "does not affect existing devices or data.",
    annotations: {
      title: "Mint D2C agent token",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
    inputSchema: {
      type: "object",
      properties: { client_id: clientIdProp, vault_id: vaultIdProp },
      required: ["client_id", "vault_id"],
    },
  },

  {
    name: "axcient_list_devices",
    description: "List all devices (protected systems) across the organization. Supports limit/offset pagination.",
    annotations: { title: "List devices", readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: { limit: limitProp, offset: offsetProp },
    },
  },
  {
    name: "axcient_list_devices_by_client",
    description: "List devices belonging to a specific client.",
    annotations: { title: "List devices by client", readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        client_id: clientIdProp,
        service_id: { type: "string" as const, description: "4-character appliance/service SID to filter by." },
        d2c_only: { type: "boolean" as const, description: "Return only D2C (direct-to-cloud) devices." },
      },
      required: ["client_id"],
    },
  },
  {
    name: "axcient_get_device",
    description: "Get full detail for a single device, including OS, health status, thresholds, jobs, and vaults.",
    annotations: { title: "Get device", readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: { device_id: deviceIdProp },
      required: ["device_id"],
    },
  },
  {
    name: "axcient_get_device_autoverify",
    description: "Get AutoVerify (automated screenshot boot verification) results for a device, grouped by vault.",
    annotations: { title: "Get device AutoVerify results", readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: { device_id: deviceIdProp },
      required: ["device_id"],
    },
  },
  {
    name: "axcient_get_device_restore_points",
    description: "Get available restore points for a device, grouped by the cloud vault they replicate to.",
    annotations: { title: "Get device restore points", readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: { device_id: deviceIdProp },
      required: ["device_id"],
    },
  },

  {
    name: "axcient_list_jobs_by_device",
    description: "List backup jobs configured for a device.",
    annotations: { title: "List jobs by device", readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: { client_id: clientIdProp, device_id: deviceIdProp },
      required: ["client_id", "device_id"],
    },
  },
  {
    name: "axcient_get_job",
    description: "Get a single backup job by ID, including thresholds and health status.",
    annotations: { title: "Get job", readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: { client_id: clientIdProp, device_id: deviceIdProp, job_id: jobIdProp },
      required: ["client_id", "device_id", "job_id"],
    },
  },
  {
    name: "axcient_get_job_history",
    description:
      "Get run history for a backup job. Known API quirk: this endpoint is occasionally " +
      "nonfunctional in production (community-reported); treat failures here as an Axcient-side " +
      "issue, not a client bug.",
    annotations: { title: "Get job history", readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        client_id: clientIdProp,
        device_id: deviceIdProp,
        job_id: jobIdProp,
        limit: limitProp,
        offset: offsetProp,
        start_time_begin: {
          type: "number" as const,
          description: "Unix timestamp — only return history entries starting at/after this time.",
        },
      },
      required: ["client_id", "device_id", "job_id"],
    },
  },

  {
    name: "axcient_list_vaults",
    description: "List vaults (Private or Cloud) in the organization.",
    annotations: { title: "List vaults", readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        vault_type: { type: "string" as const, enum: ["Private", "Cloud"], description: "Filter by vault type." },
        active: { type: "boolean" as const, description: "Filter by active state." },
        with_url: { type: "boolean" as const, description: "Filter to vaults that have a URL." },
        limit: limitProp,
        include_devices: includeDevicesProp,
      },
    },
  },
  {
    name: "axcient_get_vault",
    description: "Get a single vault by ID, including storage usage and assigned devices.",
    annotations: { title: "Get vault", readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: { vault_id: vaultIdProp },
      required: ["vault_id"],
    },
  },
  {
    name: "axcient_get_vault_threshold",
    description: "Get a vault's connectivity threshold (minutes before it's marked WARNED for lost connectivity).",
    annotations: { title: "Get vault connectivity threshold", readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: { vault_id: vaultIdProp },
      required: ["vault_id"],
    },
  },
  {
    name: "axcient_set_vault_threshold",
    description:
      "Set a vault's connectivity threshold in minutes. This changes alerting behavior only — it " +
      "does not affect backups, replication, or stored data, and can be changed again at any time.",
    annotations: {
      title: "Set vault connectivity threshold",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
    inputSchema: {
      type: "object",
      properties: {
        vault_id: vaultIdProp,
        threshold_minutes: {
          type: "number" as const,
          description: "Minutes without connectivity before the vault is marked WARNED.",
        },
      },
      required: ["vault_id", "threshold_minutes"],
    },
  },

  {
    name: "axcient_list_appliances",
    description: "List appliances (BRC/x360Recover physical or virtual backup servers) in the organization.",
    annotations: { title: "List appliances", readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        service_id: { type: "string" as const, description: "4-character appliance service SID to filter by." },
        include_devices: includeDevicesProp,
      },
    },
  },
  {
    name: "axcient_list_appliances_by_client",
    description: "List appliances belonging to a specific client.",
    annotations: { title: "List appliances by client", readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: { client_id: clientIdProp, include_devices: includeDevicesProp },
      required: ["client_id"],
    },
  },
  {
    name: "axcient_get_appliance",
    description: "Get a single appliance by ID, including model, storage, tunnel status, and health.",
    annotations: { title: "Get appliance", readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: { appliance_id: applianceIdProp, include_devices: includeDevicesProp },
      required: ["appliance_id"],
    },
  },
];

export const TOOL_NAMES = TOOLS.map((t) => t.name);
