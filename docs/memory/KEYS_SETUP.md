# KEYS + VERCEL SETUP (do this in order)

**Rule:** never paste secrets into git, chat, or screenshots. Put them only in local `.env` and Vercel Project Settings → Environment Variables. Rotate anything already pasted in chat after the hack.

Copy from [`.env.example`](../../.env.example).

---

## 0) Generate `SESSION_SECRET` (required before any real session)

```bash
openssl rand -base64 48
```

Put the output in:
- local `.env` as `SESSION_SECRET=...`
- Vercel → Project → Settings → Environment Variables → Production + Preview

Without this, tenant cookies fail closed (`CONFIG_REQUIRED`).

---

## 1) OpenServ SERV (required for evaluate + review)

| Step | Action | Link |
|------|--------|------|
| 1.1 | Create / sign in to OpenServ | https://console.openserv.ai |
| 1.2 | Open organization settings and turn **data collection ON** (hackathon eligibility) | https://console.openserv.ai/settings/organization |
| 1.3 | Add credits if needed ($5 start credit per hackathon FAQ) | https://console.openserv.ai |
| 1.4 | Create API key → copy once | https://console.openserv.ai (API keys / playground area) |
| 1.5 | Read SERV quickstart (base URL + system prompt required) | https://docs.openserv.ai/serv-reasoning/introduction |
| 1.6 | Tools used by PROOF: `serv_shadow_agent`, `serv_prompt_guard`, Multipath model suffix | https://docs.openserv.ai/serv-reasoning/tools · https://docs.openserv.ai/serv-reasoning/tutorials/multipath |

**Env to set**
```bash
SERV_API_KEY=...
SERV_MODEL=gpt-5.4-mini-serv-multipath   # optional override
SERV_BASE_URL=https://inference-api.openserv.ai/v1   # optional
```

**Sanity check:** Integrations page should show SERV as Connected (not “Key required”). Gate Evaluate enables.

---

## 2) Coinbase CDP (required for live Base Sepolia transfer)

**Full click-by-click walkthrough:** [`CDP_SETUP.md`](CDP_SETUP.md)

| Step | Action | Link |
|------|--------|------|
| 2.1 | Create CDP account / select project (top drop-down) | https://portal.cdp.coinbase.com |
| 2.2 | **API Keys** → **Secret API Keys** tab → **Create API key** (Ed25519) → save ID + Secret | https://docs.cdp.coinbase.com/api-reference/v2/authentication |
| 2.3 | **Non-custodial Wallet** → **Security** → **Generate** Wallet Secret (shown once) | same auth doc → Wallet Secret |
| 2.4 | Create EVM account (`cdp evm accounts create` or portal Accounts) → copy `0x` address | https://docs.cdp.coinbase.com/wallets/quickstart/api-key-auth |
| 2.5 | **Faucets** → Base Sepolia → claim **ETH** then **USDC** to that address | https://docs.cdp.coinbase.com/faucets/introduction/quickstart |
| 2.6 | Auth model (Bearer JWT + `X-Wallet-Auth`) | https://docs.cdp.coinbase.com/api-reference/v2/authentication |
| 2.7 | Send tx API | https://docs.cdp.coinbase.com/api-reference/v2/rest-api/evm-accounts/send-transaction |

**Env to set**
```bash
CDP_API_KEY_ID=...
CDP_API_KEY_SECRET=...
CDP_WALLET_SECRET=...
CDP_EVM_ADDRESS=0xYourFundedBaseSepoliaAccount
PROOF_NETWORK=base-sepolia
```

**Sanity check:** Integrations shows AgentKit/CDP Connected. ALLOW path can append a real tx hash (still testnet — not financial advice).
---

## 3) Vercel hosting (frontend)

| Step | Action | Link |
|------|--------|------|
| 3.1 | Import / open the GitHub repo on Vercel | https://vercel.com/new |
| 3.2 | Framework: Vite / TanStack Start (auto-detect from repo) | — |
| 3.3 | Add **all** env vars from sections 0–2 to Production + Preview | Project → Settings → Environment Variables |
| 3.4 | Redeploy after saving env | Deployments → Redeploy |
| 3.5 | Open the deployment URL → `/gate` | your `*.vercel.app` URL |

### Vercel MCP (this agent)
Vercel MCP auth **timed out** in this run — approve/authenticate the Vercel MCP connection in Cursor, then ask again to:
- list projects
- push env vars
- inspect deployments

Until MCP is authed, use the Vercel dashboard or CLI:
```bash
npx vercel login
npx vercel link
npx vercel env add SESSION_SECRET
npx vercel env add SERV_API_KEY
npx vercel env add CDP_API_KEY_ID
npx vercel env add CDP_API_KEY_SECRET
npx vercel env add CDP_WALLET_SECRET
npx vercel env add CDP_EVM_ADDRESS
npx vercel --prod
```

---

## 4) Optional helper keys (not required for submit spine)

| Key | Get it | Notes |
|-----|--------|-------|
| TinyFish | https://agent.tinyfish.ai/api-keys · docs https://docs.tinyfish.ai | Search + wallet APIs; fund wallet at https://agent.tinyfish.ai/wallet |
| Tavily | https://app.tavily.com | Research / fact-check |
| AgentRouter | https://agentrouter.org | Backup LLM only — **not** a SERV substitute. Cloud IPs need Tor — see [`AGENTROUTER_SETUP.md`](AGENTROUTER_SETUP.md) |
---

## 5) Live demo script (&lt; 2 min) — after keys are set

1. Soft (one line): *Your agent cannot move money until SERV proves policy — including a second try of the same payment.*
2. Open `/gate` → **Load $50 deny** → Prove → expect **DENY**, rule e.g. `OVER_CAP` / `PAYEE_NOT_ALLOWLISTED`, **no tx**.
3. **Load $2 allow** (allowlisted recipient) → Prove → expect **ALLOW** → Base Sepolia tx on receipt.
4. Re-run with the **same idempotency key** → **REPLAY** DENY.
5. Open `/receipts` → show cost/latency/shadow/rule/tx.
6. Honesty: Base Sepolia testnet · not financial advice · no “unhackable”.

Official submit: https://www.openserv.ai/hackathon  
Deadline: **28 Sep 2026 00:00 UTC** · X post tag **@openservai** · then the form · data collection ON.

---

## 6) Fail-closed checklist (what “done” looks like)

- [ ] `/integrations`: SERV Connected, CDP Connected, Tenant session Ready
- [ ] `/gate` Evaluate enabled
- [ ] $50 deny leaves **no** tx hash
- [ ] $2 allow produces `0x…` 64-byte hash on receipt
- [ ] Replay same idempotency key → DENY `REPLAY`
- [ ] `/review` returns structured risks (not connection-required)
- [ ] Vercel URL loads mobile + desktop without clipped landing receipt
