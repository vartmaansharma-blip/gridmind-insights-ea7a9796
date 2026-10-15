# Support and ownership

GridMind is currently maintained by [@vartmaansharma-blip](https://github.com/vartmaansharma-blip). There is no published support SLA or generally available production release.

- **Bugs:** use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md), with the exact commit, safe reproduction, expected behavior, and impact.
- **Work requests:** use the [work-item template](.github/ISSUE_TEMPLATE/work_item.md). Connect the request to the existing Master Plan and acceptance evidence; do not create another strategy or discovery tracker.
- **Security:** follow [SECURITY.md](SECURITY.md); exclude secrets and customer records from reports.
- **Development:** follow [CONTRIBUTING.md](CONTRIBUTING.md) and the [README setup](README.md#local-development).
- **Current decisions:** the [documentation index](docs/README.md) maps canonical authorities and historical material.

Lovable owns product design and visual implementation. Codex handles backend behavior, data contracts, validation, security, and repository operations. Cross-boundary work should define the data contract and required UI behavior first; avoid simultaneous edits to the same files. Source remains plain, editable code in the existing stack.

`CODEOWNERS` records routing and responsibility, not proof of independent review or enforced branch protection. A second qualified reviewer is still required for security-sensitive release decisions.
