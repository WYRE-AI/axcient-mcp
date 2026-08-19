/** Tool-surface contract tests: count, names, order, schemas, annotations. */
import { describe, expect, it } from "vitest";
import { TOOLS, TOOL_NAMES } from "../tools.js";

const EXPECTED_ORDER = [
  "axcient_test_connection",
  "axcient_get_organization",
  "axcient_list_clients",
  "axcient_get_client",
  "axcient_get_d2c_agent_token",
  "axcient_list_devices",
  "axcient_list_devices_by_client",
  "axcient_get_device",
  "axcient_get_device_autoverify",
  "axcient_get_device_restore_points",
  "axcient_list_jobs_by_device",
  "axcient_get_job",
  "axcient_get_job_history",
  "axcient_list_vaults",
  "axcient_get_vault",
  "axcient_get_vault_threshold",
  "axcient_set_vault_threshold",
  "axcient_list_appliances",
  "axcient_list_appliances_by_client",
  "axcient_get_appliance",
];

const READ_ONLY = EXPECTED_ORDER.filter(
  (name) => name !== "axcient_get_d2c_agent_token" && name !== "axcient_set_vault_threshold"
);

describe("tool surface", () => {
  it("has exactly 20 tools in the documented order", () => {
    expect(TOOLS).toHaveLength(20);
    expect(TOOL_NAMES).toEqual(EXPECTED_ORDER);
  });

  it("every tool has a description and an object inputSchema", () => {
    for (const tool of TOOLS) {
      expect(tool.description, tool.name).toBeTruthy();
      expect(tool.inputSchema.type, tool.name).toBe("object");
    }
  });

  it("reads are readOnlyHint:true", () => {
    for (const name of READ_ONLY) {
      const tool = TOOLS.find((t) => t.name === name)!;
      expect(tool.annotations?.readOnlyHint, name).toBe(true);
    }
  });

  it("the two writes are readOnlyHint:false and carry no destructive warning", () => {
    for (const name of ["axcient_get_d2c_agent_token", "axcient_set_vault_threshold"]) {
      const tool = TOOLS.find((t) => t.name === name)!;
      expect(tool.annotations?.readOnlyHint, name).toBe(false);
      expect(tool.annotations?.destructiveHint, name).toBe(false);
      expect(tool.description, name).not.toContain("⚠");
    }
  });

  it("no tool in this vendor surface is marked destructive (API has no delete/disable ops)", () => {
    for (const tool of TOOLS) {
      expect(tool.annotations?.destructiveHint, tool.name).not.toBe(true);
    }
  });

  it("required arguments match the ID-based lookup contract", () => {
    const required = (name: string) =>
      (TOOLS.find((t) => t.name === name)!.inputSchema as { required?: string[] }).required ?? [];
    expect(required("axcient_get_client")).toEqual(["client_id"]);
    expect(required("axcient_get_d2c_agent_token")).toEqual(["client_id", "vault_id"]);
    expect(required("axcient_list_devices_by_client")).toEqual(["client_id"]);
    expect(required("axcient_get_device")).toEqual(["device_id"]);
    expect(required("axcient_list_jobs_by_device")).toEqual(["client_id", "device_id"]);
    expect(required("axcient_get_job")).toEqual(["client_id", "device_id", "job_id"]);
    expect(required("axcient_get_vault")).toEqual(["vault_id"]);
    expect(required("axcient_set_vault_threshold")).toEqual(["vault_id", "threshold_minutes"]);
    expect(required("axcient_get_appliance")).toEqual(["appliance_id"]);
    expect(required("axcient_test_connection")).toEqual([]);
  });
});
