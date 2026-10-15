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

**Enforcement status:** workflows express the intended gates; they do not prove passing execution or protected merges. On 2026-10-15 the current main's latest runs still failed before normal step execution. [Issue #42](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/42) tracks the Actions blocker. [Issue #46](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/46) tracks effective branch/ruleset enforcement. Require checks only after they execute reliably, and confirm the actual current check names in repository settings.

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
