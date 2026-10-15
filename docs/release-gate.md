# GridMind Release Gate

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

Workflow actions are pinned to verified SHAs, checkout does not retain credentials, and Deno checks use 2.9.6. Dependabot proposals require review. The migration CLI remains a moving `latest` version until a fixed version is selected and verified during restored isolated replay; that limitation is not hidden by a successful local app build.

On 2026-10-15 the owner explicitly authorized the documented maintenance merges using exact-candidate local validation while Actions was blocked before execution. This exception is recorded in the PRs. It does not mark remote checks as passed, create a blanket future bypass, or approve production/customer-data use. Restore Actions and verify actual required-check names and effective branch rules before relying on automated merge enforcement.
