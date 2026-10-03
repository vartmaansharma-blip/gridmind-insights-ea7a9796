# GridMind Release Gate

GridMind is an industrial intelligence product. A green deployment is not established by a successful UI preview alone.

## Required checks

Every change intended for `main` must pass:

1. TypeScript typecheck
2. ESLint
3. Production build
4. Critical-path verification appropriate to the change
5. Data, financial, diagnostic, and security checks when the change touches those areas

The repository CI currently enforces the first three automatically.

## Evidence rules

- Synthetic/demo data must remain explicitly synthetic.
- Missing data is not zero.
- An observation is not a diagnosis.
- An estimate is not verified savings.
- A hypothesis is not a fact.
- Financial outputs must retain their calculation lineage and assumptions.
- Analysis should fail closed when required evidence is missing or invalid.

## Development flow

`feature/*` → `develop` → `main`

Use focused commits that describe the actual change. Do not mark a roadmap or specification as an implementation unless production code was changed and verified.

## Before release

Confirm:

- build is green
- typecheck is green
- lint is green
- changed routes work
- loading/empty/error states work
- mobile layout is checked for affected screens
- no synthetic result is presented as observed or verified
- no unsupported machine-failure or savings claim has been introduced

For consequential industrial workflows, correctness and evidence take priority over visual completeness.
