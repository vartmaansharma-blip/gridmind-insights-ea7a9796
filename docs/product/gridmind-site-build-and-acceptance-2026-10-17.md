# Public website build and acceptance — GridMind 3.1

**Status:** Supporting implementation specification; 17 October 2026. **Owner:** founder for claims and contact route; product/design for copy and accessibility; engineering for routes, tests and preview. The [Master Plan](../gridmind-master-plan-2026-10-11.md) controls strategy and the [Buyer Discovery Sprint](../gridmind-buyer-discovery-sprint-2026-10-11.md) controls evidence. This is the next visible build milestone, not proof of demand.

## The job of this site

A factory buyer arriving cold should understand in one minute: what GridMind investigates, what decision it helps them make, what it will **not** do, why the source evidence and specialist review matter, and how to request a non-confidential first conversation. A site visit is not a lead, buying signal or validated problem until the person takes a recorded, consented step. The public website may be built now while buyer discovery continues; claims must remain explicitly provisional.

**Current route truth:** the public page is `/website`; the existing application dashboard is `/`. The separate public-root/authenticated-routing PR #132 is open. Do not silently combine that route change with this copy/design work. Move the public site to `/` only after redirect/deep-link, sign-in, role, tenant and browser acceptance and issue/PR reconciliation.

## Release 1 page map and copy contract

| Area | Reader question and required answer | Action / acceptance |
|---|---|---|
| Hero | “What is GridMind?” Expert-assisted investigation and coordination of costly manufacturing exceptions. Say “working pilot” or “exploring”, not “proven platform”. | One primary `Request a conversation` link; one `See how a case works` anchor. Accessible focus state. |
| Problem-to-resolution | Show a concrete exception: quality defect/acceptance hold, disputed acceptance or invoice, or electricity exposure. Explain source trail → qualified review → owned action → verified/unknown outcome. | Use a clearly labeled *fictional* example; no invented customer, savings or guarantee. |
| Candidate services | R1, R2, R3 each get buyer, bounded question, possible inputs, qualified reviewer, output and safety boundary. R1 may be the visual demonstration, never a claimed winner. | Explain existing best alternative and when GridMind would decline. |
| How engagement starts | Non-confidential conversation; diagnosis of buyer authority, scope and data rights; specialist and adult/professional check; priced written scope; only then customer-data intake. | No document upload, factory credentials or confidential free-text field on public form. |
| Trust and limits | Human signoff, source provenance, tenant isolation, minimal collection, uncertainty, no autonomous industrial control, no legal/energy/quality certification without qualified professionals. | No security badge or compliance claim without recorded evidence. |
| About/contact | Named legitimate contact route and response expectation only if operated; privacy link and location/service area only when verified. | Form or mail link must work in preview and preserve consent; use no fake phone/address. |

Do not create independent “solutions” microsites for six businesses. No public customer dashboard demo needs an account. No real factory screenshot, process diagram, logo, testimonial or numerical result may appear without rights and approval. Keep the signature green as the primary brand accent; use high-contrast text, restrained industrial photography/illustration with rights, clear hierarchy, readable mobile type, and no cartoon machinery-control implication.

## Functional journeys

1. **Cold buyer:** lands at `/website`, understands the proposition, inspects a fictional R1 example, selects a non-confidential contact action. On submission or mail open, sees what happens next and what not to send.
2. **Skeptical specialist:** sees where the method stops, the source/provenance expectations, who has signoff and the distinction between a screening demo and professional opinion.
3. **Existing signed-in user:** reaches the current application without losing a deep link or being redirected into public content. No cross-tenant data appears.
4. **Founder/team:** records only authorized inbound contact and consent in the sole buyer tracker; the website must not silently create a case or inflate conversion.

## Design and Lovable handoff

The handoff is a single issue-linked implementation brief: actual route, page map above, mobile/desktop wireframes, component states, copy and claim table, forms, focus/keyboard behavior, asset rights, and exact acceptance evidence. Lovable may help with visual implementation; code review remains in this repository and preview is checked at the exact commit. Reuse existing TanStack Start/React/Vite/Bun and components where possible. Do not start a second Lovable project or import a new stack merely to redesign the landing page. Preserve original signature green; verify contrast in actual UI rather than assuming the color is accessible.

Minimal form fields if a form is justified: name, organization/role, contact method, broad non-confidential issue category, consent to follow up. A plain email CTA is acceptable initially if it is operated and tested; do not store factory documents. Publish a concise privacy notice before storing personal contact data. Spam/rate-limit and duplicate handling belong to the form implementation, not the marketing copy.

## Build order and definition of done

| Step | Owner | Deliverable and exit test |
|---|---|---|
| 1. Claim inventory | Founder + domain reviewer when available | Every public assertion maps to verified fact, explicit hypothesis, fictional demo or prohibited claim. Remove unsupported claims. |
| 2. Information architecture and copy | Product/design | One page at `/website` covering the table above. Founder can explain it without an acronym glossary. |
| 3. Responsive accessible implementation | Engineering/Lovable | Keyboard navigation, semantic headings, sufficient contrast, mobile widths, reduced-motion respect and visible errors/success. Keep signature green. |
| 4. Contact path | Founder + engineering | Non-confidential route works end to end in a preview; consent and retention path are explicit. No confidential upload. |
| 5. Exact-head review | Engineering + founder | Build, lint, tests, docs links, browser smoke, route/deep-link and no-auth checks run on the exact SHA; compare preview SHA with source. Record failures. |
| 6. Route change, only if warranted | Engineering | Review #132 separately against Supabase role/tenant and migration state; test public root and authenticated dashboard; keep rollback. |
| 7. Publication | Release owner | Only after release gate and authorized promotion; verify final domain, actual deployed SHA and hard reload. |

The public site does **not** require a selected paid lane. Its copy is provisional until buyer evidence permits a sharper offer. A contact CTA that cannot receive messages fails Step 4. A beautiful page with broken CI or blocked Vercel preview fails Step 5. No production promotion is implied by this document.

## Portal build sequence after the site

Build a role-safe internal case workspace only after a lane is selected and the method/reviewer contract exists. The customer sees its own intake, permitted evidence requests, published brief, actions and outcome; the team sees triage, permissions, cost and follow-up; the reviewer sees source-linked claims, uncertainty, conflicts and approval/rejection. Server authorization and tenant isolation precede real data. The [domain/product contract](gridmind-resolve-domain-and-product-contract-2026-10-17.md), [engineering acceptance](../engineering/gridmind-execution-and-repository-acceptance-2026-10-17.md) and [release gate](../release-gate.md) specify those later boundaries.
