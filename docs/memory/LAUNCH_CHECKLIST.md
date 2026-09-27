# Launch checklist — 20 tasks (2026-09-27)

| # | Task | Status | Where |
|---|------|--------|-------|
| 1 | Privacy policy | Done | `/privacy` |
| 2 | Terms & conditions | Done | `/terms` |
| 3 | Remove frontend secrets | Done | No `VITE_*` secrets; httpOnly sessions; server-only keys |
| 4 | Enforce HTTPS | Done | Vercel TLS + `vercel.json` HSTS / security headers |
| 5 | Cookie consent banner | Done | `CookieConsent` — essential vs analytics |
| 6 | Meta titles/descriptions | Done | Root + every route `head` |
| 7 | Social preview image | Done | `/og.png` + `og:image` / `twitter:image` |
| 8 | Favicon | Done | `/favicon.ico` + apple/android icons + manifest |
| 9 | Sitemap and robots.txt | Done | `/sitemap.xml` + Sitemap line in robots |
| 10 | Image alt text | Done | Decorative logo `alt=""` + labelled brand; video `aria-label` |
| 11 | Image compression | Done | Nav mark ~9KB (was 633KB); OG ~41KB; seals resized |
| 12 | Page load speed check | Done | Font `display=swap`; compressed mark; `preload=metadata` on video; `npm run check:launch` |
| 13 | Color contrast fixes | Done | `--muted-foreground` darkened for AA |
| 14 | Mobile responsiveness | Done | Existing breakpoints + mobile nav CTA |
| 15 | Custom 404 page | Done | Root `NotFoundComponent` → gate + home |
| 16 | Broken link fixes | Done | Privacy/Terms/footer links wired |
| 17 | Form validation | Done | Client checks amount / `0x` / intent / idempotency |
| 18 | Spam protection | Done | Honeypot + CSRF + in-memory rate limit |
| 19 | Analytics setup | Done | Opt-in first-party `/api/v1/analytics` (+ optional Plausible domain) |
| 20 | Single clear CTA | Done | Landing hero + nav → `/gate` only |

## Speed smoke
```bash
npm run check:launch
```
