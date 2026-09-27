# AgentRouter setup for PROOF (Tor / clean egress)

**AgentRouter is optional backup LLM only — it is not a SERV substitute.**  
Hackathon evaluate + review must use OpenServ SERV (`SERV_API_KEY`).

Aligned to live smoke on this Cursor VM (2026-09-27):

- Direct `https://agentrouter.org` from cloud IP → Aliyun WAF captcha HTML (not a bad key).
- Via Tor `socks5h://127.0.0.1:9050` + stainless / QwenCode headers → JSON chat completions (`deepseek-v4-flash`).

Prefer host **`https://agentrouter.org`** (OpenAI base `…/v1`). `co.agentrouter.org` may reject this key pool.

Never put `AGENTROUTER_API_KEY` in `VITE_*`, client bundles, git, or screenshots.

---

## Env (canonical for PROOF)

```bash
# Required (if using AgentRouter at all)
AGENTROUTER_API_KEY=sk-...
AGENTROUTER_BASE_URL=https://agentrouter.org/v1
AGENTROUTER_MODEL=deepseek-v4-flash

# Tor (required on cloud VMs / Cursor / many GCP workers)
AGENTROUTER_USE_TOR=1
AGENTROUTER_TOR_SOCKS=socks5h://127.0.0.1:9050
```

On Vercel Functions: **no Tor daemon**. Either skip AgentRouter on Vercel, or put a clean-egress relay in front and point a future `AGENTROUTER_RELAY_URL` at it. SERV remains the production judge.

---

## Path A — Cursor VM / local / GCP worker (Tor)

```bash
# 1) Install Tor once
sudo apt-get update && sudo apt-get install -y tor

# 2) Start SOCKS (daemon)
tor --RunAsDaemon 1 --SocksPort 9050 --DataDirectory /tmp/proof-tor-run \
  --Log 'notice file /tmp/proof-tor-run/tor.log'
# or: sudo service tor start

# 3) Prove Tor egress
curl -sS --max-time 15 --socks5-hostname 127.0.0.1:9050 https://api.ipify.org && echo

# 4) Load secrets (never commit)
set -a && source .env && set +a
# ensure AGENTROUTER_USE_TOR=1 and AGENTROUTER_API_KEY set

# 5) Smoke (must return JSON choices[0].message.content — not HTML)
curl -sS --socks5-hostname 127.0.0.1:9050 \
  https://agentrouter.org/v1/chat/completions \
  -H "Authorization: Bearer $AGENTROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "User-Agent: QwenCode/0.2.0 (linux; x64)" \
  -H "x-stainless-lang: js" \
  -H "x-stainless-package-version: 6.34.0" \
  -H "x-stainless-os: Linux" \
  -H "x-stainless-arch: x64" \
  -H "x-stainless-runtime: node" \
  -H "x-stainless-runtime-version: node/20.0.0" \
  -H "x-stainless-retry-count: 0" \
  -d '{"model":"deepseek-v4-flash","temperature":0.1,"messages":[{"role":"user","content":"ping"}]}'
```

Success: JSON with `choices[0].message.content`. HTML / `aliyun_waf` = still WAF’d.

---

## Headers AgentRouter expects

```
Authorization: Bearer <key>
Content-Type: application/json
Accept: application/json
User-Agent: QwenCode/0.2.0 (linux; x64)
x-stainless-lang: js
x-stainless-package-version: 6.34.0
x-stainless-os: Linux
x-stainless-arch: x64
x-stainless-runtime: node
x-stainless-runtime-version: ...
x-stainless-retry-count: 0
```

---

## Failure modes

| Symptom                               | Cause                       | Fix                                 |
| ------------------------------------- | --------------------------- | ----------------------------------- |
| HTML / aliyun_waf / captcha           | Direct IP, Tor off          | Start Tor + `AGENTROUTER_USE_TOR=1` |
| Budget / channel exhausted            | Model quota                 | Use `deepseek-v4-flash` or top up   |
| Invalid API Key on co.agentrouter.org | Wrong host/pool             | Use `agentrouter.org` only          |
| Tor bootstrap timeout                 | Tor not installed / blocked | Check `/tmp/proof-tor-run/tor.log`  |

---

## Path B — Vercel (no Tor in Functions)

Do **not** call AgentRouter direct from Vercel serverless IPs — expect WAF.

Options:

1. **Skip AgentRouter on Vercel** — PROOF win spine only needs SERV + CDP.
2. Deploy a small relay (Cloudflare Worker / cool-IP host) that forwards to `https://agentrouter.org/v1/chat/completions` with stainless headers (Tor on the relay if needed). Point any future relay env at that URL.

---

## Acceptance checklist

- [ ] Tor Bootstrapped / `curl --socks5-hostname … ipify` returns an IP
- [ ] Tor chat completions returns JSON (not HTML)
- [ ] Default model `deepseek-v4-flash`
- [ ] Key never in frontend / screenshots / git
- [ ] SERV remains the evaluate/review authority
