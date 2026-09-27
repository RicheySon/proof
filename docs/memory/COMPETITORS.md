# Competitor scout · SERV Edition 01 / AgentKit (2026-09-27)

Sources: OpenServ hackathon page, @openservai posts, Tavily/TinyFish discovery. Public submission posts are sparse this close to deadline — most teams post X + form in the final hours. We rotate against **track intent** and **known AgentKit patterns**, not invented rival repos.

## What the track is asking for

OpenServ wants SERV Reasoning to look **load-bearing**: Multipath branching, Shadow validation, PromptGuard — not “chat with a base URL.” AgentKit track wants **onchain money movement** that is enterprise-grade (payments / spend / commerce), not a portfolio toy.

Judge criteria we map to: **Creativity · User-readiness · Revenue potential**.

## Patterns we expect peers to ship

| Peer pattern                                    | Risk to us if we ignore it                    | PROOF answer                                           |
| :---------------------------------------------- | :-------------------------------------------- | :----------------------------------------------------- |
| Chat agent + AgentKit transfer, no policy brake | Looks flashy; drains wallets                  | Fail-closed SERV + **code gate** before CDP            |
| Regex / heuristic “policy”                      | Breaks under prose                            | SERV structured JSON + Multipath; code still owns caps |
| Mock / simulated tx hashes                      | Instant DQ on honesty                         | Live Base Sepolia USDC only                            |
| Prompt-only allowlist                           | Injection / truncation loopholes              | Exact address equality + PromptGuard declared          |
| No replay story                                 | Misses the social pain (“same payment twice”) | Idempotency → DENY · REPLAY receipt                    |
| SDK dump with no product                        | Hard for grandma judges                       | One Gate, one soft sentence, Basescan link             |

## What we picked up (and shipped)

1. **Dual proof** — SERV reasons; code enforces. Shadow `hint` is criteria text, not a numeric enforcer (live docs binding).
2. **Agent-callable API** — `POST /api/v1/evaluate` so other agents can buy the gate (revenue story).
3. **Daily budget** — rolling UTC spend ceiling on top of per-transfer cap.
4. **Honest flaws ledger** — Folio-style: show the loopholes we closed.
5. **CDP REST rail** — proves AgentKit-track wallet depth without a broken worker bundle.

## OpenServ signal (live posts)

- Pair SERV Reasoning with @CoinbaseDev AgentKit for enterprise-grade onchain agents (payments / DeFi / commerce).
- Reliability + auditability are the brand: long instructions, prompt protection, path behind each decision.
- Submit: public X + form · data collection ON · deadline **28 Sep 2026 00:00 UTC**.

We keep rotating: if a stronger public AgentKit submission appears with a real loophole we missed, log it here and patch before submit.
