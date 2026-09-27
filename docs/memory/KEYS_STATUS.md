# KEYS STATUS

**Never commit secret values.** Walkthroughs: [`KEYS_SETUP.md`](KEYS_SETUP.md) · [`CDP_SETUP.md`](CDP_SETUP.md) · [`AGENTROUTER_SETUP.md`](AGENTROUTER_SETUP.md).

Updated: 2026-09-27 — **full spine live** (SERV DENY → ALLOW+CDP tx → REPLAY).

| Variable | Required for | Status |
|----------|--------------|--------|
| `SESSION_SECRET` | Signed tenant cookies | **SET** locally + Vercel |
| `SERV_API_KEY` | Evaluate + Review | **SET** locally + Vercel |
| `SERV_MODEL` / `SERV_BASE_URL` | SERV defaults | **SET** on Vercel |
| `CDP_API_KEY_ID` | CDP auth | **SET** locally + Vercel |
| `CDP_API_KEY_SECRET` | CDP auth | **SET** locally + Vercel |
| `CDP_WALLET_SECRET` | Wallet JWT | **SET** locally + Vercel |
| `CDP_EVM_ADDRESS` | Spender (funded) | **SET** — `0xE448…e2FA` (proof-spender) |
| `PROOF_DEMO_PAYEE` | Allowlisted payee | **SET** — `0xE289…4b3C` (proof-payee, public) |
| `PROOF_NETWORK` | `base-sepolia` | **SET** |
| TinyFish / Tavily / AgentRouter | Optional | **SET** (AgentRouter needs Tor on cloud) |

## Live smoke (2026-09-27)
- `npm run smoke:full` → `smoke_full_spine_ok`
- DENY `$50` OVER_CAP (no tx)
- ALLOW `$1` → live Base Sepolia USDC tx  
  https://sepolia.basescan.org/tx/0xd38a39f60caf2854d5bfe6dc87098fe58c289ca00024f10f17c5cb2fab6743f3
- REPLAY gate blocks same intent

## Vercel
- https://proof-smoky.vercel.app
- Project `teamtitanlink/proof` — all CDP + SERV secrets on prod/preview/dev
