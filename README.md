# axcient-mcp

MCP server for [Axcient x360Recover](https://developer.axcient.com/x360recover/) — BCDR
clients, devices, backup jobs, vaults, and appliances. Built on
[`@wyre-technology/node-axcient`](https://github.com/wyre-technology/node-axcient) and the
MCP v2 SDK, serving both the 2025-era `initialize` handshake and the 2026-07-28 stateless
envelope from a single dual-era HTTP entrypoint.

## Credentials

Generate an API key in the x360Portal: **Settings → API Keys** (see
[Axcient's key management guide](https://help.axcient.com/360001190313-Axcient-x360Portal-/generating-and-managing-api-keys)).

- **Local / stdio (Claude Desktop, CLI):** set `AXCIENT_API_KEY`.
- **Hosted / gateway:** the WYRE MCP Gateway injects the `X-Axcient-Api-Key` header per
  request (`AUTH_MODE=gateway`); no server-side key is stored.

## Run locally (stdio)

```bash
npm install
npm run build
AXCIENT_API_KEY=your-key npm start
```

## Run as HTTP (gateway / hosted)

```bash
MCP_TRANSPORT=http AUTH_MODE=env AXCIENT_API_KEY=your-key npm start
# → http://localhost:8080/mcp, health at http://localhost:8080/health
```

## Docker

```bash
docker build --platform linux/amd64 --build-arg GITHUB_TOKEN=$(gh auth token) -t axcient-mcp .
docker run -p 8080:8080 -e AXCIENT_API_KEY=your-key axcient-mcp
```

## Tools

20 tools, flat surface (no router — well under the fleet's ~25-tool threshold).

| Tool | Description |
|---|---|
| `axcient_test_connection` | Verify the API key by fetching the organization record |
| `axcient_get_organization` | Get the organization for the API key |
| `axcient_list_clients` / `axcient_get_client` | Clients (customer/site records) |
| `axcient_get_d2c_agent_token` | Mint a D2C agent enrollment token |
| `axcient_list_devices` / `axcient_list_devices_by_client` / `axcient_get_device` | Devices |
| `axcient_get_device_autoverify` / `axcient_get_device_restore_points` | AutoVerify + restore points |
| `axcient_list_jobs_by_device` / `axcient_get_job` / `axcient_get_job_history` | Backup jobs |
| `axcient_list_vaults` / `axcient_get_vault` | Vaults |
| `axcient_get_vault_threshold` / `axcient_set_vault_threshold` | Vault connectivity threshold |
| `axcient_list_appliances` / `axcient_list_appliances_by_client` / `axcient_get_appliance` | Appliances |

No destructive tools exist in this surface — the x360Recover public API (v0.3.1) has no
delete/disable operations, so no confirmation/elicitation flow is wired up. See
`node-axcient`'s README for known API quirks (error-shape inconsistencies, list-endpoint
schema documentation bugs) this server's error messages surface verbatim from the SDK.

## License

Apache-2.0
