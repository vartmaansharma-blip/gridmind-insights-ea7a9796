# GridMind Diagnostic Engine

The executable layer converts a machine diagnostic hypothesis into a deterministic, auditable evaluation.

Flow:

Evidence Contract -> deterministic calculation -> deviation -> economic exposure -> investigation state

The engine fails closed when:
- the diagnostic is unknown;
- required measurements are missing or invalid;
- sample coverage is insufficient;
- an approved reference is unavailable;
- a deterministic calculation has not yet been implemented.

Economic exposure is not verified savings.

The intended economic truth progression is:

Exposure -> Potential -> Expected -> Realized -> Verified -> Sustained

Currently executable:
- energy intensity / energy per unit
- idle or unloaded energy
- cycle-time drift

Other registered diagnostic keys deliberately return an explicit unimplemented state rather than producing unsupported conclusions.

Next layer:
1. time-series aggregation and regime conditioning;
2. remaining deterministic diagnostic primitives;
3. Opportunity object integration;
4. reference, tariff, model and data lineage;
5. replay tests with synthetic factory scenarios;
6. real-factory validation before any diagnostic is promoted from candidate to validated.
