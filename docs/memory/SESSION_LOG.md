# SESSION LOG

## 2026-09-27 — Discovery + plan lock

### Live fact-checks
- Hackathon Edition 01 confirmed: submit **28 Sep 2026 00:00 UTC**; AgentKit track; $1k SERV/track + $1k USDC overall; data collection ON required. Source: https://www.openserv.ai/hackathon
- SERV API: `https://inference-api.openserv.ai/v1`, system prompt required, tools `serv_shadow_agent` / `serv_prompt_guard`, Multipath via `*-serv-multipath` model suffix. Sources: docs.openserv.ai
- Multipath does **not** authorize side effects (docs).
- Repo was simulated demo (client heuristic + sessionStorage).

### Decisions
- Keys: neither SERV nor CDP yet → build fail-closed live paths; endpoints error if secrets missing (no mocks).
- Scope: hackathon win spine + favicon metadata, layout fix, reviewer page, full testing.
- Soft: agents cannot move money until policy proof — including replay of same payment (idempotency).

### API key probes (no secret values logged)
| Provider | Result |
|----------|--------|
| Tavily | Plan usage limit exceeded |
| TinyFish Search (`api.search.tinyfish.ai`) | Works |
| TinyFish Automation | Wallet $0 — needs top-up |
| AgentRouter | Aliyun WAF blocks this cloud env |
| SERV / CDP | Not provided yet |

## 2026-09-27 — Build spine shipped

### Shipped
- Memory docs, Cursor rules/skills
- Fail-closed server evaluate / code gate / CDP transfer / receipts / review
- Multitenant signed httpOnly sessions (no localStorage receipts)
- Favicon + webmanifest metadata
- Landing layout fix (flex band, no clipped receipt)
- Review page route
- `npm run build` green (Cloudflare Nitro)
- `npm run test:gate` green (OVER_CAP / allowlist / REPLAY / ALLOW)

### Keys still missing for live SERV/CDP calls
See KEYS_STATUS.md — endpoints return CONFIG_REQUIRED (no mocks).

### Vercel MCP
- Attempted Vercel MCP `mcp_auth` → **timed out**. User must approve Vercel MCP in Cursor, then re-ask to wire env/deploy.
- Added [`KEYS_SETUP.md`](KEYS_SETUP.md) with ordered steps + official links for SERV, CDP, Vercel, demo script.

