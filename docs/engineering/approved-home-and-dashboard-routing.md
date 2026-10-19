# GridMind public homepage and Dashboard routing — implementation decision

## Binding naming and design source

**Home** is the approved design previously accessed as `/design-preview`. Its source is `src/components/public-site/site.tsx`; the `DesignPreview` wrapper adds an internal review badge only. The public root `/` renders **the same design directly**, without that badge. The green brand `#9ADD00`, cinematic flow, exact hook “Everything is connected. What are we missing?”, fictional bill example, accessibility and reduced-motion behaviors are preserved. The earlier Flash/draft interpretation must not be used to substitute an alternate layout.

**Dashboard** is the product's existing factory analysis application (previously displayed on `/` and mislabeled “Overview”). Its canonical landing URL is **`/dashboard`**, using the pre-existing analysis UI and internal application shell, not the public marketing shell. The Dashboard sidebar label must be “Dashboard.” This route move does not authorize bypassing server permissions or promoting fictional results to actual findings.

## Route contract

| Route | Role |
| --- | --- |
| `/` | Public **Home**, the approved design-preview-derived website |
| `/design-preview` | Internal review copy of Home, still noindex |
| `/website` | Legacy non-indexed alias using the same public design |
| `/dashboard` | Existing internal **GridMind Dashboard** |
| `/auth` | Account access |
| `/cases` and `/team/*` | Existing customer and staff investigation workflows |
| `/energy`, `/factory`, `/machines`, etc. | Existing application subpages unchanged |

**Future public page plan:** five primary pages—Home, What We Solve, How GridMind Works, About GridMind, Contact—were recommended during planning but are **not delivered by this routing change**. Do not publish the premature six-page content proposed in draft PR #148. Dedicated supporting pages require founder-approved design/content follow-up; until then retain the working in-page navigation of the original public design.

## Verification before merge

1. CI typecheck, lint, unit tests, production build, and existing route smoke tests.
2. Browser coverage: `/` renders the approved hook/fictional interactive example; `/design-preview` remains labeled internal copy; `/dashboard` uses the application shell and preserves the current dataset/empty state; `/website` remains accessible and noindexed.
3. No public/private tenant crossover, secret exposure, new data handling, payments, certification or guaranteed savings.
4. Verify Vercel production and Lovable source sync before claiming public deployment.

## Lovable design follow-up

Use the public component at `src/components/public-site/site.tsx` as the **visual source of truth**, not the older draft. Preserve layout, motion, colors, desktop/mobile and accessibility unless a specific redesign is authorized. Work on visual polish and the five-page information architecture only after routing is safely merged; never modify protected cases, Supabase rights or authentication as a side effect.
