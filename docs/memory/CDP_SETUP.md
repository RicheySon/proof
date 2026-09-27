# CDP / AgentKit wallet — exact portal flow (PROOF)

**Goal:** get four secrets into `.env` / Vercel so PROOF can send a real Base Sepolia USDC transfer after SERV + code gate ALLOW.

```bash
CDP_API_KEY_ID=...
CDP_API_KEY_SECRET=...
CDP_WALLET_SECRET=...
CDP_EVM_ADDRESS=0x...   # funded Base Sepolia account
PROOF_NETWORK=base-sepolia
```

**Never** put these in git, screenshots, client bundles, or chat. Rotate anything already pasted.

Official sources (fact-checked 2026-09-27):
- Portal: https://portal.cdp.coinbase.com
- Auth (Secret API Key + Wallet Secret): https://docs.cdp.coinbase.com/api-reference/v2/authentication
- API-key wallet quickstart: https://docs.cdp.coinbase.com/wallets/quickstart/api-key-auth
- Faucets (ETH + USDC on Base Sepolia): https://docs.cdp.coinbase.com/faucets/introduction/quickstart
- Send transaction REST: https://docs.cdp.coinbase.com/api-reference/v2/rest-api/evm-accounts/send-transaction

PROOF uses the CDP REST rail (`jose` JWT + `viem` USDC calldata) — not the heavy `@coinbase/agentkit` SDK in the worker bundle. Same portal credentials.

---

## A) Sign in + project

1. Open https://portal.cdp.coinbase.com and sign in (Coinbase account).
2. Create or select a **project** from the top project drop-down (every key is project-scoped).
3. Stay on that project for all steps below.

---

## B) Secret API Key → `CDP_API_KEY_ID` + `CDP_API_KEY_SECRET`

Docs path: API Authentication → Secret API Key.

1. In the portal, open **API Keys** (API Keys dashboard).
2. Confirm the correct **project** is selected (top drop-down).
3. Open the **Secret API Keys** tab (not Client API Key — Client keys are for browser JSON-RPC only).
4. Click **Create API key** → name it e.g. `proof-serv-hack`.
5. Optional settings:
   - IP allowlist (skip for local/Cursor VM unless you know fixed IPs)
   - Permission restrictions (leave broad enough for EVM accounts + send transaction)
   - Signature algorithm: **Ed25519 recommended** (PROOF’s JWT path supports Ed25519/ES256)
6. Click **Create**.
7. Modal shows key details **once**:
   - Copy **API Key ID** → `CDP_API_KEY_ID`
   - Copy **API Key Secret** → `CDP_API_KEY_SECRET`
8. Optional: **Download API key** file for CLI — prefer env vars for PROOF.
9. Close the modal. If you lose the secret, **Configure → delete/recreate** (you cannot view the old secret again).

Paste into local `.env` only:
```bash
CDP_API_KEY_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
CDP_API_KEY_SECRET=...base64...
```

---

## C) Wallet Secret → `CDP_WALLET_SECRET`

Required for any wallet write (create account, sign, send). Combined with the Secret API Key to build the `X-Wallet-Auth` JWT.

Docs path: API Authentication → Wallet Secret.

1. In the portal, open the **Non-custodial Wallet** dashboard (Wallets / Non-custodial).
2. Confirm the same **project** is selected.
3. Find the **Security** section.
4. Click **Generate** (Wallet Secret).
5. Save the secret immediately — **you will not see it again**.
6. Put it in `.env` as `CDP_WALLET_SECRET=...`

Coinbase never sees this secret (TEE-generated). Treat it like a password. Never ship it to the browser.

---

## D) Create a Base Sepolia EVM account → `CDP_EVM_ADDRESS`

Fastest path: CDP CLI (same keys).

```bash
npm install -g @coinbase/cdp-cli

# Point CLI at your downloaded key files OR env (see CDP CLI docs)
cdp env live --key-file ./cdp_api_key.json
cdp env live --wallet-secret-file ./cdp_wallet_secret.txt

cdp evm accounts create name=proof-spender
# → prints 0x… address
```

Or SDK one-liner (after keys are in `.env`):

