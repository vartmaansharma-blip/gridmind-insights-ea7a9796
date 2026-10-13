# Repository-wide alignment inventory and contradiction register

**Audit date:** 2026-10-13  
**Base commit:** `4ad1fb2197598aa91ca1c477b53a0c7ae62281b1`  
**Status:** Initial inventory and first-pass findings; not a completed semantic review of every file. No product, schema, application, or strategic decision is changed by this document.  
**Purpose:** Establish a controlled audit sequence before repository-wide edits. This is an audit workpaper, not a competing strategy or execution plan.

## Governing outcome

Every GridMind component must support one outcome: **turn authorized industrial evidence into traceable findings, human-approved decisions, and measurable outcomes—without claiming more than the evidence proves.**

Use the canonical authorities for interpretation:
1. [Master Plan](gridmind-master-plan-2026-10-11.md) — sole execution plan.
2. [Buyer Discovery Sprint](gridmind-buyer-discovery-sprint-2026-10-11.md) — sole live discovery tracker.
3. [Decision Constitution](gridmind-decision-constitution-and-contradiction-register-2026-10-10.md) — durable strategic guardrails.
4. [Problem-Solving Constitution](gridmind-problem-solving-constitution.md) — reasoning and verification discipline.
5. [docs/README.md](README.md) — document index, not a strategy authority.

## 1. Repository inventory baseline

A recursive Git tree query at the base commit returned **279 tracked files**:

| Area | Files | Audit treatment |
|---|---:|---|
| `src/` | 103 | Map routes, domain logic, data flow, UI claims and persistence boundaries to the approved workflow; code behaviour requires source-level verification. |
| `docs/` | 90 | Use the existing document lifecycle inventory; check each document's actual content, authority, inbound references and live status. |
| `supabase/` | 44 | Map migrations, policies, functions and types to authorized access, tenant isolation, provenance, persistence and reproducibility; do not infer runtime correctness from schema files. |
| `data/` | 13 | Classify taxonomy/library/knowledge assets as reference, synthetic or operational; ensure data is not presented as verified factory evidence. |
| `.github/` | 7 | Map workflows, templates and contribution rules to review and release gates; current runner failures are a separate infrastructure blocker. |
| `.lovable/` | 2 | Check tool instructions against the Master Plan so the builder does not execute parked product work. |
| Root files | 15 | Check onboarding, roadmap, environment examples, package scripts and contributor instructions for current authority and consistency. |
| `public/` | 2 | Check public-facing assets and crawl/index settings against truthful positioning. |
| `scripts/` | 2 | Check that validation scripts enforce documented requirements without creating false readiness signals. |
| `tests/` | 1 | Map tests to supported claims and required gates; test presence is not a passing result. |

**Important limitation:** the count and paths are tree-verified; the table is a scope map, not a claim that all 279 files have already been semantically reviewed. The 90-file documentation inventory already exists in `docs/README.md`; avoid duplicating it here.

## 2. First-pass contradiction and risk register

Severity describes the risk if left unresolved, not a claim that an underlying feature is broken.

