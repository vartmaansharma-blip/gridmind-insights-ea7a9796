# GridMind public site release — 2026-10-17

## Founder's release decision
The user designated the Lovable page at `preview--gridmind-insights.lovable.app/design-preview` as **GridMind's main public site** and directed us to continue implementation. This authorizes promoting the already-designed public marketing component `src/components/public-site/site.tsx` to `/website` after safety and browser release checks; it does **not** authorize replacing the existing authenticated or demo factory dashboard route `/`, changing production customer data, promoting synthetic records into live cases, or relaxing access controls.

## Source of truth
- Lovable project `12d7acd4-2c00-472a-9b77-af92553ef7dc` and GitHub `vartmaansharma-blip/gridmind-insights-ea7a9796`.
- Site brand green immutable token `#9ADD00`; heading `Everything is connected. What are we missing?`; original owner/plate conceptual hero, scroll-driven narrative, reduced-motion behavior and fictional interactive electricity-bill example retained.
- Canonical release route `/website` imports **PublicSite**; `/design-preview` remains a labeled internal review copy. Root `/` remains the existing factory dashboard pending a **separate, deliberate navigation migration**, avoiding broken dashboard and case links.
- Contact call-to-action uses the existing `/cases` request-only flow; no form pretends to send mail, no contact address is invented or personal address released.
- All sample tariff, bill and investigative information is fictional and carries existing limitations. No real-data intake, automatic fault diagnosis or verified savings claims are made.

## Release gates
1. CI and Quality Gate on exact source SHA.
2. Browser suite against a locally built preview: `/website` hook and download, `/design-preview` consistency, narrow-screen overflow, customer/team synthetic workflow. No nonlocal network.
3. Clean migration replay if relevant to the release, with existing tenant/auth security checks. This changes no database schema.
4. Merge only when checks pass and GitHub main HEAD is unchanged. Verify Vercel production SHA matches merged main, and read back `/website` route code.
5. Follow-up work on issue #123 remains separate: secure machine measurement intake → canonical analysis → case/reviewer/brief.
