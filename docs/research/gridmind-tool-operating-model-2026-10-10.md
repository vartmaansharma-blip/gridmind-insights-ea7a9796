# GridMind tool operating model: specialist tools, source of truth and execution gates

**Decision date:** 2026-10-10  
**Status:** Default operating model; review only when evidence shows a bottleneck.  
**Previous decision:** GitHub is canonical; Lovable accelerates UI; Vercel hosts; Supabase persists data.  
**Change:** Make specialist responsibilities, handoffs, quality gates and tool-addition criteria explicit.  
**Evidence basis:** Current read-only project audit and official product documentation linked below. This is an operating recommendation, not a claim that every integration is already configured.

## Executive decision

Keep the current stack. The improvement is not to collect the largest number of AI tools; it is to create a controlled system where each tool has one primary job, outputs are reviewable, and no tool silently becomes a competing source of truth.

GridMind must own its product definition, industrial domain logic, evidence provenance, evaluation criteria, customer relationships and outcome data. Vendors provide leverage and infrastructure—not the product's core judgment or moat.

## Responsibility map

| Job | Default tool | Owns | Must not own |
|---|---|---|---|
| Product truth, requirements, schemas and decisions | **GitHub** | Canonical code, versioned docs, migrations, tests, decision history | Live secrets or unreviewed ad hoc edits |
| Fast UI iteration | **Lovable** | Prototype screens, layout iteration, simple UI flows | Canonical product definition or unsupervised production releases |
| High-fidelity design system, when justified | **Figma** | Design tokens, reusable components, responsive states and visual specs | A second untracked implementation of application logic |
| Engineering and difficult debugging | **Codex or one chosen coding agent** | Repo-aware implementation, tests, refactors, migration review | Blind production changes or guessed schemas |
| Independent review, selectively | **A second model/tool** | Review diffs for security, correctness, edge cases and unsupported assumptions | Automatic approval or self-certification |
| Automated acceptance | **GitHub Actions** | Typecheck, lint, tests, build, migration replay, tenant isolation and API checks | Human/domain approval or proof of customer value |
| Hosting and previews | **Vercel** | Preview/production builds, deploy status, diagnostics and rollback | Canonical source code or bypassing failing CI |
| Database, identity and persistence | **Supabase** | Postgres, Auth, RLS, migrations, storage and Edge Functions | Treating client checks as the security boundary |
| Bounded model inference | **OpenAI API or another evaluated provider** | Structured extraction, classification, summarization or hypothesis generation when proven useful | Unchecked causal claims, production writes or final high-impact industrial decisions |
| Model quality | **Versioned fixtures + CI** | Regression/refusal tests, scoped precision/recall, reproducibility | Generic benchmark scores as proof of factory accuracy |
| Error monitoring, when needed | **Vercel Observability first; Sentry if a gap remains** | Errors, traces, latency and diagnostics | Replacing tests or reproducible bug reports |
| Product analytics, after real users | **PostHog or equivalent, subject to privacy review** | Minimal workflow-friction and funnel metrics | Collecting sensitive plant data or tracking for its own sake |
| Customer evidence | **Buyer tracker in GitHub + real notes** | Interview facts, evidence references, disconfirming findings and decisions | Treating AI research as a customer interview |

### Official references

- Figma Dev Mode and design-to-development: https://www.figma.com/dev-mode/ and https://developers.figma.com/docs/figma-mcp-server/
- Vercel Git deployments and previews: https://vercel.com/docs/git
- Supabase database security and RLS: https://supabase.com/docs/guides/database/overview
- OpenAI Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- Sentry for Next.js diagnostics: https://sentry.io/for/nextjs/

Structured model output ensures format/schema conformance, not factual correctness. Validate values, units, source IDs, time windows, uncertainty and domain constraints separately.

## Design workflow: Lovable + optional Figma

1. Record the user problem, success criterion and screen states in GitHub.
2. Use Lovable for rapid UI exploration and iteration.
3. Add Figma only if visual consistency, responsive behavior, interaction specification or design-to-code drift becomes a recurring bottleneck. Define tokens, type scale, spacing, grid, components, states and responsive rules.
4. Treat Figma as the visual specification—not a second application implementation.
5. Implement the approved design in canonical GitHub code. Reuse existing components; inspect generated code rather than accepting it wholesale.
6. Test desktop/mobile, loading/empty/error/success states, keyboard access, performance and real data behavior.
7. Run CI, review the diff and confirm the deployed SHA.
8. Record shipped behavior and resolve design drift through reviewed changes.

### Industrial UI quality bar

GridMind should feel like an instrument an engineer can trust—not a generic AI chat window or decorative dashboard. Prioritize:
- Clear factory/asset/time scope and data freshness.
- Traceable source evidence beside consequential findings.
- Visible units, coverage, missing data, uncertainty and alternative explanations.
- Separation of observed fact, inference, hypothesis and recommendation.
- Economic ranges with assumptions exposed, not false precision.
- Human-review/approval states and audit history.
- Useful empty/error states and clear recovery paths.
- Responsive charts/tables and accessible contrast/keyboard behavior.
- Motion only when it explains a state change.

