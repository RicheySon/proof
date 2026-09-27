---
name: proof-factcheck
description: Fact-checks OpenServ, SERV, AgentKit, and hackathon claims using live docs and TinyFish/Tavily. Use before inventing API shapes, deadlines, or prize claims.
---

# PROOF factcheck

## Rules
- Prefer https://docs.openserv.ai/llms.txt and https://www.openserv.ai/hackathon
- TinyFish Search: `GET https://api.search.tinyfish.ai` with `X-API-Key`
- TinyFish Automation needs wallet funds; Search may work at $0
- Tavily may be rate/plan limited — do not invent results
- Log verified claims in `docs/memory/FACTCHECK.md` with URL + date
- Never store API secret values in markdown
