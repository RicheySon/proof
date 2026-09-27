# KEYS STATUS

**Never commit secret values.** Full walkthrough with links: [`KEYS_SETUP.md`](KEYS_SETUP.md).

| Variable | Required for | Status |
|----------|--------------|--------|
| `SESSION_SECRET` | Signed tenant cookies | Set locally in gitignored `.env`; **set on Vercel before prod** |
| `SERV_API_KEY` | Evaluate + Review | **MISSING** — https://console.openserv.ai |
| `SERV_MODEL` | Default `gpt-5.4-mini-serv-multipath` | Optional |
| `SERV_BASE_URL` | Default `https://inference-api.openserv.ai/v1` | Optional |
| `CDP_API_KEY_ID` | CDP auth | **MISSING** — https://portal.cdp.coinbase.com |
| `CDP_API_KEY_SECRET` | CDP auth | **MISSING** |
| `CDP_WALLET_SECRET` | Wallet JWT (`X-Wallet-Auth`) | **MISSING** |
| `CDP_EVM_ADDRESS` | Funded Base Sepolia `0x` account | **MISSING** |
| `PROOF_NETWORK` | Default `base-sepolia` | Optional |

## Behavior without keys
- Evaluate / Review without `SERV_API_KEY` → `CONFIG_REQUIRED` (no mock decision)
- Transfer without CDP secrets / address → `CONFIG_REQUIRED` (no fake hash)
- UI shows “connection required” / “Key required” — never green Connected unless secrets present

## Vercel MCP
Authenticate Vercel MCP in Cursor to let the agent list projects, set env, and inspect deployments. Auth timed out on 2026-09-27; use dashboard/CLI until re-authed.
