# GridMind product journey — public homepage → account → factory introduction → private dashboard
**Decision date:** 2026-10-17. **Founder-approved:** Lovable lime-green public experience is the **canonical homepage at /**, not a staff factory overview. Everything else is a deliberately distinct authenticated product route.

## Customer-facing journeys

```
Anonymous visitor
    / (approved Lovable public site; #9ADD00; "Everything is connected. What are we missing?")
    ├─ Explore example: fictional only
    ├─ Sign in / create account → /auth
    └─ Connect your factory → /onboarding → /auth (when signed out)

Authenticated session (server-verifiable principal)
    ├─ No accepted customer case and no approved staff membership
    │   → /onboarding (non-confidential factory introduction, scoped issue and time window)
    │       → secure, owner-scoped intake request → pending human GridMind review
    │       → assigned to an authorized case by an approved staff owner
    │       → customer /cases private investigations
    ├─ Accepted customer case (case-only access)
    │   → /cases, case status, evidence requests, released reviewed briefs
    ├─ Active internal factory staff membership (owner/admin/analyst)
    │   → /team/cases investigation dashboard
    │   → /app/overview legacy factory energy dashboard and /factory, /machines etc
    └─ Account requesting unauthorized team access → permission pending; no staff elevation.
```

## Routed pages and boundaries

| Route | Intended audience | Behavior |
| --- | --- | --- |
| `/` | Everyone, anonymous first | Full Lovable public green homepage; no data-provider or staff shell |
| `/website` | Backward-compatible public alias | Same approved public design, `noindex` to prevent competing SEO |
| `/design-preview` | Preview/review | Existing labelled internal design copy; not production root |
| `/auth` | Prospective, customer, invited staff | Email/Google login, verified principal routing; no role grants from URL |
| `/onboarding` | Prospective signed-in factory contact | Request an assisted introduction using existing case-intake payload; show own pending state |
| `/cases` | Assigned customer | Only own private cases, conversation and published approved briefs |
| `/team/cases` | Assigned team | Scoped case queue and reviewer workflow |
| `/app/overview` | Verified staff | Previously-root factory energy demo/analysis; gated using factory staff role |
| `/energy`, `/machines`, `/factory`, etc. | Verified staff | Remain under a staff workspace rendering guard; backend RLS remains authoritative |

### Onboarding is not factory telemetry integration

GridMind is **on-site/service-led**. At sign-up, a customer account does **not** receive automatic industrial machine or data-source access. The current request collects only: public/business factory name, general location, process/category, decision question, and bounded review period. Explicit submission is handled by the existing scoped `portal_store` intake, not a browser-written row or fake success state.

Human GridMind personnel verify **site permission, buyer/role, evidence custody and technical reviewer** before accepting a case and granting access. The portal creates case-only customer access without general factory-data access. Approval is *not* evidence that a meter/sensor is connected. Real asset onboarding and data instrumentation are separate later gates.

A user with an existing open request sees **submitted for review**, not a fabricated connected-dashboard state. A user with an assigned case can open /cases. There are no confidential file uploads in this flow.

## Security design

1. Login and principal obtained from Supabase-authenticated, server-authorized `portal` operation.
2. Never use query param `destination`, self-reported job title, email domain or localStorage to create factory/team membership.
3. Client-side staff rendering guard protects routes from accidental exposure, while Supabase RLS and backend checks are mandatory actual authorization.
4. A case-only customer stays isolated from internal factory telemetry and other customers. Reused `portal` intake accepts idempotent user-owned request identifiers; new UI retains identifier for retries.
5. On a failed access check, show an error and no privileged data. No sign-in means onboarding sign-in prompt.
6. Demo energy estimates and fictional electricity example cannot be presented as verified loss/savings or customer-specific machine diagnostics.
7. If principal has multiple factory memberships, factory switching inside the staff area remains subject to existing backend RLS and access.

## Technical availability — production blocker

**Observed connected Supabase on 2026-10-17:** `public.investigation_cases` and `public.case_intake` do not exist; `public.synthetic_machine_evidence_batches` also absent; `observations=0`; `factory_analysis_runs=0`. GitHub contains the corresponding source migrations. **Do not say live onboarding is operational or publish an onboarding release until migration history, API feature flags and role/tenant controls are verified safely in a disposable environment and then applied through controlled deployment.**

This PR changes frontend routing and uses the already-designed service; it contains no production DB mutation. It must be held until exact-head checks, secure auth, team/customer isolation and connected-API acceptance pass. A production migration release requires its own owner approval and smoke check. Issue #123 (real machine evidence intake/analysis/brief) remains separate and incomplete; a homepage is not a functional industrial intelligence product.

## QA release gate
- [ ] Anonymous root (desktop/mobile) is green Lovable site; /website alias works; /app/overview requires authorization.
- [ ] Sign-up/sign-in with zero memberships returns onboarding rather than creating demo factory access.
- [ ] Pending customer sees only own submitted request; no record is marked connected.
- [ ] Approval by authorized team owner creates an assigned case and customer /cases dashboard.
- [ ] Returning approved customer routes /cases; valid staff routes /team/cases and may open /app/overview; forged team intent never elevates.
- [ ] Existing factory/machine/case routes and navigation work under new app namespace.
- [ ] Exact-head CI, Quality Gate, locally isolated browser/auth and clean Migration Replay succeed before merge or production release.
