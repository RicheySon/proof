# FACTCHECK LOG

Only claims verified against live sources. Do not invent API shapes.

## 2026-09-27

### OpenServ hackathon
- **URL:** https://www.openserv.ai/hackathon
- Edition 01 online 14–28 Sep 2026; submissions close **28 Sep 00:00 UTC**
- Tracks include AgentKit (Coinbase wallets / transfers)
- $1,000 SERV per track winner; +$1,000 USDC best overall
- Criteria: creativity, user-readiness, revenue potential
- Eligibility: enable data collection at console.openserv.ai/settings/organization
- $5 start credit for API access

### SERV Reasoning API
- **Docs index:** https://docs.openserv.ai/llms.txt
- Base: `https://inference-api.openserv.ai/v1` (OpenAI SDK includes `/v1`)
- System prompt required on every request
- Tools: `serv_prompt_guard`, `serv_shadow_agent` (hint, max_iterations), `serv_disable_content_filter`
- Multipath: append `-serv-multipath` to model id; does not authorize app side effects
- Structured outputs: `response_format.json_schema` supported; still validate in app

### TinyFish
- Auth: `X-API-Key` header
- Search: `GET https://api.search.tinyfish.ai` — verified working with provided key
- Agent: `https://agent.tinyfish.ai/v1/...` — automation blocked by $0 wallet (needs top-up)

### Tavily
- Search API returned plan usage limit exceeded for provided key

### AgentRouter
- Documented OpenAI-compatible base `https://agentrouter.org/v1`
- This cloud environment receives Aliyun WAF challenge HTML instead of JSON
- Not a replacement for SERV in the AgentKit track

### Coinbase AgentKit
- Use with Base Sepolia for testnet; label clearly
- Confirm CDP env var names against current AgentKit docs at wire time (versions change)
