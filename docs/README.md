# GridMind repository guide

**Last reviewed:** 2026-10-12  
**Purpose:** One navigation point for current decisions, live work, engineering controls, and reference material.

## Read these first

1. **[Master Plan](gridmind-master-plan-2026-10-11.md)** — the sole company execution plan: current objective, candidate register, next gates, safety boundaries, and decision dates.
2. **[Buyer Discovery Sprint](gridmind-buyer-discovery-sprint-2026-10-11.md)** — the sole live customer-access and discovery tracker. Record real events here; do not create a parallel tracker.
3. **[Decision Constitution](gridmind-decision-constitution-and-contradiction-register-2026-10-10.md)** — binding strategic, evidence, security, and safety guardrails; includes durable decisions and the rationale for changes.
4. **[Repository Verification Audit](gridmind-verification-audit-2026-10-12.md)** — point-in-time audit; recheck live services and CI before relying on operational findings.
5. **[Repository Operating Model and Structural Audit](gridmind-repository-operating-model-and-audit-2026-10-12.md)** — source-of-truth rules, document classification, initial PR triage, and execution-readiness gates.

## Current state — verified as of this review

- GridMind's commercial wedge is **not selected**.
- C1 (downtime/production-loss investigation) and C4 (energy/material inefficiency) are discovery probes, not product commitments.
- The founder reports that an initial public-route inquiry to ASIA was sent on 2026-10-12. No reply, referral, buyer conversation, factory access, customer-data permission, paid demand, or verified savings is confirmed.
- The next access test is a small, genuine 3–5 warm-introduction-request effort by 2026-10-19, subject to actual capacity. This is an access experiment, not market validation. Do not invent contacts or treat planned outreach as sent.
- No document, demo, passing build, or synthetic test is proof of customer demand or production readiness.

## Engineering and release controls

- [Technical Readiness Snapshot](gridmind-technical-readiness-snapshot-2026-10-11.md) — historical, read-only snapshot; verify current live state.
- [Supabase Connection & Security Audit](gridmind-supabase-connection-security-audit-2026-10-11.md)
- [Secure Operation & Factory Value Milestone](gridmind-secure-operation-and-factory-value-milestone-2026-10-11.md)
- [Production Schema Alignment Runbook](gridmind-production-schema-alignment-runbook-2026-10-11.md)
- [Live Acceptance Runbook](gridmind-live-acceptance-runbook.md)
- [Canonical Application Migration](canonical-application-migration-v1.md)
- [Migration History](gridmind-migration-history.md)
- [Release Gate](release-gate.md)
- [Authoritative Analysis](gridmind-authoritative-analysis.md)
- [Factory Value-Chain Intelligence Model](gridmind-factory-value-chain-intelligence.md)
- [Factory Performance Intelligence](factory-performance-intelligence-v1.md)
- [Factory Economic Model](factory-economic-model-v1.md)
- [Opportunity Engine v1](opportunity-engine-v1.md)
- [Opportunity Schema](../data/opportunity-schema-v1.json)

Engineering must remain subordinate to validated scope. Preserve security controls; do not use customer or production data without authorization, data-rights checks, qualified review, and a tested workflow.

## Product and commercial references

These documents explain product concepts and candidate workflows. They do **not** select the commercial wedge or authorise implementation beyond the Master Plan.

- [Product Definition](gridmind-product-definition.md)
- [First Use-Case Data Contract](gridmind-first-use-case-data-contract.md)
- [Factory Economic Model](factory-economic-model-v1.md)
- [Accuracy and Validation Standard](gridmind-accuracy-and-validation-standard.md)
- [Problem Failure Analysis](gridmind-problem-failure-analysis-and-experiments-2026-10-11.md)
- [Commercial Wedge Scorecard](gridmind-initial-commercial-wedge-scorecard-2026-10-11.md)
- [Opportunity Validation Framework](gridmind-opportunity-validation-and-buyer-evidence-framework-2026-10-11.md)
- [Manufacturing Workflow Stress Test](gridmind-manufacturing-expert-simulation-and-wedge-stress-test-2026-10-11.md)
- [Real Factory Pilot Data Request](gridmind-real-factory-pilot-data-request.md)
- [Pilot Comparison Scorecard](gridmind-pilot-comparison-scorecard.md)

## Research, strategy history, and design

Files in this group are supporting research, historical audits, alternatives, or deferred design concepts. Their dated targets and recommendations are not active instructions unless the Master Plan and Decision Constitution explicitly adopt them. The root [`roadmap.md`](../roadmap.md) is a parked product-design reference, not a second execution plan; re-entry requires explicit prioritization in the Master Plan and a scoped GitHub Issue.

- [Bigger Problem Thesis](gridmind-bigger-problem-thesis-2026-10-11.md)
- [Industrial Venture Strategy Research](gridmind-industrial-venture-strategy-research-2026-10-10.md)
- [Business Thesis Ratings](business-thesis-ratings-2026-10-10.md)
- [Founder Opportunity Cost Review](founder-opportunity-cost-review-b2b-vs-b2c-2026-10-11.md)
- [Strategic Leverage Map](gridmind-strategic-leverage-map-2026-10-11.md)
- [Data Advantage Strategy](gridmind-data-advantage-strategy.md)
- [Expansion Architecture](gridmind-expansion-architecture-2026-10-10.md)
- [Website Marketing and Sales Strategy](gridmind-website-marketing-sales-strategy.md)
- [Main Website Homepage Specification](gridmind-main-website-homepage-spec.md)
- [Brand Definition and Name Risk](gridmind-brand-definition-and-name-risk-2026-10-11.md)
- [Creative Direction](gridmind-creative-direction-clarity-engineered-2026-10-11.md)
- [Creative Directions Comparison](gridmind-creative-directions-comparison-2026-10-11.md)
- [Signature Motion Prototype Specification](gridmind-signature-motion-prototype-spec-2026-10-11.md)

Other dated plans and audits are retained for historical traceability. Do not use them as competing task queues. Before moving or deleting them, check inbound links and preserve useful historical context. Do not create another master plan, strategy plan, or discovery tracker; update the canonical documents when material evidence changes a decision.

## Change and evidence discipline

- Public-source claims, customer statements, and controlled experimental results are distinct evidence classes.
- Unknowns stay unknown; no invented conversion rates, customer demand, root causes, accuracy, ROI, or savings.
- Each material decision should record the choice, evidence, alternatives rejected, risks, date, and affected work.
- Use GitHub issues for actionable work and acceptance criteria; link implementation PRs to their issues.
- Do not merge a PR until its diff, checks, migration implications, and security impact have been reviewed.
