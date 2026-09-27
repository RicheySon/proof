# WIN CHECKLIST — SERV Edition 01 / AgentKit

## Product

- [x] Soft one sentence: policy proof before money moves (incl. replay)
- [x] Demo &lt; 2 min: $50 DENY (no tx) → $1 ALLOW (Sepolia tx live) → replay DENY
- [x] Receipt shows: prompt version, shadow, tokens, latency, cost n/a honesty, rule fired, Basescan tx
- [x] Testnet labeled; not financial advice; no “unhackable”
- [x] Integrations: SERV/AgentKit honest status + network matrix; IXS/RH parked
- [x] Review page: connection-required until SERV key; structured risk analysis when live
- [x] Agent HTTP API `POST /api/v1/evaluate`
- [x] Folio-style human README with mermaid diagrams

## Technical

- [x] Fail-closed code gate (cap, exact allowlist, idempotency, daily budget)
- [x] No localStorage for sessions/receipts
- [x] No mocks / no fake tx hashes
- [x] Favicons + metadata on every route
- [x] Landing layout OK at ~1290×860 and ~390px
- [x] Build/lint/test clean (`npm run test:gate` · `npm run build`)
- [x] Replay returns DENY · REPLAY receipt (not the old ALLOW)
- [x] Flaws + competitor scout documented

## Submit (official — human)

- [x] Keys + Vercel live (SERV + CDP + SESSION_SECRET)
- [ ] **Make GitHub repo PUBLIC** — currently private (blocking for judges)
- [ ] console.openserv.ai org **data collection ON** — https://console.openserv.ai/settings/organization
- [ ] Public X post: name, concept, images, github/demo, tag **@openservai**
- [ ] Fill official form after the post — https://form.typeform.com/to/A475N331 (from https://www.openserv.ai/hackathon)
- [ ] Deadline: **28 Sep 2026 00:00 UTC**

Full copy-paste kit: [`SUBMIT_KIT.md`](SUBMIT_KIT.md)

## Pitch order

Pain → deny on camera → why SERV → AgentKit live tx → receipt metrics → who pays  
Never: AI portfolio / AXIS / POCKET clone

## Live demo order

See section 5 in [`KEYS_SETUP.md`](KEYS_SETUP.md).