## Engineering workflow

1. **Define:** issue includes context, expected behavior, acceptance tests, relevant schema/data contract and exclusions.
2. **Inspect:** coding agent reads the current implementation and tests first.
3. **Implement:** make the smallest coherent change, preferably in a branch/PR where practical.
4. **Verify:** tests, typecheck, lint, production build, migration replay when relevant, and explicit authorization/tenant-boundary tests.
5. **Independent review:** second reviewer for auth, RLS, migrations, AI logic and consequential calculations.
6. **Deploy:** only reviewed commits; confirm deployed SHA and smoke-test the real deployed route.
7. **Observe:** record failures, regression cases, cost/latency and support burden.
8. **Document:** update canonical decisions/runbooks when operating rules or behavior change.

Industrial model outputs must be typed and validated, linked to source IDs/time windows, explicit about uncertainty/refusal conditions, and reviewable by a qualified human. No direct model-driven production control or unreviewed intervention execution.

## Preventing tool sprawl and source drift

- One canonical source per concern: GitHub for code/decisions/contracts; Supabase for live operational records; Figma for approved visual design; Vercel for deployment state.
- Never independently edit the same implementation in Lovable and a coding agent at the same time.
- Any Lovable change must be reconciled into GitHub and pass the same checks.
- Never put secrets, credentials or private plant/customer information into public prototypes, prompts or issues without authorization and an approved data-handling basis.
- Review public Lovable visibility and deployed routes before customer sharing; public access is not itself proof of a vulnerability, but private data/secrets must never be exposed.
- Every new vendor must name the bottleneck, measurable improvement, integration/maintenance cost, data access, exit path and owner.
- Avoid vendor-specific abstractions in core domain logic when that would make switching providers prohibitively difficult.
- No model should author, review and self-certify the same consequential change without independent tests or human review.

## Specialist tools: add only when justified

| Tool/category | Add when | Do not add merely because |
|---|---|---|
| Figma | Need a consistent design system or detailed design/code handoff | One page needs a quick tweak |
| Second coding/review agent | Security-sensitive changes, migrations, complex refactors | Every tiny documentation edit needs multiple agents |
| Sentry | Errors are hard to diagnose across browser/server/Edge Function boundaries | It duplicates sufficient existing diagnostics |
| PostHog/equivalent | Real users exist and a specific workflow question needs answering | No user activity or privacy plan exists |
| Another model provider/router | Controlled evaluation shows material improvement for a defined task at acceptable cost/latency | A leaderboard says it is generally better |
| Workflow orchestration | Real multi-step jobs need durable retries, scheduling, audit or human approvals beyond the app | The first use case is not proven |
| Data warehouse/streaming | Measured volume/latency exceeds Postgres capabilities | The long-term vision sounds large |
| SCADA/historian connector | A selected customer has an authorized recurring integration need | No customer/problem/data rights are established |

## Execution priority

**P0 — Release integrity**
- Finish CI, Quality Gate and migration replay on the latest commit.
- Resolve Vercel's build-rate limit before repeated build attempts.
- Verify the deployed SHA equals the approved GitHub SHA.

**P0 — Security and correctness**
- Test authorized sign-in, persistence, reload/recompute and cross-tenant denial.
- Review the SECURITY DEFINER function warning and leaked-password protection finding.
- Confirm public surfaces expose no private customer data or secrets.

**P1 — Product/design quality**
- Use Lovable to improve the specific flow needed for the first evidence-backed use case, not expand pages without validation.
- Add Figma only if a real design-system/interaction bottleneck exists.
- Implement evidence, uncertainty, refusal and human-review states before decorative polish.

**P1 — Real-world evidence**
- Record actual buyer interviews.
- Compare the three candidate wedges.
- Secure authorized data and agree baseline, reviewer and acceptance criterion before a customer-specific build.

**P2 — Measured expansion**
- Add monitoring, analytics, orchestration or specialist models only when an observed failure or metric justifies them.

## Acceptance criteria

- A contributor can identify the source of truth for code, decisions, design, data and deployment.
- A feature is not complete merely because it looks correct in Lovable.
- Production changes have traceable commits and relevant automated checks.
- The deployed commit is known and smoke-tested.
- AI findings are source-linked, schema-validated, bounded by uncertainty and human-review requirements.
- Tool additions have a problem statement and measurable success criterion.
- GridMind can replace a supporting vendor without losing its product definitions, evidence model or customer outcome history.

## Decision

**Keep the current stack. Make the workflow stricter before making the stack bigger.** Lovable remains the rapid UI tool; GitHub is canonical; Vercel deploys reviewed commits; Supabase persists and secures data. Use Figma, a second reviewer, deeper monitoring or specialized AI providers only when a concrete bottleneck and acceptance metric justify them.
