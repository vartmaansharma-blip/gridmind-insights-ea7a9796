# Change history

This records repository changes, not a published production release. Exact acceptance evidence and limitations live in the linked PRs and the [release gate](docs/release-gate.md).

## 2026-10-15

- [PR #69](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/69): repository-wide semantic lint, consolidated core CI, canonical opportunity lifecycle values, and accurate gate documentation. Lovable-generated integrations remain unchanged.
- [PR #37](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/37): persisted equipment metadata survives reload; opportunity/outcome rows map explicitly to application contracts; stored currencies and null/zero evidence values are preserved.
- [PR #14](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/14): provenance duplication, cross-factory asset identity, and incomplete economic context are rejected or blocked by local intake preflight.
- [PR #73](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/73): six vulnerable transitive lockfile entries repaired within compatible ranges. The fresh audit reported no advisories; direct dependencies and Bun 1.3.5 remain unchanged.
- Repository essentials: explicit Lovable/Codex handoff, safe development configuration, security/support/ownership guidance, editor defaults, dependency-update proposals, and pinned workflow actions. These controls still require operational verification where noted below.

**Remaining verification:** GitHub Actions runner/billing blocker (#42), effective branch enforcement (#46), and live database/browser acceptance (#29/#68) remain open. Local checks and synthetic regressions are not customer validation, production readiness, or verified savings.
