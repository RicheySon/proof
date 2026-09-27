# KEYS STATUS

**Never commit secret values.** Walkthroughs: [`KEYS_SETUP.md`](KEYS_SETUP.md) · [`CDP_SETUP.md`](CDP_SETUP.md) · [`AGENTROUTER_SETUP.md`](AGENTROUTER_SETUP.md).

Updated: 2026-09-27 (live smokes; values only in gitignored `.env`).

| Variable | Required for | Status |
|----------|--------------|--------|
| `SESSION_SECRET` | Signed tenant cookies | **SET** locally (`.env`); set on Vercel before prod |
| `SERV_API_KEY` | Evaluate + Review | **SET** locally — live models + multipath chat OK |
| `SERV_MODEL` | Default `gpt-5.4-mini-serv-multipath` | Optional (default used) |
| `SERV_BASE_URL` | Default `https://inference-api.openserv.ai/v1` | Optional |
| `CDP_API_KEY_ID` | CDP auth | **MISSING** — follow [`CDP_SETUP.md`](CDP_SETUP.md) |
| `CDP_API_KEY_SECRET` | CDP auth | **MISSING** |
| `CDP_WALLET_SECRET` | Wallet JWT (`X-Wallet-Auth`) | **MISSING** |
| `CDP_EVM_ADDRESS` | Funded Base Sepolia `0x` account | **MISSING** |
| `PROOF_NETWORK` | Default `base-sepolia` | Optional |
| `TINYFISH_API_KEY` | Optional research | **SET** locally — wallet + search HTTP 200 |
| `TAVILY_API_KEY` | Optional research | **SET** locally — search HTTP 200 |
| `AGENTROUTER_API_KEY` | Optional backup LLM | **SET** locally — **Tor required** on cloud IPs |

## Behavior without keys
- Evaluate / Review without `SERV_API_KEY` → `CONFIG_REQUIRED` (no mock decision)
- Transfer without CDP secrets / address → `CONFIG_REQUIRED` (no fake hash)
- UI shows “connection required” / “Key required” — never green Connected unless secrets present

## Live smoke notes (no secret values)
| Provider | Result |
|----------|--------|
| SERV `/v1/models` | OK |
| SERV multipath chat | OK (`gpt-5.4-mini-serv-multipath`) |
| Tavily search | OK |
| TinyFish wallet | OK (balance present) |
| TinyFish search | OK |
| AgentRouter direct | Aliyun WAF HTML |
| AgentRouter + Tor SOCKS | OK (`deepseek-v4-flash`) |
| CDP | Waiting on portal keys from operator |

## Vercel MCP
Authenticate Vercel MCP in Cursor to let the agent list projects, set env, and inspect deployments. Auth timed out on 2026-09-27; use dashboard/CLI until re-authed.
