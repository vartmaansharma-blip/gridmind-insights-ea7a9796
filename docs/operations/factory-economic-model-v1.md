# GridMind Factory Economic Model v1

## Objective

Represent the economic and operating context required to determine whether a factory performance change is materially important.

GridMind must not optimize for energy reduction alone. The model connects physical performance to production, operating conditions, tariff structure and financial consequence.

## Canonical hierarchy

Factory
-> Site
-> Utility / Energy Source
-> Process / Area
-> Asset / System
-> Measurement
-> Production Context
-> Operating Event
-> Opportunity
-> Intervention
-> Verification

## Factory economic profile

Required where available:
- factory_id
- site_id
- currency
- billing_period
- tariff_structure
- contract_demand
- billing_demand
- energy_charges
- demand_charges
- fixed_charges
- power_factor_charges_or_credits
- penalties_or_surcharges
- taxes_or_pass_through_items
- generation_sources
- production_units
- production_unit_definition
- operating_hours
- shift_pattern

Unknown values remain unknown. They are never silently replaced with zero.

## Energy measurements

Canonical fields:
- measurement_id
- factory_id
- asset_or_system_id
- metric
- value
- unit
- measured_at
- received_at
- source
- quality_status
- quality_flags
- schema_version

Core metrics:
- energy
- active_power
- apparent_power
- reactive_power
- demand
- power_factor
- runtime
- operating_state

## Production context

Where relevant:
- production_quantity
- production_unit
- product_or_sku
- process
- shift
- operating_state
- runtime
- batch
- changeover
- maintenance_state

Production data must be linked to the same comparison period as the performance measurement whenever normalization is required.

## Core derived metrics

Energy intensity:
energy_consumption / production_quantity

Cost intensity:
electricity_cost / production_quantity

Operating-hour intensity:
energy_consumption / operating_hours

Demand utilization:
billing_or_peak_demand / contract_demand * 100

Excess normalized energy:
max((observed_intensity - reference_intensity) * comparable_production, 0)

Estimated excess energy cost:
excess_normalized_energy * applicable_tariff

These calculations are only valid when units, time windows, context and reference quality are acceptable.

## Reference model

Reference candidates:
1. comparable historical operation
2. comparable production periods
3. documented engineering relationship
4. comparable asset/system operation
5. manufacturer specification as a constraint, never as proof of health

Reference exclusions:
- known abnormal operation
- maintenance
- startup/shutdown when not comparable
- changeover
- contaminated data
- missing critical context
- known production/process changes

Reference confidence:
HIGH, MEDIUM, LOW, UNCERTAIN.

## Opportunity qualification

An economic opportunity requires:
- material deviation or avoidable cost signal
- acceptable data quality
- comparable context
- defensible reference
- traceable calculation
- uncertainty/significance assessment

If these conditions are not satisfied, GridMind should create an evidence gap or suppress the opportunity rather than manufacture certainty.

## Opportunity priority

Priority should be based on:
- estimated economic impact
- confidence/evidence quality
- urgency
- operational criticality
- effort to investigate
- reversibility/risk of proposed action

Priority is an operational queue, not a claim that one opportunity is a confirmed fault.

## Financial state model

OBSERVED
-> ESTIMATED
-> POTENTIAL
-> EXPECTED
-> VERIFIED

VERIFIED requires documented intervention and valid measurement-and-verification evidence.

## Lineage

Every financial output must be traceable to:
- source measurements
- production context
- operating context
- tariff inputs
- reference
- formula
- assumptions
- uncertainty
- calculation version
- timestamp

## Safety and trust

- Never treat missing data as zero.
- Never treat a first observation period as healthy by default.
- Never infer a physical fault from an economic anomaly alone.
- Never label potential savings as verified savings.
- Never allow poor data quality to silently flow into financial claims.
- Physical inspection and intervention remain subject to qualified personnel and site procedures.
