# GridMind main-site design: audit findings and preview-only plan

## Audit findings (read-only, nothing changed)

**Framework and pages**
- TanStack Start + React + Vite + Tailwind v4. Supabase connected (`bvqmvgbfqhgczwbvlqkk`).
- `/` is the factory dashboard Overview (demo factory), **not** a public homepage.
- `/website` is the current public marketing page ("Evidence to decision", private beta). Its links go to `/auth`, `/cases` and `/cases?mode=demo`. It has no contact form or email link.
- Other pages: factory, energy, machines, opportunities, alerts, savings, investigations, cases, team/cases, team/intake, auth, and two API routes (investigations, portal).

**Brand and design tokens**
- Logo files: `src/assets/gridmind-mark.png` and two concept PNGs. There is no SVG logo. The favicon is `public/favicon.png`.
- The colour tokens in `src/styles.css` are all oklch values. There is no `#9ADD00` token. The lime-coloured tokens are `--cta: oklch(0.82 0.22 128)`, `--accent: oklch(0.9 0.18 126)` and `--ring: oklch(0.79 0.2 128)`. These are close to `#9ADD00` but not identical. The exact difference will be measured and reported, and the dashboard will not be recoloured.
- Fonts: Manrope, Space Grotesk and IBM Plex Mono, loaded from Google Fonts in `__root.tsx`.
- There is no hero photography and no media folder.

**Contact and sign-in**
- Sign-in goes through `/auth`, with Supabase email and Google sign-in. This must not change.
- There is no working "Discuss a review" contact path today. The closest thing is the intake portal (`/team/intake`), which needs server routing configuration. **Blocker:** the main call-to-action needs a real contact destination, such as an email address or a backend-confirmed form, and the owner has to supply or approve it.

**Git and publishing risk**
- The editor works on branch `edit/edt-bb2...`. Lovable syncs it into `main` on GitHub. CI, Quality and Migration Replay run on every push to `main`.
- The Lovable production site at gridmind-insights.lovable.app only updates when someone clicks Publish. Preview edits do **not** go live there on their own.
- **Risk:** earlier audits show a Vercel project deploying from GitHub `main`. If Vercel auto-deploy is still on, any committed edit, including preview-only files, will trigger a Vercel production build. I can't confirm the current Vercel setting from here, so it is marked NOT VERIFIED.
- `robots.txt` lets crawlers index every page. A new page would be publicly reachable on any deployment unless it is excluded from indexing.

## Safe preview-only boundary

- One new isolated page, `/design-preview`, plus a self-contained `src/components/design-preview/` folder.
- The page is tagged `noindex`, with no links to it from any navigation, and it is labelled "Internal design preview — illustrative, fictional data".
- New brand tokens live **only inside this page's wrapper**, starting with `--gm-brand-green: #9ADD00`. Nothing changes in `src/styles.css`, `/`, `/website`, `/auth`, the backend or the database.
- Contents:
  1. Hero option A (person looking over an industrial plant at dusk) and option B (wide view of industrial infrastructure, no person). Both show the exact hook, the two calls to action and the logo, at desktop and mobile widths.
  2. Static keyframes A (World), B (Discovery) and C (Intelligence), with no scroll animation.
- The background images will be generated as clean plates with no text, numbers or interface elements. They will be labelled as generated concept imagery, not real customer sites.
- The calls to action point to placeholders marked "Contact destination pending". No fake success messages.
- Checks: screenshots at 1440x900, 1366x768, 390x844 and 360px, plus a colour sample of the solid green against `#9ADD00`.

## Owner decisions needed before or alongside the build
1. Confirm whether Vercel auto-deploys from `main`. If it does, either accept that a hidden `noindex` page goes live there, or pause Vercel auto-deploy first.
2. Provide the real contact destination for "Discuss a review".
3. Approve AI-generated background plates as concept art, or supply licensed photography.

## Out of scope for this step
No animation, no homepage replacement, no publishing, and no backend or authentication changes.
