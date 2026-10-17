# Security policy

## Supported scope

The current `main` branch is the maintained development version. GridMind is a public, pre-pilot repository; no production-security certification or response-time guarantee is claimed. The [technical release gate](docs/release-gate.md) and [issue #29](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/29) control customer-data readiness.

## Reporting a concern

Use **Report a vulnerability** from the repository's [Security page](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/security). GitHub private vulnerability reporting was enabled on 17 October 2026; the owner verified the setting, but an outside reporter's submission flow has not been exercised. Describe the affected commit, component, impact, and safe synthetic reproduction in the private report. Do not open a public issue or PR for a sensitive finding, and do not include credentials, personal data, factory records, or executable exploit payloads in any report.

The owner, [@vartmaansharma-blip](https://github.com/vartmaansharma-blip), coordinates triage, containment, review, and any necessary communication. Auth/RLS, tenant isolation, privileged functions, migrations, exports, and secrets require appropriate independent security review before release.

## Handling and verification

- Reproduce with synthetic data in an isolated environment; preserve the original evidence and exact commit.
- Never disable authentication, tenant isolation, RLS, or evidence checks to make validation pass.
- Never place a service-role/secret key in a browser, `VITE_*` variable, repository, log, issue, or preview artifact. Use publishable development credentials only where the client requires them.
- Treat a suspected credential exposure as an owner-coordinated incident: revoke/rotate the affected credential through its service, assess access, and preserve evidence. Deleting the file alone is not remediation. Do not rewrite published Lovable history as an ad hoc cleanup.
- Keep dependency updates reviewable. Run `bun audit`, frozen installation, core checks, and relevant backend acceptance before merging; audit success is not proof of general application security.
- Production schema/settings changes, deployment, and customer-data handling retain their explicit authorization and recovery requirements. A repository merge does not establish production readiness.
