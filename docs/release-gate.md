# GridMind Release Gate

> **Current routing/status correction — 20 October 2026:** #136 merged documentation consolidation; broad-candidate draft/HOLD is historical. Approved public `/` and application `/dashboard` were merged in #149; preserve `/design-preview`, `/website` compatibility and green identity. Current active M1 is #152/#154, still subject to independent review. The [Master Plan](gridmind-master-plan-2026-10-11.md) owns dependencies; all security/data/release gates below remain binding. No production mutation is authorized by a documentation update.

GridMind is an industrial intelligence product. A green deployment is not established by a successful UI preview alone.

## Required checks

Every change intended for `main` must pass:

1. TypeScript typecheck
2. ESLint
3. Production build
4. Critical-path verification appropriate to the change
5. Data, financial, diagnostic, and security checks when the change touches those areas

## Automated validation responsibilities

- **CI:** documentation links, TypeScript, repository-wide semantic ESLint, Vitest, and production build on PRs targeting `main`/`develop` and pushes to `main`, `develop`, and `feature/**`.
- **GridMind Quality Gate:** Deno typechecking for the authoritative Edge Function and HTTP acceptance test. Core application checks run once in CI.
- **GridMind Migration Replay:** isolated clean migration replay, SQL schema/security assertions, and authenticated HTTP acceptance. This is separate from a production readiness audit.
- **GridMind Pilot Intake Validator:** Python regression tests when its implementation, tests, or workflow changes.

Run `bun run check` locally for the same core application checks. Run Python and Deno checks separately when relevant. ESLint covers maintained TypeScript/JavaScript, including scripts and functions; build output and the generated route tree are excluded. Formatting is a separate `bun run format:check` command. Existing formatting debt and Fast Refresh warnings remain visible; neither is represented as resolved by a semantic lint pass.

