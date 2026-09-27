# KEYS STATUS

**Never commit secret values.** Store only in environment / secret manager. Rotate anything pasted in chat after the hack.

| Variable | Required for | Status |
|----------|--------------|--------|
| `SERV_API_KEY` | Evaluate + Review | **MISSING** — get at console.openserv.ai |
| `SERV_MODEL` | Evaluate (default `gpt-5.4-mini-serv-multipath`) | Optional override |
| `SERV_BASE_URL` | Default `https://inference-api.openserv.ai/v1` | Optional override |
| `CDP_API_KEY_ID` (alias `CDP_API_KEY_NAME`) | CDP / AgentKit-track transfer | **MISSING** |
| `CDP_API_KEY_SECRET` (alias `CDP_API_KEY_PRIVATE_KEY`) | CDP auth | **MISSING** |
| `CDP_WALLET_SECRET` | CDP wallet auth | **MISSING** |
| `CDP_EVM_ADDRESS` | Funded Base Sepolia 0x account for transfers | **MISSING** |
| `CDP_ACCOUNT_NAME` | Optional label (docs only) | Optional |
| `SESSION_SECRET` | Signed session cookies | Generate before deploy |
| `PROOF_NETWORK` | Default `base-sepolia` | Optional |
| `TAVILY_API_KEY` | Fact-check skill | Over plan limit |
| `TINYFISH_API_KEY` | Fact-check / browse | Search OK; automation needs wallet funds |
| `AGENTROUTER_API_KEY` | Optional LLM gateway backup | WAF may block some hosts; **not** a SERV substitute |

## Behavior without keys
- Evaluate / Review without `SERV_API_KEY` → HTTP 503 `CONFIG_REQUIRED` (no mock decision)
- Transfer without CDP secrets → HTTP 503 `CONFIG_REQUIRED` (no fake hash)
- UI shows “connection required” — never green “connected” unless secrets present
