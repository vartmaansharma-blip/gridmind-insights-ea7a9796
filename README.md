# GridMind Insights

> **Intelligence for energy-intensive physical infrastructure.**

GridMind Insights is an industrial intelligence platform designed to help factories understand energy performance, machine behaviour, operational losses, and improvement opportunities.

## Production

**Live production application:** https://gridmind-insights.lovable.app

The production application provides the current deployed GridMind experience.

## What GridMind does

GridMind follows an evidence-first workflow:

**DATA → BASELINE → DETECT → EXPLAIN → QUANTIFY → RECOMMEND → VERIFY → LEARN**

It is designed to help industrial teams answer:

- Where is the factory losing money or usable capacity?
- What changed in energy or machine performance?
- What evidence supports the finding?
- What may be causing the abnormal behaviour?
- What action should be investigated or taken?
- What improvement was actually achieved after an intervention?

## Core capabilities

- Factory energy intelligence
- Machine and asset intelligence
- Machine passports and retrofit assessment
- Energy, demand and production analysis
- Data-quality monitoring
- Diagnostic rules and anomaly detection
- Opportunity identification and financial impact analysis
- Intervention tracking
- Savings measurement and verification
- Synthetic factory/data scenarios for development and testing

## Evidence model

GridMind distinguishes between:

- **Observed** — directly supported by supplied measurements
- **Estimated** — calculated from available data
- **Hypothesis** — a possible explanation requiring validation
- **Recommended** — a proposed next action
- **Verified** — supported by post-intervention evidence

Synthetic/demo data must not be presented as real factory measurements or verified customer savings.

## Product architecture

The platform is being developed around a factory-to-asset intelligence model:

**Factory → Systems/Areas → Machines → Sensors → Measurements → Findings → Opportunities → Interventions → Verification**

For legacy industrial equipment, the intended approach is a retrofit sensing layer and gateway rather than requiring every machine to have native digital connectivity.

## Safety and reliability principles

GridMind is designed to:

- fail closed when evidence is insufficient
- distinguish sensor/data problems from machine problems
- reject invalid, stale, duplicate or impossible measurements
- avoid unsupported financial claims
- preserve calculation and diagnostic traceability
- keep initial OT integrations read-only
- verify savings rather than assuming them

## Current status

The repository contains the current GridMind application and its supporting product architecture. Development is ongoing toward a production-ready industrial intelligence platform.

Repository quality gates now run automatically on `main`, `develop`, and pull requests targeting either branch. The required automated gate is TypeScript typecheck → ESLint → production build. See [`docs/release-gate.md`](docs/release-gate.md) for the release standard.

## Repository

GitHub: https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796

## Development

The project should be treated as an industrial intelligence product rather than a generic analytics dashboard. Changes should preserve the evidence hierarchy, data-quality safeguards, deterministic calculations, and separation between synthetic/demo data and real measured data.

The project is developed with [Lovable](https://lovable.dev).

