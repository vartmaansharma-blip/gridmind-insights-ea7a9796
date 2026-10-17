# GridMind Opportunity Engine v1

## Purpose

Convert trustworthy factory observations into a prioritized queue of economically meaningful opportunities while preserving evidence boundaries.

## Pipeline

INGEST
-> VALIDATE
-> NORMALIZE
-> CONTEXTUALIZE
-> REFERENCE
-> DETECT
-> QUALIFY
-> QUANTIFY
-> PRIORITIZE
-> RECOMMEND
-> INTERVENE
-> VERIFY
-> LEARN

## V1 opportunity detectors

### 1. Excess normalized energy
Detect when comparable production-normalized energy is materially above a defensible reference.

Required evidence:
- energy
- production
- comparable operating context
- reference
- acceptable data quality

Output:
- observed deviation
- estimated excess energy
- estimated cost impact
- confidence
- missing evidence

### 2. Idle/off-hours consumption
Detect meaningful energy consumption during documented non-production or low-production periods.

Required evidence:
- energy/demand
- production or operating-state evidence
- operating schedule

Output must distinguish confirmed non-production from merely low production.

### 3. Demand/capacity behavior
Identify repeated or material demand peaks relative to contract/capacity conditions.

Required evidence:
- interval demand or equivalent peak data
- contract demand where relevant
- billing/tariff context

GridMind must not assume a demand peak is avoidable without operating-context evidence.

### 4. System/process deterioration
Detect a normalized performance change in a system or process.

Required evidence:
- relevant performance metric
- comparable reference
- operating context
- uncertainty/significance assessment

The output is a performance deviation, not an automatic component failure.

### 5. Evidence gap
Create an opportunity/evidence task when a potentially material signal exists but the current evidence cannot distinguish among plausible explanations.

This is a first-class product outcome.

## Qualification rules

An opportunity may move to CONFIRMED only when:
- identity is valid
- data quality passes
- reference is defensible
- required context exists
- uncertainty is assessed
- minimum observation window is met
- alternative explanations are considered

Otherwise state remains INVESTIGATING or UNKNOWN.

## Recommended output

Each opportunity contains:

WHAT HAPPENED
WHERE
WHEN
OBSERVED EVIDENCE
REFERENCE
DEVIATION
ESTIMATED ECONOMIC IMPACT
CONFIDENCE
POSSIBLE EXPLANATIONS
MISSING EVIDENCE
NEXT CHECK
RECOMMENDED ACTION
REQUIRED PERSONNEL
VERIFICATION PLAN

## No-false-certainty rule

The engine must prefer:
- UNKNOWN over unsupported certainty
- EVIDENCE GAP over invented cause
- ESTIMATED over VERIFIED
- INVESTIGATING over CONFIRMED when evidence is incomplete

## Learning

After intervention:
- record actual cause/finding
- record action
- record pre/post measurements
- normalize relevant operating variables
- calculate outcome
- verify or reject expected improvement
- retain the outcome as reusable evidence

Every validated outcome should improve future detection, prioritization or evidence requirements.
