# PROOF — Submit kit (Edition 01 · AgentKit)

**Deadline: 28 Sep 2026 00:00 UTC** · ~4h from kit write time (27 Sep ~19:44 UTC). Do these in order. I cannot post to X or fill Typeform for you.

## 0) Make the GitHub repo PUBLIC (blocking)

Repo is currently **private**. Judges need a public link.

1. https://github.com/henrysammarfo/proof/settings
2. Danger Zone → Change visibility → **Public**
3. Confirm: https://github.com/henrysammarfo/proof loads logged-out

Do **not** commit `.env`. Secrets stay in Vercel only.

---

## 1) Data collection ON (eligibility)

https://console.openserv.ai/settings/organization → enable **data collection**.

Without this you are not eligible (official FAQ).

---

## 2) Post on X (required before the form)

Attach 2–4 images from the live app (landing, gate DENY, ALLOW+Basescan, Integrations). Tag **@openservai**.

### Copy-paste post

```
PROOF — fail-closed spend gate for AI agents (AgentKit track)

Your agent cannot move money until SERV proves the policy passed — including a second try of the same payment.

Live: Multipath + PromptGuard + Shadow → deterministic code gate → CDP USDC on Base Sepolia. No mocks. Replay = DENY.

Demo: https://proof-smoky.vercel.app
GitHub: https://github.com/henrysammarfo/proof
Track: Coinbase AgentKit · SERV Reasoning

@openservai
```

Shorter alt:

```
PROOF · AgentKit track

Policy proof before AgentKit spend. SERV Multipath/Shadow/PromptGuard + code gate + live Base Sepolia USDC. Replay blocked.

https://proof-smoky.vercel.app
https://github.com/henrysammarfo/proof

@openservai
```

### Suggested images (take fresh from live if needed)

1. Landing — https://proof-smoky.vercel.app  
2. Gate DENY `$50` — `/gate` → Load $50 deny → Prove  
3. Gate ALLOW `$1` + Basescan link  
4. Integrations / BYOK or Receipts

---

## 3) Official form (after the X post)

Hackathon page: https://www.openserv.ai/hackathon  
Submit Typeform (primary “Submit now”): https://form.typeform.com/to/A475N331  

(If the page also shows another Typeform, use the one linked from **Submit now**.)

### Likely field answers

| Field | Answer |
| :--- | :--- |
| Project name | PROOF |
| Track | **AgentKit** (Coinbase) |
| One-liner / concept | Fail-closed spend gate: SERV proves policy, then AgentKit/CDP moves Base Sepolia USDC — including replay DENY. |
| Live demo | https://proof-smoky.vercel.app |
| GitHub | https://github.com/henrysammarfo/proof |
| X post URL | *(paste your post link)* |
| Team / builder | Henry Marfo · henrysammarfo |
| How SERV is used | Multipath model, `serv_prompt_guard`, `serv_shadow_agent`, strict JSON schema; fail-closed on refusal |
| How AgentKit is used | CDP Secret API Key JWT + Wallet Auth; live USDC transfer on Base Sepolia after ALLOW |
| Honesty | Testnet only · not financial advice · no unhackable claims |

---

## 4) 90-second demo script (if they ask / livestream)

1. Soft: money never moves until policy proof (incl. replay).  
2. `/gate` → **Load $50 deny** → Prove → DENY · `OVER_CAP` · no tx.  
3. **Load $1 allow** → Prove → ALLOW → open Basescan.  
4. **Load replay** → Prove → DENY · `REPLAY`.  
5. Close: Base Sepolia · not financial advice · SERV + code gate are load-bearing.

---

## Links (keep open)

| What | URL |
| :--- | :--- |
| Live | https://proof-smoky.vercel.app |
| Gate | https://proof-smoky.vercel.app/gate |
| Login / auth | https://proof-smoky.vercel.app/login |
| GitHub (after public) | https://github.com/henrysammarfo/proof |
| Data collection | https://console.openserv.ai/settings/organization |
| Hackathon | https://www.openserv.ai/hackathon |
| Form | https://form.typeform.com/to/A475N331 |
| Example smoke tx | https://sepolia.basescan.org/tx/0xe43f8675b70cabfd6efcd7db883843da075e155857c9dc5a0033504fbfa07f42 |

---

## Done when

- [ ] Repo public  
- [ ] Data collection ON  
- [ ] X post live with @openservai + images + both links  
- [ ] Typeform submitted with X URL  
- [ ] Screenshot / bookmark confirmation emails if any  
