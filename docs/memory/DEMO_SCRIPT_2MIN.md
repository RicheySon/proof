# PROOF — 2-minute demo script (AgentKit / SERV)

**Tone:** human, clear, a little swagger — not corporate.  
**Length:** ~1:50–2:00.  
**Live:** https://proof-smoky.vercel.app  
**Audience:** judges who skim. Soft first. Show money blocked, then money move, then replay.

---

## VOICEOVER SCRIPT (speak this)

### 0:00–0:12 · Hook (Landing)
> Agents are getting wallets. That’s cool — until the same invoice gets paid twice.  
> **PROOF** is the brake. Your agent cannot move money until SERV proves the policy passed.

*(Show landing. Cursor on “Run a spend check.” Click.)*

### 0:12–0:35 · Deny on camera (Gate · $50)
> Soft rule, live: never send over five dollars, never to a stranger, never the same payment twice.  
> Watch — fifty dollars to a blocked payee.

*(Click **Load $50 deny** → **Prove before transfer**.)*

> SERV reasons. The code gate double-checks.  
> **DENY.** Rule: over cap. No transaction. No Basescan. Money never left.

*(Pause on DENY receipt 2 beats.)*

### 0:35–1:05 · Why SERV + ALLOW (Gate · $1)
> This isn’t a chatbot with vibes. We load SERV Multipath, PromptGuard, and Shadow on every call — then a deterministic gate owns the numbers.  
> Now the happy path — one dollar, allowlisted payee, Base Sepolia.

*(Click **Load $1 allow** → fresh idempotency if needed → **Prove**.)*

> **ALLOW.** And there’s the live USDC transfer — real CDP AgentKit rail, real tx hash. Open Basescan if you want receipts, not screenshots.

*(Hover/click Basescan link briefly.)*

### 1:05–1:30 · Replay twist (the wow)
> Here’s the part teams forget. Same payment again.

*(Click **Load replay** → **Prove**.)*

> Fresh receipt: **DENY · REPLAY.**  
> We don’t re-show the old ALLOW and pretend it’s fine. Second try dies. That’s the soft.

### 1:30–1:50 · Product depth (fast tour)
> Every decision is a receipt — latency, tokens, shadow, rule fired.  
> Integrations: bring your own SERV and CDP keys, or use the shared demo.  
> Protect the workspace, sign out, sign back in. Agents call the same gate over HTTP.

*(Quick flash: Receipts → Integrations → back to Gate. Don’t linger.)*

### 1:50–2:00 · Close
> PROOF. Fail-closed. Testnet only — not financial advice.  
> Policy proof before money moves.  
> Live demo and GitHub in the post. Built for the AgentKit track with SERV load-bearing.  
> That’s the brake.

---

## ON-SCREEN BEATS (director)

| Time | Screen | Action |
| :--- | :--- | :--- |
| 0:00 | `/` | Full hero, brand visible, one CTA |
| 0:10 | `/gate` | Click through CTA |
| 0:15 | Gate | Load $50 deny → Prove |
| 0:28 | Gate | Hold DENY receipt |
| 0:40 | Gate | Load $1 allow → Prove |
| 0:55 | Gate | Show ALLOW + tx / Basescan |
| 1:10 | Gate | Load replay → Prove |
| 1:22 | Gate | Hold DENY · REPLAY |
| 1:32 | `/receipts` | One scroll of ledger |
| 1:40 | `/integrations` | BYOK cards flash |
| 1:50 | `/` or Gate | Soft sentence / logo |
| 2:00 | End card | URL + @openservai |

## END CARD (last frame, 3 sec)
```
PROOF
Your agent proves policy. Then money moves.
https://proof-smoky.vercel.app
github.com/henrysammarfo/proof
@openservai · AgentKit track
```

## DO / DON’T
- DO: say “fail-closed,” “replay,” “Base Sepolia,” “SERV Multipath”  
- DO: let the DENY sit so judges feel the block  
- DON’T: claim mainnet, unhackable, or financial advice  
- DON’T: rush the ALLOW tx — the Basescan link is the wow  
