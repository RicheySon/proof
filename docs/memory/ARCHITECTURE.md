# PROOF Architecture (binding)

## Unique job
Fail-closed policy proof before AgentKit spend. Receipt or nothing.

## Request path
1. Client (tenant session cookie) → `evaluateSpend`
2. SERV Multipath model + structured ALLOW/DENY + `serv_shadow_agent` + `serv_prompt_guard`
3. Deterministic **code gate**: max amount, allowlist, idempotency (replay)
4. If DENY → persist receipt, return (no chain)
5. If ALLOW and CDP configured → AgentKit Base Sepolia transfer → append tx to receipt
6. If ALLOW but CDP missing → fail closed (`CONFIG_REQUIRED`), no fake tx

## Layers
| Layer | Path | Owns |
|-------|------|------|
| UI | `src/components/proof-pages.tsx`, routes | Presentation only |
| Client API | `src/lib/proof-demo.tsx` | Calls server fns |
| Server fns | `src/lib/proof/server-fns.ts` | Authz boundary |
| SERV | `src/lib/proof/serv.server.ts` | Live inference only |
| Code gate | `src/lib/proof/code-gate.ts` | Caps / allowlist / replay |
| CDP transfer | `src/lib/proof/agentkit.server.ts` | Base Sepolia via CDP SDK |
| Store | `src/lib/proof/store.server.ts` | Tenant sessions, receipts, idempotency |
| Shared types | `src/lib/proof/types.ts` | Client+server contracts |

## Non-negotiables
- No localStorage / sessionStorage for auth or receipts
- No mock ALLOW, no fabricated tx hashes
- Missing `SERV_API_KEY` or CDP secrets → explicit config error, never silent success
- IXS / RH MCP parked until verified
