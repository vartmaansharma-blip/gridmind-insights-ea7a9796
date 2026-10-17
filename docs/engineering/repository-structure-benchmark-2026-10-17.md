# Repository structure benchmark and improvement queue

**Status:** Supporting engineering audit, 17 October 2026. **Scope:** existing private GridMind repository on draft PR #136, not a claim that any repository is “the best”. **Owner:** engineering; founder approves documentation authority. See the [Master Plan](../gridmind-master-plan-2026-10-11.md), [documentation guide](../README.md) and [release gate](../release-gate.md).

## What “better” means here

A founder should find the next decision within two clicks, an implementer should know where a change belongs, and a reviewer should distinguish a plan from working code and a green check from a blocked runner. Those are testable properties. Repository size or resemblance to a large open-source monorepo is not the goal. GridMind is private, early and domain-sensitive, so it should borrow practices without copying scale-specific complexity.

[GitHub's README guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes) says a README should orient readers and link to longer material; [GitHub's protected-branch guidance](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches) distinguishes review and passing checks. [Supabase's contribution guide](https://github.com/supabase/supabase/blob/master/CONTRIBUTING.md) shows explicit development and PR instructions; [Next.js's contribution guide](https://github.com/vercel/next.js/blob/canary/contributing.md) routes work through issues, reviews and tests. These are examples of mature practices, not proof that their complete folder trees suit GridMind.

| Criterion | Mature-repository practice | GridMind on this draft | Decision / remaining gap |
|---|---|---|---|
| One entry point | Short README explains purpose, setup and navigation | Root README and concise `docs/README.md` link to one handbook | Keep both short; test a new reader's ability to find next step. |
| Clear authority | Separate current policy from historical notes | Canonical Master Plan, one live buyer tracker, decision constitution, support folders and archive | Enforce placement/status convention in review; old-path pointers are compatibility only. |
| Stable references | Relative links, managed moves and link checks | 92 content files grouped; old paths point forward; relative links rewritten; staged structural check found zero missing targets/anchors | Get exact-head CI link checker to run; do not delete pointers until inbound references are audited. |
| Contribution workflow | How to propose, test and review changes | `CONTRIBUTING.md`, `AGENTS.md`, PR/issue templates and CODEOWNERS already exist | Verify their instructions match new authority and actual access. Do not manufacture reviewers. |
| Source/build separation | Product code, tests, migrations and examples are visible | `src/`, `tests/`, `e2e/`, `supabase/`, `data/synthetic-investigation/` remain intact | Do not move application/migrations merely for aesthetic uniformity; use dependency-aware code refactors later. |
| PR and CI gate | Required checks on exact head plus human review | Workflows exist; latest jobs failed before ordinary steps and Vercel hit build-rate limit | Fix runner/account/quota; rerun exact-head checks; verify branch rules and independent review. No merge while failed. |
| Reproducible release | Preview, SHA, migration and rollback evidence | Release gate and engineering acceptance specify sequence | Actual authenticated tenant and live-schema tests remain unverified. |
| Security and data rights | Explicit owners, minimal access and protected records | Roles/RLS/reviewer/customer-data rules documented | Verify in running system, especially Supabase drift; documentation is not a security test. |
| Business evidence | Decision log separate from hypotheses | One tracker with zero verified buyer interviews; lane gates and kill rules | Obtain legitimate buyer and reviewer evidence before claiming a paid product. |

## Repository map after the move

```text
README.md                         short project entry
AGENTS.md / CONTRIBUTING.md       working rules
docs/
  README.md                       navigation, not a second strategy
  gridmind-master-plan-*.md       single company handbook
  gridmind-buyer-discovery-*.md   only live buyer-evidence tracker
  gridmind-decision-constitution* durable decisions
  gridmind-problem-solving-*      case discipline
  release-gate.md                 release authority
  product/                       methods, journeys, website and Lovable handoff
  operations/                    contract, economics, delivery risk
  engineering/                   architecture, implementation and verification
  design/                        visual explorations
  research/                      dated hypotheses and desk work
  archive/                       superseded plans and audits
src/                              application
supabase/                         migrations and functions
tests/ and e2e/                   checks
data/synthetic-investigation/     fictional test examples
scripts/ and .github/             automation and review controls
```

The 92 compatibility pointers at prior `docs/` paths keep historical links resolvable. Their presence means the root directory still has many filenames; they contain no competing master content. Once old issue/PR references and external bookmarks are audited, the pointers can be retired in a separate reviewed change. Avoid a bulk source-code reshuffle on this strategy PR because it would obscure implementation review and risk Lovable/Supabase integration.

## Scorecard and next improvements

**Pass on this draft:** one current handbook and evidence tracker, categorized supporting documents, historical quarantine, preserved links in a staged structural test, existing templates/ownership instructions, clear site-first sequence. **Not yet passed:** exact-head CI, Vercel preview, independent review, verified branch protection, authenticated tenant release tests, paid customer evidence. This is an honest “organized for execution” result, not a best-in-class production certificate.

1. Restore Actions execution and Vercel build capacity; run the existing checks on the exact PR head and record logs.
2. Review `CONTRIBUTING.md`, `AGENTS.md` and PR template against this documentation map; update stale path/authority language with a small separate commit.
3. Inspect branch protection/ruleset settings and CODEOWNERS membership; require real review and exact-head checks when available. Do not assume a file alone enforces protection.
4. Reconcile open PRs #132, #133, #125 and #120 with the new site/portal sequence before combining or closing them.
5. After first real customer/reviewer evidence, remove redundant historical summaries where links allow, and refine code module boundaries based on observed case flow.

**Benchmark verdict:** The repository now has the navigation, authority and change history needed for a small private company. It does **not** yet match mature projects on enforced, passing review/release automation. That is the highest-impact gap; adding more folders cannot fix it.
