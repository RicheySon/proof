# PROOF — Extreme Win Bible (FINAL · SERV Hackathon Edition 01)

> Canonical project bible. Prefer live OpenServ docs over assumptions.  
> Fact-check log: [`FACTCHECK.md`](FACTCHECK.md) · Lock decisions: [`SESSION_LOG.md`](SESSION_LOG.md)

**Host:** OpenServ · Edition **01** · online **14–28 Sep 2026**  
**Submit:** **28 Sep 2026 00:00 UTC** · X post (@openservai) + form · org **data collection ON**  
**Track:** **AgentKit** (primary) · optional Open  
**Prize door:** $1k SERV track · chase +$1k USDC overall  
**Criteria:** Creativity · user-readiness · revenue potential

---

## Soft (plain — anyone)

Your agent cannot move money until SERV proves the policy passed — including a second try of the same payment.

## Social pain (X+Reddit, 2026-09-24)

@moh1to: replay and a bad invoice still drain an agent wallet. “Is there a per-call spend limit baked in yet?” @thecorgod1234: x402 gave agents a card; the missing piece is a limit.

PROOF denies three things: over the cap, a payee not on the list, and the same action paid twice. The receipt says which rule fired.

## Unique job

**Fail-closed policy proof before AgentKit spend.**  
SERV Multipath + Shadow Agent decide ALLOW/DENY. Code refuses AgentKit transfer unless ALLOW. Receipt or nothing.

> Depth: policy system prompt → structured decision → `serv_shadow_agent` hint (numeric caps) → `serv_prompt_guard` → only then CDP/AgentKit transfer → public receipt (cost · latency · shadow · tx).

### Binding correction (live docs 2026-09-27)

- Shadow `hint` is **validation criteria text**, not a numeric enforcer.
- Caps, allowlist, and replay **must be enforced in server code** after structured ALLOW/DENY.
- Multipath **does not authorize side effects** — application owns the fail-closed gate.
- Replay (“second try of same payment”) = **idempotency key** in product logic.

## 8-second

Policy: “Never send > $5 or to unknown addresses.”  
Agent tries $50 → **DENIED** (shadow fail / code gate).  
Agent tries $2 to allowlist → **ALLOW** → Base Sepolia transfer → receipt.

## Beachhead

**Week-1:** Builders shipping Coinbase AgentKit agents (Discord/TG + SERV hack room).  
**Year-1:** Agent-ops / treasury bots that need procurement-grade spend brakes. Accra = build base.

## Pitch order

1. Runaway agent pain · 2. Deny on camera · 3. Why SERV (not regex) · 4. AgentKit live tx · 5. Receipt metrics · 6. Who pays (per-ALLOW / ops SaaS)

Never lead “AI portfolio manager,” AXIS yield, or POCKET clone.

## Scoring map

| Criterion             | Hit                                                           |
| --------------------- | ------------------------------------------------------------- |
| **Creativity**        | Fail-closed proof gate — not chat with base URL               |
| **User-readiness**    | Bad→block / good→tx · empty + deny states · one-sentence soft |
| **Revenue potential** | Agent-ops pays per ALLOW or monthly gate                      |

## Network truth

| Thing           | Where                                                    |
| --------------- | -------------------------------------------------------- |
| SERV Reasoning  | `https://inference-api.openserv.ai/v1` · $5 start credit |
| AgentKit wallet | CDP · **Base Sepolia** labeled                           |
| IXS vault       | Phase-2 only if API open — don’t block submit            |
| RH MCP          | Parked — access unverified · AXIS overlap                |

## Architecture

```
User / agent intent
  → PROOF (app)
      → SERV Multipath model + structured ALLOW/DENY schema
      → serv_shadow_agent (hint = caps / allowlist / abstain rules)
      → serv_prompt_guard
  → deterministic code gate (cap · allowlist · idempotency)
  → if DENY: stop · show receipt · no chain
  → if ALLOW: AgentKit transfer · append tx to receipt
```

## Mandatory spine

SERV base URL · Multipath **or** hard multipath-worthy policy prompt · Shadow + PromptGuard  
Structured ALLOW/DENY · **code fail-closed** (Day One: side effects in app)  
AgentKit CDP transfer · Base Sepolia  
Receipt: prompt version · shadow outcome · tokens · latency · cost · tx  
Console data collection ON · public repo · X + form

## Honesty

Testnet labeled. Not financial advice. No fake mainnet. IXS/RH not claimed live unless integrated. No “unhackable.”  
No mocks / no silent fallbacks: missing secrets → fail closed, never invent ALLOW or tx hashes.

## Kill list

Base-URL wrapper · trading chatbot · IXS-only without access · RH-first · POCKET/AXIS clone · soft that needs a paragraph

## Build

| Phase              | Ship                                                                |
| ------------------ | ------------------------------------------------------------------- |
| 0                  | Memory + rules + skills + server evaluate/deny path                 |
| 1                  | AgentKit wire · Sepolia allow tx (when CDP secrets land)            |
| 2                  | Receipt UI · cost/latency · X assets · reviewer · layout · favicons |
| ≤ 28 Sep 00:00 UTC | Post + form + data collection                                       |

## Pitch (15s)

Agents can already spend with AgentKit. PROOF makes them prove the policy with SERV first — or the money never moves.

## Identity

Henry Sam Marfo · @henrysammarfo · jasonneil4040@gmail.com