| ID | Area | Evidence observed | Risk / contradiction | Required resolution | Priority |
|---|---|---|---|---|---|
| A-01 | Lovable execution instructions | `.lovable/plan.md` still instructs a broad product overhaul: overview, energy, machines, opportunities, alerts, savings, machine passports, and screen-by-screen implementation. The canonical Master Plan freezes speculative modules and feature PRs while customer discovery remains unresolved. | A connected builder could interpret old product instructions as the active build queue, directly competing with discovery-first strategy. | Treat the plan as parked/reference until the Master Plan explicitly reauthorizes a bounded vertical slice. Preserve its useful design constraints (synthetic labels, evidence classes, no false connection claims) without treating its feature sequence as current work. Update only after the full instruction/reference check. | **P0** |
| A-02 | Strategy vs product capability | The Master Plan defines an evidence-first, human-reviewed industrial investigation service as current positioning hypothesis; the Decision Constitution describes a broader long-term industrial decision/value-realization platform. | Readers may confuse long-term ambition with current software capability or validated demand. | Apply consistent labels everywhere: long-term thesis, current service hypothesis, unvalidated assumptions, demonstrated current capability, future capability, and hard prerequisites. Do not narrow the ambition just to simplify the MVP. | **P0** |
| A-03 | Candidate workflow | C1 downtime/production loss and C4 energy/resource inefficiency are active discovery probes; no commercial wedge is selected. The product has existing energy-analysis and machine concepts. | Existing implementation detail can be mistaken for a market decision, privileging the energy or machine route without customer evidence. | Mark technical readiness and commercial priority as separate dimensions. Existing code/data contracts do not select the wedge. Only the 2026-11-10 evidence gate may decide the next commercial test. | **P0** |
| A-04 | Economic output and claims | Synthetic economic evaluation deliberately separates screening signals, opportunity hypotheses, implemented outcomes and verified/sustained results. | UI/docs may accidentally promote energy intensity or estimated rupee exposure into root cause, savings, or ROI claims. | Trace every financial output to source, formula, baseline, exclusions, context comparability, reviewer and customer-approved wording. Keep estimates distinct from measured and verified outcomes. Inspect source/UI before making any claim about current implementation. | **P0** |
| A-05 | Data and security readiness | Master Plan prohibits customer data until Tier 2 scope, rights, approver, secure handling, reviewer, baseline and stop criteria are satisfied. Supabase project status/identity alone does not verify RLS, isolation, persistence or end-to-end behaviour. | “Connected” or “healthy” infrastructure may be interpreted as safe for factory data. | Use four distinct statuses: configured, connected, deployed, functionally verified. Keep real data blocked until exact-path checks and approvals are evidenced. | **P0** |
| A-06 | Repository governance | `docs/README.md` already inventories the 90 documentation files and labels known lifecycle categories; historical operating-model audit is explicitly a dated snapshot. | Creating a second document catalog or another strategy plan would increase drift rather than reduce it. | Keep `docs/README.md` as the document inventory. Use this workpaper only for cross-repository findings and remediation traceability; update the index only when a file's disposition actually changes. | **P1** |
| A-07 | Deployment truth | Current project connection to the correct GitHub repository was observed, but latest production deployment was canceled and no successful current live deployment was established in the prior live check. | Repository connection may be confused with a healthy live product. | Verify the current Vercel deployment and exact commit later in the technical verification phase; do not claim live readiness now. | **P1** |
| A-08 | CI truth | Prior workflow attempts failed before job steps with runner/log retrieval problems; same class of failure occurred on main. | A runner failure could be misreported as either a product-code failure or a successful test. | Preserve the infrastructure blocker; do not weaken checks or infer application correctness. Re-run validation only when the runner issue is understood. | **P1** |

## 3. Controlled remediation order

1. **Close the instruction-authority gap:** review all builder/agent instructions and root roadmap references against the canonical authorities. Park or rewrite stale instructions; preserve useful constraints and history.
2. **Complete the semantic contradiction audit:** inspect the remaining document classes and then map app routes, analysis pipeline, persistence, database migrations/policies, synthetic/reference data, scripts, workflows and public-facing copy. Record file paths and evidence, not impressions.
3. **Create a traceability matrix:** for each material concept/claim, show canonical source, implementation location, current evidence status, dependent files, and required action. Reuse this workpaper and existing index rather than adding another plan.
4. **Resolve in small reviewable PRs:** no bulk deletions/moves; each edit must fix an identified contradiction or a verified operational issue. Preserve historical evidence and test link/reference impact.
5. **Only then perform the connection/readiness pass:** GitHub ↔ Lovable, GitHub ↔ Vercel, app ↔ Supabase, app ↔ database, analysis ↔ persistence, and deployment ↔ exact source commit. Mark each configured/connected/deployed/verified separately.
6. **Final alignment audit:** compare the updated repository to the governing outcome and list unresolved blockers. Strategic completion, repository consistency and technical readiness remain separate statuses.

## 4. File-level decision protocol

Before editing any file, record:
- its present role and authority;
- the exact contradictory or stale instruction;
- the canonical source that resolves the issue;
- what must change and what must be preserved;
- links/imports/workflows that depend on it;
- the validation that can establish completion;
- whether the change is strategy, documentation, product, data, security or release related.

Do not change product scope, pricing, commercial wedge, customer claims, schema, access controls or CI policy merely to make documents look consistent. If evidence is missing, label the item unknown and preserve the blocker.

## 5. Exit criteria

This audit is complete only when:
- all 279 tracked files have an assigned review disposition (or an explicit reason why a file is out of semantic scope);
- every material contradiction has an owner/action and canonical resolution;
- current tool instructions cannot silently initiate parked work;
- all material product claims map to code and evidence or are labelled hypotheses/future work;
- data/economic/security concepts agree across docs, code, schema and UI;
- connections are labelled by verified state rather than assumed state;
- no historical evidence was silently deleted;
- remaining CI/deployment/security/customer-access blockers are stated honestly.

**Current status:** baseline inventory and first-pass contradiction register established; full semantic audit, repository edits, and technical verification remain incomplete.
