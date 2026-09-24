# Finish PROOF and Add Reviewer Intelligence

## Goal
Complete and validate the approved seven-page PROOF demo before adding the two new items: production-ready favicon assets and an AI-assisted policy review workflow that is ready for the user's own gateway connection.

## Existing experience completion
- Fix the landing composition shown in the screenshot so the navigation, headline, media band, and receipt remain fully framed at the target desktop size and adapt cleanly at phone width.
- Audit every current route and interaction, then correct broken, clipped, incomplete, or inaccessible states without changing the approved black/cyan PROOF visual direction.
- Verify both core demo outcomes: DENY creates a receipt without transaction data; ALLOW creates a clearly simulated Base Sepolia transaction receipt.
- Check mobile navigation, receipt filtering/detail, policy editing, analytics, integrations, settings, keyboard focus, reduced motion, and console output.

## Favicon and metadata
- Derive crisp square favicon files from the selected PROOF seal, including browser-friendly PNG sizes and an ICO fallback.
- Reference the favicon assets from the shared document metadata and remove stale template favicon behavior.
- Keep unique PROOF metadata on every content page.

## Reviewer policy-risk analysis
- Add a dedicated **Review** destination inside the product navigation.
- Let reviewers enter a policy and decision context, then request a structured analysis covering likely compliance risks, severity, evidence gaps, and recommended next steps.
- Present useful empty, validating, connecting, loading, success, and safe error states; preserve entered text after failures.
- Keep credentials and model calls server-side. The feature will be provider-ready for the user's own gateway credentials and will show a clear “connection required” state until they are supplied—no mock AI response and no Lovable-managed model key.
- Validate input server-side, preserve safe gateway error messages, avoid automatic retries except bounded backoff for rate limits/server errors, and never add artificial generation timeouts.

## Technical details
- Use the existing TanStack route structure and design components.
- Add a server endpoint for the review request with configurable server-only gateway URL, key, and model settings.
- Stream model output to avoid request timeout issues and parse a strict structured review result for the page.
- Add unique Review page title, description, Open Graph metadata, and Twitter card metadata.

## Acceptance checks
- Desktop at 1290×860 and mobile near 390px show no overlap or accidental horizontal scrolling.
- All eight destinations are reachable and usable.
- DENY and ALLOW flows behave exactly as labeled.
- Favicon requests succeed.
- The review page correctly reports an unconfigured connection now and is ready to work once the user's gateway details are added.
