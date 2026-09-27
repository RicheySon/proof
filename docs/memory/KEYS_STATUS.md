# KEYS STATUS

**Never commit secret values.** Walkthroughs: [`KEYS_SETUP.md`](KEYS_SETUP.md) · [`CDP_SETUP.md`](CDP_SETUP.md) · [`AGENTROUTER_SETUP.md`](AGENTROUTER_SETUP.md).

Updated: 2026-09-27 (live smokes; values only in gitignored `.env` / Vercel Secrets).

| Variable | Required for | Status |
|----------|--------------|--------|
| `SESSION_SECRET` | Signed tenant cookies | **SET** locally + Vercel (prod/preview/dev) |
| `SERV_API_KEY` | Evaluate + Review | **SET** locally + Vercel — live multipath OK |
| `SERV_MODEL` | Default `gpt-5.4-mini-serv-multipath` | **SET** on Vercel |
| `SERV_BASE_URL` | Default `https://inference-api.openserv.ai/v1` | **SET** on Vercel |
| `CDP_API_KEY_ID` | CDP auth | **SET** locally + Vercel — JWT → `GET /evm/accounts` 200 |
| `CDP_API_KEY_SECRET` | CDP auth | **SET** locally + Vercel (Ed25519 from portal JSON) |
| `CDP_WALLET_SECRET` | Wallet JWT (`X-Wallet-Auth`) | **MISSING** — portal Non-custodial → Security → Generate |
| `CDP_EVM_ADDRESS` | Funded Base Sepolia `0x` account | **MISSING** — create after Wallet Secret; accounts list currently `[]` |
| `PROOF_NETWORK` | Default `base-sepolia` | **SET** on Vercel |
| `TINYFISH_API_KEY` | Optional research | **SET** locally + Vercel |
| `TAVILY_API_KEY` | Optional research | **SET** locally + Vercel |
| `AGENTROUTER_API_KEY` | Optional backup LLM | **SET** locally + Vercel — Tor required on cloud IPs |

## Behavior without keys
- Evaluate / Review without `SERV_API_KEY` → `CONFIG_REQUIRED` (no mock decision)
- Transfer without CDP wallet secret / address → `CONFIG_REQUIRED` (no fake hash)
- UI shows “connection required” / “Key required” — never green Connected unless secrets present

## Live smoke notes (no secret values)
| Provider | Result |
|----------|--------|
| SERV `/v1/models` | OK |
| SERV multipath DENY/ALLOW/review | OK (`npm run smoke:serv`) |
| Tavily search | OK |
| TinyFish wallet + search | OK |
| AgentRouter direct | Aliyun WAF HTML |
| AgentRouter + Tor SOCKS | OK (`deepseek-v4-flash`) |
| CDP Secret API Key | OK (Ed25519 JWT; empty accounts until Wallet Secret) |
| CDP Wallet Secret / EVM | Pending operator portal step |

## Vercel
- Project: `teamtitanlink/proof` (GitHub `henrysammarfo/proof` connected)
- Production alias: https://proof-smoky.vercel.app
- Env secrets pushed via CLI token (MCP still needsAuth / timed out)
- Still need `CDP_WALLET_SECRET` + `CDP_EVM_ADDRESS` on Vercel after portal generate/create/faucet
