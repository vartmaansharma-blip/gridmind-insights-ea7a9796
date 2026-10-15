# GridMind Problem-Solving Constitution

**Version:** 1.0  
**Adopted:** 2026-10-12  
**Status:** Operating standard for all GridMind strategy, product, engineering, customer, and repository work.

## Purpose

Make GridMind decisions evidence-led, execution reliable, and progress cumulative. No process can guarantee zero mistakes. This standard reduces error probability, detects failures early, limits consequences, and prevents recurrence.

## 1. Define the problem before solving it

For every task, state the specific problem, why it matters, evidence that it exists, observable completion criteria, constraints, and dependencies. Distinguish symptoms from root causes. Do not start broad changes when the actual failure is not yet understood.

**Pass condition:** The problem and definition of done are clear before execution.

## 2. Inspect existing work first

Inspect relevant canonical documents, source code, issues, pull requests, recent commits, test results, and prior attempts before proposing or making changes. Classify the state as: solved and verified; implemented but unverified; documented but not implemented; partially solved; unresolved; or blocked externally. Do not recreate work or reopen settled decisions without new evidence.

**Pass condition:** Work begins from the actual current state, not an assumption.

## 3. Separate evidence classes

Label material statements as:
- **Fact:** directly supported by observable evidence.
- **Hypothesis:** plausible but untested.
- **Decision:** an explicit choice made using available evidence.
- **Unknown:** information not yet established.
- **Inference:** a conclusion derived from facts, with inspectable reasoning.

Do not upgrade a hypothesis to a fact because it sounds plausible. A sent email is evidence of outreach, not evidence of demand. A green build is not proof of production readiness or customer value.

**Pass condition:** Claim strength matches evidence strength.

## 4. Prioritize by risk, value, and dependencies

Default priority:
1. Safety, authorization, security, legal, and data-integrity risks.
2. Blockers to reliable operation or trustworthy results.
3. Evidence required for major business decisions.
4. Work that validates or delivers customer value.
5. Work that improves repeatability, quality, or unit economics.
6. Cosmetic and optional enhancements.

Adjust for dependencies, urgency, reversibility, and cost of delay. Explain why the selected task outranks alternatives.

**Pass condition:** The priority is defensible against the current queue.

## 5. Use first principles and appropriate expertise

Reason from the customer's required outcome, the underlying mechanism, required information, measurable quantities, possible interventions, and outcome verification. First-principles reasoning does not replace qualified engineering, industrial, legal, financial, or security expertise. Seek review where conclusions or actions exceed the team's demonstrated competence.

**Pass condition:** The solution addresses the underlying problem with appropriate domain oversight.

## 6. Make the smallest complete change

Choose the smallest maintainable change that fully meets the acceptance criteria. Identify affected components, dependencies, behavior to preserve, regression checks, and recovery/rollback path. Avoid speculative features and unrelated refactors; do not use minimal scope as an excuse to leave the actual problem unsolved.

**Pass condition:** The change is proportionate, complete, and regression-aware.

## 7. Verify independently

Verification must match the task:
- **Documentation:** links, consistency, dates, authority, factual accuracy, and cross-references.
- **Code:** exact commit, relevant tests, type checks, lint, build, and regression checks.
- **Database/security:** isolated migration replay, authorization, tenant/factory isolation, persistence, and security review as applicable.
- **Analysis:** source checks, recalculation, assumptions, edge cases, uncertainty, and sensitivity.
- **Customer discovery:** actual conversations, specific observed events, current alternatives, decision ownership, and explicit separation of statements from observed behavior.
- **Commercial offer:** defined scope, delivery effort/cost, buyer evidence, exclusions, and no unsupported promises.

Use independent review when the consequences of error are material. A successful tool call or changed file alone is not verification.

**Pass condition:** Evidence shows that the intended outcome occurred.

## 8. Report status truthfully

End each task in exactly one state:
- **Complete and verified**
- **Implemented; verification pending**
- **Partially complete**
- **Blocked**

Report changes, exact checks performed, observed results, failures, residual risks, and external dependencies. Never claim tests, builds, migrations, security, customer value, or savings passed unless the evidence demonstrates it.

**Pass condition:** Another person can understand the true state without guessing.

## 9. Preserve durable decisions and eliminate contradictions

Record durable decisions in the canonical GitHub document or an appropriately scoped issue/PR. Include the decision/date, evidence, alternatives, rationale, risks, consequences, and reconsideration trigger. Update existing sources of truth; do not create competing master plans or trackers. Record strategic/product/security/pricing decisions, not every temporary implementation detail.

**Pass condition:** Future work can continue without rediscovering prior reasoning.

## 10. Finish one problem at a time

For each problem: inspect → define → prioritize → plan → execute → verify → score → record lessons → choose the next highest-priority unresolved task. Resolve newly discovered blockers when necessary for the current task or to prevent harm; otherwise log and sequence them. Do not leave silent half-finished work.

**Pass condition:** There is a verified outcome or a clearly documented blocker with a concrete next action.

## Mandatory end-of-task scorecard

Every completed problem receives a score out of 10 with evidence. Score the result, not effort or polish.

| Dimension | Weight | What earns full credit |
|---|---:|---|
| Problem definition and scope | 2 | Root problem and acceptance criteria were explicit; scope stayed controlled. |
| Accuracy and evidence | 2 | Claims are supported; assumptions and unknowns are visible. |
| Execution quality | 2 | Change is complete, maintainable, and avoids unnecessary side effects. |
| Independent verification | 3 | Appropriate checks ran on the exact changed version and results are reported. |
| Repeatability and recordkeeping | 1 | Durable decisions/results are recorded in the correct canonical location. |

Rate each dimension proportionately, add them to a score out of 10, and state the reason for any lost points. A task cannot receive full marks while critical verification remains pending or a material risk is concealed.

After the score, include:
1. **Outcome:** what is now true, with links/evidence.
2. **Remaining work:** only real open items or dependencies.
3. **Future-answer rules:** 2–4 task-specific lessons that improve the next response or prevent recurrence.
4. **Next task:** the single highest-priority unresolved item and why it comes next.

A blocker can be handled well without being falsely labelled solved. Score the quality of the diagnosis and safe containment, and keep the underlying problem open.

## Non-negotiable GridMind boundaries

- Customer value and market selection require customer evidence; documentation and synthetic tests do not substitute for it.
- No customer or production data without authorization, data-rights checks, and an appropriate security-tested workflow.
- No industrial, safety-critical, production-critical, or material purchasing action is autonomously authorized by GridMind.
- Findings must distinguish observations, inferences, hypotheses, recommendations, approved actions, measured results, and verified outcomes.
- No unqualified technical sign-off, savings guarantee, or accuracy/superiority claim.
- Do not weaken controls merely to obtain a green check.
- Preserve the long-term GridMind thesis while keeping the immediate wedge undecided until evidence supports selection.

## Enforcement

Apply this constitution to every substantial GridMind task. If a task conflicts with a higher-priority safety/security requirement or the canonical Decision Constitution, follow the higher-priority rule and record the conflict. Review this standard when repeated failures or new evidence show that it is insufficient; do not change it casually to excuse a poor result.
