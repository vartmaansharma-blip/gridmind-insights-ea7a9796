---
name: Bug or regression
about: Record a reproducible defect with evidence and impact
title: "bug: "
labels: bug
assignees: ""
---

## Observed problem

What is incorrect, missing, or unsafe?

## Expected behavior

What should happen instead?

## Reproduction

1.
2.
3.

## Impact and scope

- Affected screen/workflow/API:
- Affected users/tenants:
- Severity and operational consequence:
- First known occurrence / last known good commit:

## Evidence

- Exact environment and commit:
- Logs, screenshots, or test output (remove secrets and personal/customer data):
- Reproducible test or fixture:
- What is observed vs inferred:

## Acceptance criteria

- [ ] The defect is reproducible or the uncertainty is documented.
- [ ] A regression test covers the failure.
- [ ] The fix preserves authorization, tenant isolation, and truthful unknown/error states.
- [ ] Relevant checks pass on the exact candidate commit.

## Safety / data notes

Does this involve authentication, RLS, customer data, migrations, external systems, or production behavior? If yes, state the safe test environment and required review. Do not attach secrets or unauthorized factory data.
