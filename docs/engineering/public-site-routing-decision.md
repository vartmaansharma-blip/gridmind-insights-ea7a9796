# Public website routing decision

GridMind's approved green marketing experience is the **homepage at `/`**. It uses the established `PublicSite` component, retains the signature `#9ADD00` green, the “Everything is connected. What are we missing?” hook, and fictional example labels.

## Public website
- `/` — canonical homepage, full original animated experience.
- `/problem` — electricity-bill question and problem.
- `/how-it-works` — evidence-to-review process.
- `/example` — fictional electricity-bill investigation, with a link to the working example on the homepage.
- `/about` — GridMind definition, present offer, and clearly separated future ambition.
- `/contact` — request for a private conversation using existing `/cases` intake.
- `/website` — backwards-compatible copy with noindex and canonical home.
- `/design-preview` — internal design-review copy (noindex); not the public homepage.

The website shares a public visual language and navigation, while the customer's authenticated case workspace remains `/cases`, and authentication remains `/auth`. No new public upload endpoint is created.

## Application boundary
The legacy energy dashboard formerly rendered at `/` is now at `/app/overview`. The internal Overview navigation points there. All existing internal energy/factory/machine routes remain intact. The public pages bypass the internal `AppShell` entirely. This work does **not** implement the larger authentication, onboarding, role or RLS migration from draft PR #132. That PR is separate, unmerged, and its no-merge warning remains applicable.

## Release and verification
Before promotion, run `bun run check` plus the isolated Playwright test suite, confirm the `/` hero and all linked public paths work on mobile and desktop, verify `/app/overview` retains legacy data presentation, and confirm no private data surfaces on public routes. Re-check branch compatibility with draft PR #132 before any later merge. Deploy only after exact-head checks and production-route verification.
