# PROOF Product Experience

## Goal
Build a complete, presentation-ready PROOF product demo based on the attached hackathon brief. Preserve the supplied Quantum² template’s precise visual language—Figtree, black pill navigation, cyan media field, tight typography, restrained motion, and fixed product composition—but replace its identity and content with PROOF.

The result will be a routed TanStack app rather than a standalone `index.html`, because the approved scope requires seven real pages and connected flows.

## Brand and visual system
- Create a merch-ready **PROOF Seal** identity in black, cyan, and white.
- Explore two distinct seal constructions within the selected direction, then use the strongest compact option across navigation, receipts, status stamps, favicon treatment, and product surfaces.
- Pair the seal with a bold PROOF logo lockup and concise line: “Policy passed. Then money moves.”
- Rebuild the supplied template as reusable design tokens: exact Figtree variable family, close-set type, black controls, cyan accent/media field, pale gray work surfaces, crisp borders, and minimal rounding.
- Use Lucide’s consistent premium-feeling icon set for interface actions; no emoji or improvised symbols.
- Preserve the template’s entrance rhythm and reduced-motion behavior while adapting layouts for full pages and mobile screens.

## Pages and routes
1. **`/` — Landing**
   - One-screen, template-matched introduction with PROOF copy, video-backed cyan band, and a live-looking policy receipt mockup.
   - Immediate “Run the demo” path and concise proof points: fail-closed, SERV reasoning, Base Sepolia, public receipt.

2. **`/gate` — Spend Gate**
   - Main interactive workflow with policy selection, recipient, amount, transfer intent, allowlist state, and network label.
   - Two fast presets reproduce the brief: `$50 → DENIED` and `$2 allowlisted → ALLOW`.
   - Staged evaluation shows Multipath reasoning, Shadow Agent, PromptGuard, and the final code gate.
   - DENY ends without a transaction; ALLOW produces a simulated Base Sepolia transaction and receipt.

3. **`/receipts` — Receipts**
   - Searchable/filterable receipt ledger with ALLOW and DENY states, timestamps, costs, latency, shadow result, and transaction status.
   - Receipt detail drawer/view with copyable receipt ID and transaction hash where applicable.

4. **`/policies` — Policies**
   - Policy list plus editable policy workspace for caps, allowlisted addresses, abstain behavior, and prompt version.
   - Preview the natural-language rule and resulting structured policy.

5. **`/analytics` — Analytics**
   - Scannable operating metrics: evaluated spend, blocked value, allow rate, latency, cost, and decision trend.
   - Charts and breakdowns use honest simulated/demo labeling.

6. **`/integrations` — Integrations**
   - SERV, AgentKit/CDP, and Base Sepolia connection states.
   - IXS and RH MCP remain explicitly parked/unverified, matching the brief.

7. **`/settings` — Settings**
   - Demo organization, default network, receipt visibility, and safety defaults.
   - Honest testnet and non-financial-advice notices.

## Connected demo flow
```text
Landing → Run demo → Enter intent → SERV evaluation
  ├─ DENY → stop before transfer → denial receipt
  └─ ALLOW → simulated Base Sepolia transfer → transaction receipt
                                      ↓
                            Receipts / Analytics
```

- Keep demo state shared across routes for the current browser session without adding a live backend.
- Include populated, empty, evaluating, success, denied, and error/retry presentation states.
- Every navigation item, primary action, filter, dialog, menu, and demo preset will work.
- Clearly label all generated activity as simulated and Base Sepolia as testnet; never imply a live mainnet transfer.

## Structure and responsive behavior
- Build a shared public navigation on the landing page and a compact product shell for the six operational pages.
- Use real route files and route-aware links, with a mobile navigation menu and no dead destinations.
- Keep the landing composition close to the supplied 1290×860 reference and adapt the product pages to desktop and phone layouts.
- Verify at 1290×860 and approximately 390px wide, including menu behavior, no accidental overlap, and readable dense data.

## Metadata and quality checks
- Give every route unique PROOF-specific title, description, Open Graph title/description, `og:type`, and Twitter card metadata.
- Remove all placeholder Lovable metadata and placeholder home content.
- Validate the two core demo paths end-to-end: denied spend never creates a transaction; allowed spend creates a receipt with simulated transaction data.
- Check page navigation, mobile layout, keyboard focus, reduced motion, and browser console errors before completion.

## Scope boundary
- This version is a complete interactive demo, not a live SERV or AgentKit integration.
- No real funds move, no credentials are required, and data does not persist across devices.