```bash
npx --yes tsx -e '
import { CdpClient } from "@coinbase/cdp-sdk";
import "dotenv/config";
const cdp = new CdpClient();
const account = await cdp.evm.createAccount({ name: "proof-spender" });
console.log(account.address);
'
```

Copy the `0x` + 40 hex address → `CDP_EVM_ADDRESS`.

Portal alternative: create/view the account under Non-custodial Wallet → Accounts, then copy the address.

---

## E) Fund Base Sepolia — ETH (gas) + USDC (transfer)

PROOF sends **USDC** on **base-sepolia**. You need:
- **ETH** for gas
- **USDC** for the transfer amount

### Portal UI faucet (easiest)

1. Portal → **Faucets**: https://portal.cdp.coinbase.com (Faucets nav)
2. Network: **Base Sepolia**
3. Token: **ETH** → paste `CDP_EVM_ADDRESS` → **Claim**
4. Token: **USDC** → same address → **Claim**
5. Confirm on https://sepolia.basescan.org/address/YOUR_ADDRESS

### Programmatic faucet (same keys)

```typescript
import { CdpClient } from "@coinbase/cdp-sdk";
import "dotenv/config";

const cdp = new CdpClient();
const address = process.env.CDP_EVM_ADDRESS!;

const eth = await cdp.evm.requestFaucet({
  address,
  network: "base-sepolia",
  token: "eth",
});
const usdc = await cdp.evm.requestFaucet({
  address,
  network: "base-sepolia",
  token: "usdc",
});
console.log("ETH", eth.transactionHash);
console.log("USDC", usdc.transactionHash);
```

Rate limits exist (ETH ~1000 claims / 24h @ 0.0001 ETH; ERC-20 daily caps by token). Retry later if faucet rejects.

---

## F) Wire into PROOF + verify

Local `.env` (gitignored):
```bash
CDP_API_KEY_ID=...
CDP_API_KEY_SECRET=...
CDP_WALLET_SECRET=...
CDP_EVM_ADDRESS=0xYourFundedAddress
PROOF_NETWORK=base-sepolia
```

Vercel → Project → Settings → Environment Variables → **Production + Preview** → same four names → Redeploy.

Sanity:
1. Open `/integrations` → AgentKit/CDP shows **Connected** (not “Key required”).
2. `/gate` → Load $1 allow (allowlisted payee) → Prove → receipt has real `0x` tx hash on Base Sepolia.
3. Deny / replay paths still produce **no** tx hash.

If any CDP secret is missing, PROOF returns `CONFIG_REQUIRED` and never invents a hash.

---

## G) What each secret is used for (PROOF)

| Secret | Role in PROOF |
|--------|----------------|
| `CDP_API_KEY_ID` + `CDP_API_KEY_SECRET` | Bearer JWT (`Authorization`) proving project ownership |
| `CDP_WALLET_SECRET` | `X-Wallet-Auth` JWT with `reqHash` for send/sign |
| `CDP_EVM_ADDRESS` | From-account for `POST /platform/v2/evm/accounts/{address}/send/transaction` |

Auth reference: https://docs.cdp.coinbase.com/api-reference/v2/authentication

---

## H) Common failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| Integrations: CDP Key required | Env not loaded / wrong Vercel env scope | Set all four vars; redeploy |
| Auth 401 / JWT invalid | Wrong ID/secret or Ed25519 vs ES256 mismatch | Recreate Secret API Key; paste both ID + Secret |
| Wallet auth fail | Missing/wrong Wallet Secret | Regenerate Wallet Secret in Security; update env |
| Send fails / insufficient funds | No ETH gas or no USDC | Re-run Base Sepolia faucet for both tokens |
| Wrong network | Mainnet address / wrong `PROOF_NETWORK` | Keep `base-sepolia` for the hackathon demo |

---

## Checklist (copy when done)

- [ ] Secret API Key created (Ed25519) → ID + Secret saved
- [ ] Wallet Secret generated once → saved
- [ ] EVM account created → address in `CDP_EVM_ADDRESS`
- [ ] Base Sepolia faucet: ETH claimed
- [ ] Base Sepolia faucet: USDC claimed
- [ ] Local `.env` updated (not committed)
- [ ] Vercel Production + Preview env set + redeployed
- [ ] `/integrations` CDP Connected
- [ ] `/gate` $2 ALLOW shows live Base Sepolia tx hash
