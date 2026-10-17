# Code-quality correction: intervention date integrity

**Date:** 2026-10-10  
**Status:** focused correction proposed in pull request; CI must decide merge readiness.

## Finding

The authenticated factory snapshot adapter previously assigned the current calendar month to every intervention whose status was `implemented`. The database/domain contract used by this adapter does not provide an implementation timestamp. Consequently, the UI could represent an old intervention as if it had been implemented this month.

That is fabricated operational history. It can distort intervention timelines and any analysis that depends on implementation timing.

## Correction

The proposed code change stops manufacturing an implementation month when the canonical source does not contain one. Under the existing legacy `Intervention` contract, records without an implementation month are currently filtered from the timeline projection. This is intentionally conservative about historical claims, but it is a temporary product limitation: an implemented intervention may not appear in that legacy projection.

## Required durable fix

1. Add a nullable, explicitly named implementation timestamp to the canonical intervention schema (for example, `implemented_at`), with a migration and generated database types.
2. Define who is authorized to set or correct the timestamp and preserve an audit trail.
3. Populate the application contract from that persisted timestamp; never infer it from status, creation time, or the current date.
4. Add tests for known dates, null dates, timezone boundaries, and status/date disagreement.
5. Ensure outcome verification uses a documented measurement window and does not treat intervention status as proof of realized savings.

## Verification status

This change was committed to a dedicated branch for pull-request review. It has not been locally executed or independently verified in this record. Do not merge until CI passes and the reviewer confirms that the conservative omission is acceptable for the current UI.
