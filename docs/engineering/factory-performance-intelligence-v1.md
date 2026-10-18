# GridMind Factory Performance Intelligence v1

## Purpose

GridMind's first product objective is to repeatedly turn real factory data into traceable, economically meaningful, and verifiable operational outcomes.

The primary customer question is:

> Where is the factory losing money or usable capacity, what evidence supports that conclusion, what should be investigated or changed, and did the intervention work?

## Product hierarchy

1. Factory economic model
2. Data ingestion and quality
3. Operating context
4. Performance reference
5. Opportunity detection
6. Evidence and uncertainty
7. Economic impact
8. Recommended action
9. Intervention
10. Measurement and verification
11. Learning

Machine intelligence is a supporting evidence layer. It is expanded only when real customer cases demonstrate that deeper machine-specific knowledge creates material value.

## Core object

The primary analytical object is an Opportunity, not a machine.

An opportunity must contain:
- observed signal
- affected factory/system/asset/process
- time window
- reference/comparison basis
- operating context
- data-quality status
- evidence available
- evidence missing
- uncertainty/confidence
- economic impact and calculation lineage
- possible explanations
- recommended investigation/action
- intervention linkage
- post-intervention verification status
- rule/reference/calculation versions

## Evidence hierarchy

GridMind must distinguish:
- OBSERVED: directly supported by supplied measurements or records
- ESTIMATED: deterministic calculation from observed inputs
- HYPOTHESIS: plausible explanation not yet established
- RECOMMENDED: proposed investigation/action
- VERIFIED: supported by documented intervention and valid post-intervention M&V
- UNKNOWN: evidence is insufficient to establish the answer

## Data-source strategy

For every analytical question, use the cheapest trustworthy existing source first:
1. existing controller/PLC/drive/historian data
2. existing industrial protocol
3. existing utility/energy meter
4. existing production/maintenance records
5. manual observation
6. retrofit measurement

A new sensor is justified only when it is necessary to reduce material uncertainty and its expected value justifies deployment.

## Initial opportunity classes

V1 focuses on:
1. Excess normalized energy
2. Idle/off-hours consumption
3. Demand/capacity behavior
4. Material process/system performance deterioration
5. High-value evidence gaps requiring additional measurement

These are opportunity classes, not automatic fault diagnoses.

## Financial model

Every economic result retains:
- source measurements
- production/operating context
- tariff
- reference/baseline
- formula
- assumptions
- uncertainty where available
- calculation version
- timestamp

Financial states:
OBSERVED, ESTIMATED, POTENTIAL, EXPECTED, VERIFIED.

No result may be labelled VERIFIED without documented intervention, comparable pre/post data, normalization where required, uncertainty/significance assessment, and complete lineage.

## Verification loop

BASELINE -> INTERVENTION -> POST-INTERVENTION -> NORMALIZE -> COMPARE -> VERIFY_OR_REJECT

Raw before/after totals are not sufficient when production, operating conditions, tariff, maintenance, or other relevant variables changed.

## Machine knowledge policy

The existing 49-machine regional foundation is retained as reusable knowledge infrastructure but expansion is frozen until the core value loop is demonstrated on real industrial data.

No machine-specific diagnostic may become production-authoritative merely because a catalogue record exists.

Machine-specific intelligence should progress through:
catalogue -> engineering model -> measurement model -> performance model -> diagnostic model -> field validation.

## Development gate

The next product milestone is one complete, reproducible real-data value loop:

REAL FACTORY DATA
-> VALIDATE
-> CONTEXTUALIZE
-> ESTABLISH REFERENCE
-> IDENTIFY OPPORTUNITY
-> TRACE EVIDENCE
-> QUANTIFY ECONOMIC IMPACT
-> RECOMMEND INVESTIGATION/ACTION
-> RECORD INTERVENTION
-> VERIFY OUTCOME

Success is measured by verified economic value and repeatability, not number of machine records or dashboard screens.

## Explicitly frozen for V1

- expansion toward 1,000 machine archetypes
- broad manufacturer-specific machine knowledge
- universal sensor deployment
- autonomous OT control
- generalized predictive-maintenance claims
- unsupported machine-failure conclusions
- elaborate visualization before evidence exists

## Target learning flywheel

REAL FACTORY
-> DATA
-> OPPORTUNITY
-> EVIDENCE
-> ACTION
-> INTERVENTION
-> VERIFIED OUTCOME
-> KNOWLEDGE
-> BETTER DETECTION
-> NEXT FACTORY

The long-term company remains an industrial evidence and intelligence layer. V1 is deliberately narrower so the long-term moat is learned from verified industrial outcomes rather than assumed in advance.
