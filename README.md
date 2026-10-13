# axcient-mcp

MCP server for [Axcient x360Recover](https://developer.axcient.com/x360recover/) — BCDR
clients, devices, backup jobs, vaults, and appliances. Built on
[`@wyre-technology/node-axcient`](https://github.com/WYRE-AI/node-axcient) and the
MCP v2 SDK, serving both the 2025-era `initialize` handshake and the 2026-07-28 stateless
envelope from a single dual-era HTTP entrypoint.

## Credentials

Generate an API key in the x360Portal: **Settings → API Keys** (see
[Axcient's key management guide](https://help.axcient.com/360001190313-Axcient-x360Portal-/generating-and-managing-api-keys)).

Copy [`.env.example`](.env.example). Leave `CONDUIT_S2S_SECRET` empty in that file.

- **Local / stdio (Claude Desktop, CLI):** set `AXCIENT_API_KEY`. The stdio transport does not use `CONDUIT_S2S_SECRET`.
- **Hosted / gateway:** the WYRE MCP Gateway injects `X-Axcient-Api-Key` per request (`AUTH_MODE=gateway`). The gateway compose service does not set `AXCIENT_API_KEY` and does not use `env_file`.

| Variable | Required | Description |
|---|---|---|
| `AXCIENT_API_KEY` | For stdio and `AUTH_MODE=env` | x360Portal API key |
| `MCP_TRANSPORT` | No | `stdio` (default) or `http` |
| `AUTH_MODE` | No | `gateway` (Docker image and Compose default) or `env`. Gateway mode requires `X-Axcient-Api-Key` on each `/mcp` request and never falls back to `AXCIENT_API_KEY`. `env` uses that variable only after S2S auth succeeds. |
| `CONDUIT_S2S_SECRET` | Yes for HTTP | Service-to-service secret. The HTTP server logs an error and exits non-zero when this is empty or a known placeholder. Compose will not start without it. Never commit a real value. Generate one with `openssl rand -hex 32`. |
| `MCP_ALLOW_INSECURE_DEV` | No | Set to `1` only for local development to start HTTP without `CONDUIT_S2S_SECRET`. The process logs a warning, does not enforce `X-Gateway-S2S`, and binds `127.0.0.1` only. A wider `MCP_HTTP_HOST` is ignored. A placeholder secret is still refused. |
| `MCP_HTTP_HOST` | No | Bind address when a real `CONDUIT_S2S_SECRET` is set. Defaults to `127.0.0.1`. The container image sets `0.0.0.0`. |
| `MCP_HTTP_PORT` | No | HTTP port. Defaults to `8080`. |

`/health` and `/healthz` stay unauthenticated and do not read credentials.

### X-Gateway-S2S signing

With `MCP_TRANSPORT=http` and `CONDUIT_S2S_SECRET` set, every `/mcp` request must include `X-Gateway-S2S`:

```
X-Gateway-S2S: t=<unix seconds>,v1=<hex hmac-sha256>
```

`v1` is HMAC-SHA256 over the ASCII message `t=<unix seconds>`, keyed with `CONDUIT_S2S_SECRET`, hex-encoded. The timestamp must be within 300 seconds of the server clock. A missing or invalid header returns 401. The secret is never logged.

```js
import { createHmac } from "node:crypto";

const t = Math.floor(Date.now() / 1000);
const v1 = createHmac("sha256", process.env.CONDUIT_S2S_SECRET).update(`t=${t}`).digest("hex");
const xGatewayS2s = `t=${t},v1=${v1}`;
```

In `AUTH_MODE=gateway`, `/mcp` also requires `X-Axcient-Api-Key`. A request missing that header returns 401 and does not fall back to `AXCIENT_API_KEY`.

## Run locally (stdio)

```bash
npm install
npm run build
AXCIENT_API_KEY=your-key npm start
```

## Run as HTTP (gateway / hosted)

```bash
CONDUIT_S2S_SECRET="$(openssl rand -hex 32)" MCP_TRANSPORT=http AUTH_MODE=env AXCIENT_API_KEY=your-key npm start
# → http://127.0.0.1:8080/mcp, health at http://127.0.0.1:8080/health
```

Local HTTP without a secret is development-only. It binds `127.0.0.1` and logs a warning:

```bash
MCP_TRANSPORT=http MCP_ALLOW_INSECURE_DEV=1 npm start
```

## Docker

The image listens on `0.0.0.0` inside the container (`MCP_HTTP_HOST`) and defaults to `AUTH_MODE=gateway`. Publish the port on loopback and pass the S2S secret. In gateway mode, the Axcient API key arrives on each request as `X-Axcient-Api-Key`; it is not read from the environment.

```bash
docker build --platform linux/amd64 --build-arg GITHUB_TOKEN=$(gh auth token) -t axcient-mcp .
docker run \
  -e CONDUIT_S2S_SECRET=your-s2s-secret \
  -p 127.0.0.1:8080:8080 \
  axcient-mcp
```

Compose refuses to start when `CONDUIT_S2S_SECRET` is unset, runs `AUTH_MODE=gateway`, publishes `127.0.0.1:8080:8080`, and does not inject `AXCIENT_API_KEY`:

```bash
CONDUIT_S2S_SECRET=your-s2s-secret GITHUB_TOKEN=$(gh auth token) docker compose up
```

Single-tenant HTTP (`AUTH_MODE=env`) still requires the S2S secret, then uses `AXCIENT_API_KEY`:

```bash
docker run \
  -e CONDUIT_S2S_SECRET=your-s2s-secret \
  -e AUTH_MODE=env \
  -e AXCIENT_API_KEY=your-key \
  -p 127.0.0.1:8080:8080 \
  axcient-mcp
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
