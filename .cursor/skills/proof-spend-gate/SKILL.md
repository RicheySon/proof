---
name: proof-spend-gate
description: Implements PROOF fail-closed spend evaluation, code gate, AgentKit transfer, and receipts. Use when changing gate, evaluate, transfer, policies, or receipt flows.
---

# PROOF spend gate

## Workflow
1. Read `docs/memory/ARCHITECTURE.md` and `KEYS_STATUS.md`.
2. Call SERV with Multipath model + structured schema + shadow + prompt guard.
3. Run `code-gate` (cap, allowlist, idempotency) regardless of model prose.
4. Transfer only on ALLOW + CDP configured.
5. Always write a receipt; DENY has no tx.

## Tests
- Over cap → DENY, no chain
- Unknown payee → DENY
- Same idempotency key twice → DENY `REPLAY`
- Missing SERV key → `CONFIG_REQUIRED`
- Missing CDP on ALLOW path → `CONFIG_REQUIRED`, no fake hash