**Enforcement status (reconciled 2026-10-15):** workflows express intended gates but do not by themselves enforce merges or establish production readiness. [Issue #42](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/42) documents **restoration of GitHub Actions runner execution** on 2026-10-15, with CI, intake and isolated migration replay reported passing on an exact main candidate; an additional Quality Gate dependency issue was tracked in #80 and fixed in PR #81 with remote checks. This supersedes earlier same-day wording that 'latest runs still failed before steps'. **New commits require their own passing checks.** [Issue #46](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/46) remains open for actual branch/ruleset inspection and enforceability. **By 2026-10-24** the owner should record repository plan entitlement, effective rules, stable check names and either enabled practical enforcement or a manual PR review/check-record protocol with explicit limits. Never imply manual checks are technically enforced; never bypass failed checks as a standing practice.

**17 October update:** The founder made the same repository public after the private Actions budget reached $6/$6. On PR #136 head `3c4586d8d644dc7af5141f14c7c64cef47b826ae`, CI, Quality Gate, isolated Migration Replay, Public Site Browser and Vercel preview all passed. An active [main ruleset](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/settings/rules/25302961) now requires a PR, those five exact check contexts, an up-to-date branch and resolved conversations; it blocks force pushes and deletions and has no bypass actor. Required approval count is **zero** because this is a solo-owner repository: the independent review required for security-sensitive changes remains a manual gate, **not** enforced by GitHub. [Issue #46](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/46) stays open until a harmless PR exercises rule enforcement and the reviewer plan is established. Passing preview and isolated replay do not reconcile production Supabase migrations or authorize a production deployment.

## GridMind 3.1 pre-merge release classification (17 October 2026)

**Historical #136 scope lesson:** the broad draft originally required narrowing or full sensitive-diff review. Its final documentation consolidation merged as `363cbfa`; there is no current instruction to hold that completed PR. The [historical packet](engineering/gridmind-3-1-pre-merge-decision-packet-2026-10-17.md) preserves the rationale. Apply candidate-specific release classes and required checks to current work, including draft #154. No force push, rewritten Lovable history, bypassed check or fabricated signoff.

**Three separate approvals:**

1. **Informational release (Class I):** founder-approved accurate and provisional /website claims, clearly fictional cases, operated non-confidential contact, privacy and mobile/accessibility verification, safe existing routes, exact preview SHA, rollback, and explicit authorization to change production-linked main.
2. **Synthetic internal demo (Class S):** tests for non-persistence/isolated storage, role/tenant denial, frozen revisions, correct reviewer simulation labels, no unintended exposure or customer uploads, and permitted environment/feature flags. Synthetic-green is *not* permission for real use.
3. **Real customer-data service (Class D):** **NO-GO** until owner data rights, [#130](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/130) production migration reconciliation/backups and [#29](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/29) populated tenant/authenticated acceptance are independently completed, with applicable domain professional review, contract/retention and separate founder/operator release permission.

**Review separation:** A solo-maintainer ruleset that requires zero human approvals is not evidence of independent code/security review. A different competent reviewer must examine tenancy, permission, Edge Function, migration and customer-data boundaries and record findings. The founder must separately authorize claims and the exact deployment scope. A qualified industrial reviewer must approve any consequential professional conclusion within competence before it can be offered as such.

**Exact-SHA gate:** Record passing named CI, Quality Gate, Public Site Browser, isolated Migration Replay and required Vercel check on the **final** commit, and inspect deployed preview content/SHA, auth/deep links and a non-confidential contact round trip. Documentation-only commits still move the head and require fresh checks under configured rules. CI and isolated SQL tests may pass while production release remains blocked.

**Reconciliation:** [#132](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/132) proposes root/onboarding changes, [#133](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/133) an analysis bridge, [#125](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/125) earlier CTA and [#120](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/120) a parked scooter catalogue whose migration history intersects live Supabase. These are **not** merged by implication. Classify conflicts and record decisions on original PRs. Preserve approved public `/` and application `/dashboard` after #149; reconcile only remaining deltas in old route proposals.

**Hard no-go:** unknown/uncleared data rights; failing required check; unreviewed sensitive diff; preview not matching target SHA; unplanned automated deployment; cross-tenant exposure; unsupervised industrial or financial representation; irreversible migration without authorized backup/forward-only plan; absent rollback owner. Stop, narrow scope or keep draft—never weaken checks to force approval.

## Evidence rules

- Synthetic/demo data must remain explicitly synthetic.
- Missing data is not zero.
- An observation is not a diagnosis.
- An estimate is not verified savings.
- A hypothesis is not a fact.
- Financial outputs must retain their calculation lineage and assumptions.
- Analysis should fail closed when required evidence is missing or invalid.

## Development flow

Use a focused issue-linked branch and PR, following [CONTRIBUTING.md](../CONTRIBUTING.md). Changes may target `main` directly through review or use `develop` as an integration branch; both targets run core CI, Edge Function typechecking, and isolated migration replay. An integration branch does not replace validation on the final candidate for `main`.

Preserve published Lovable-connected history. Use new commits or merge commits to incorporate changes; do not rebase or squash published commits.

Use focused commits that describe the actual change. Do not mark a roadmap or specification as an implementation unless production code was changed and verified.

## Before release

Confirm:

- build is green
- typecheck is green
- lint is green
- changed routes work
- loading/empty/error states work
- mobile layout is checked for affected screens
- no synthetic result is presented as observed or verified
- no unsupported machine-failure or savings claim has been introduced

For consequential industrial workflows, correctness and evidence take priority over visual completeness.

## Lovable-compatible repository maintenance

Preserve the existing app/template stack and generated integrations. Lovable owns design; Codex owns backend and repository controls. A data-contract repair may require a minimal display adapter, with no visual redesign. Check the current package manager, Vite wrapper, `.lovable/project.json`, generated files, types, queries, and relevant tests before declaring compatibility preserved.

Workflow actions are pinned to verified SHAs, checkout does not retain credentials, and Deno checks use 2.9.6. Dependabot proposals require review. The migration workflow now requests fixed Supabase CLI `2.121.0` instead of a moving `latest` lookup, after the latter hit a GitHub API rate limit on PR #136. Treat the pin as verified only when the new exact-head isolated replay completes; a previous replay of an earlier head does not prove this setup change.

On 2026-10-15 the owner explicitly authorized the documented maintenance merges using exact-candidate local validation while Actions was blocked before execution. This exception is recorded in the PRs. It does not mark remote checks as passed, create a blanket future bypass, or approve production/customer-data use. Restore Actions and verify actual required-check names and effective branch rules before relying on automated merge enforcement.
