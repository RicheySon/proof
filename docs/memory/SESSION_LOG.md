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

## 2026-09-27 — Keys wired + CDP flow documented

### Operator-supplied keys (values only in gitignored `.env`, never committed)
- SERV → live `/v1/models` + multipath chat completions OK
- AgentRouter → direct WAF; Tor `socks5h://127.0.0.1:9050` + stainless headers → `deepseek-v4-flash` OK
- TinyFish → wallet + search HTTP 200
- Tavily → search HTTP 200
- CDP → still operator action; full portal flow in [`CDP_SETUP.md`](CDP_SETUP.md)

### Docs added/updated
- [`CDP_SETUP.md`](CDP_SETUP.md) — click-by-click Secret API Key, Wallet Secret, EVM account, Base Sepolia ETH+USDC faucet
- [`AGENTROUTER_SETUP.md`](AGENTROUTER_SETUP.md) — Tor path, headers, Vercel relay note (AgentRouter ≠ SERV)
- `.env.example` — optional TinyFish / Tavily / AgentRouter vars
- `scripts/smoke-serv.ts` — live DENY + review smoke

### Still blocked for full ALLOW+tx demo
Four CDP env vars + funded Base Sepolia address (see CDP_SETUP).

### Live SERV smoke (`npm run smoke:serv`)
- DENY on $50 over-cap → OK
- ALLOW on $2 allowlisted → OK (SERV only; transfer still needs CDP)
- `/review` structured risks → OK
- Fixed SERV client: policy in user JSON, strict json_schema `required` includes all properties, content_filter/refusal fail-closed

## 2026-09-27 — CDP Secret API Key + Vercel production

### CDP
- Portal Secret API Key JSON loaded into gitignored `.env` (`CDP_API_KEY_ID` + `CDP_API_KEY_SECRET`)
- Live smoke: Ed25519 Bearer JWT → `GET /platform/v2/evm/accounts` **200** with `accounts: []`
- Still missing: `CDP_WALLET_SECRET` (portal Non-custodial → Security → Generate) then create + fund EVM account

### Vercel (CLI token; MCP still needsAuth)
- Created/linked project `teamtitanlink/proof` → GitHub connected
- Pushed secrets to Production / Preview / Development (names only logged)
- Production deploy READY: https://proof-smoky.vercel.app
- Inspect: https://vercel.com/teamtitanlink/proof
