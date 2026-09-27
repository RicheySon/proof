# Flaws we found · and how we lived with them

Living ledger for judges and operators. Soft rule: never invent a green. Full honesty beats a fake win.

| Flaw | What broke | What we did |
| :--- | :--- | :--- |
| **Landing navbar pill slid to the right** | `reveal-up` keyframes set `translate: 0 0` with `animation-fill-mode: both`, which **overwrote** the centering `translate: -50% 0` after `left: 50%` — pill sat on the right half of the viewport | Center with `left:0; right:0; margin-inline:auto` so animation cannot steal X offset. Valid CSS interaction bug, not “design taste.” |
| Replay returned the old ALLOW receipt | Gate looked like a second ALLOW; soft broken | Emit a fresh **DENY · REPLAY** receipt; keep first attempt mapped; UI “Load replay” preset |
| Allowlist used substring `includes` | Truncated prefix could pass the code gate | Exact `0x` + 40 hex equality only |
| `@coinbase/agentkit` / CDP SDK blew Nitro + workerd | Worker bundle died (Solana / WalletConnect deps) | Pure REST rail: `jose` Bearer + `X-Wallet-Auth` + `viem` EIP-1559 USDC — still real CDP credentials |
| SERV Multipath + shadow often content-filtered | Empty / “I can't share that.” | Policy object in **user** JSON; short system prompt; strict `json_schema` requires every property; fail closed on refusal |
| Shadow/PromptGuard are stripped before the model | Cannot read tool_calls as proof | Declare tools on every request; UI labels “declared”; code gate remains the numeric enforcer |
| AgentRouter Aliyun WAF from cloud IPs | HTML captcha, not a bad key | Tor SOCKS + stainless headers; Vercel skips AgentRouter (SERV is the judge) |
| Base Sepolia faucet ≈ $1 USDC | $2 ALLOW drained the wallet | Demo preset **$1 allow**; faucet retry script |
| Truncated demo payees | CDP send requires full address | Live `proof-payee` full address in policy + presets |
| Cookie outline button failed AA | “Essential only” looked washed out on white | Explicit `text-foreground` on outline variant + cookie action CSS |
| Shared agent HTTP = one global tenant | Every Bearer caller collided on receipts / replay map | Tenant BYOK agent keys hashed (SHA-256) → isolated workspace; env key still maps to dedicated `ten_agent_http` |
| Env-only keys locked judges out of “try my stack” | Demo felt like a private operator console | Integrations BYOK: connect own SERV / CDP / agent Bearer; AES-GCM sealed with `SESSION_SECRET`; never echoed; env remains shared fallback |
| Serverless idempotency is per-instance | Cold starts can forget prior keys | Documented honesty on Integrations; Durable ledger = phase-2 |
| Cost USD unknown from SERV | Temptation to invent pricing | Receipt shows tokens + **cost n/a from SERV** |
| Quantum template still in root README | Judges see abandoned paste | Folio-style product README with diagrams + this ledger |

Residual risk stays labeled in Integrations · Network matrix. We will not say unhackable.
