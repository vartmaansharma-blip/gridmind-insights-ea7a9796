import type { CoreInput, Verdict } from "./model";

// Owner objectives are advisory unless the owner explicitly confirms them.
// They do not change hard technical, legal, quality or safety constraints.
export const INTENT_POLICY_VERSION = "gm-owner-intent/v1";

export type ActionAssessment = { actionId: string; status: Verdict };
export function assessOwnerIntents(
  input: CoreInput,
  alternatives: readonly ActionAssessment[],
  at: string,
) {
  const intents = input.ownerIntents ?? [];
  const choices = new Map(alternatives.map((a) => [a.actionId, a.status]));
  const evidenceIsCurrent = (ids: string[]) =>
    ids.length > 0 &&
    ids.every((id) => {
      const item = input.evidence.find((e) => e.id === id);
      return (
        item?.verification === "verified" &&
        Date.parse(item.observedAt) <= Date.parse(at) &&
        Date.parse(item.expiresAt) > Date.parse(at)
      );
    });
  const summaries = intents.map((intent) => {
    let state: "active" | "needs_confirmation" | "stale" | "rejected";
    if (intent.status === "rejected") state = "rejected";
    else if (
      Date.parse(at) < Date.parse(intent.effectiveFrom) ||
      Date.parse(at) >= Date.parse(intent.expiresAt) ||
      !evidenceIsCurrent(intent.evidenceIds)
    )
      state = "stale";
    else if (
      intent.status !== "confirmed" ||
      intent.source !== "owner_stated" ||
      !intent.confirmedBy
    )
      state = "needs_confirmation";
    else state = "active";
    return {
      intentId: intent.id,
      goal: intent.goal,
      statement: intent.statement,
      source: intent.source,
      state,
      preference: intent.preference,
      relatedActionIds: intent.relatedActionIds,
      counterpartyId: intent.counterpartyId,
      evidenceIds: intent.evidenceIds,
    };
  });
  const conflicts: {
    intentId: string;
    actionId: string | null;
    reason:
      | "OWNER_AVOIDED_ELIGIBLE_ACTION"
      | "OWNER_FAVORED_ACTION_NOT_ELIGIBLE"
      | "OWNER_OBJECTIVE_NOT_MAPPED";
  }[] = [];
  for (const summary of summaries) {
    if (summary.state !== "active") continue;
    if (!summary.relatedActionIds.length) {
      conflicts.push({
        intentId: summary.intentId,
        actionId: null,
        reason: "OWNER_OBJECTIVE_NOT_MAPPED",
      });
      continue;
    }
    for (const actionId of summary.relatedActionIds) {
      const status = choices.get(actionId);
      if (summary.preference === "avoid" && (status === "eligible" || status === "conditional"))
        conflicts.push({ intentId: summary.intentId, actionId, reason: "OWNER_AVOIDED_ELIGIBLE_ACTION" });
      if (summary.preference === "favor" && status !== "eligible")
        conflicts.push({ intentId: summary.intentId, actionId, reason: "OWNER_FAVORED_ACTION_NOT_ELIGIBLE" });
    }
  }
  return {
    policyVersion: INTENT_POLICY_VERSION,
    summaries,
    conflicts,
    inferredGoalsRequireConfirmation: summaries
      .filter((s) => s.source === "inferred" && s.state !== "rejected")
      .map((s) => s.intentId),
    // Relationship goals not mapped to an eligible action remain a planning question, not a hidden optimizer weight.
    selectedObjectiveWeights: null,
    autonomousPreferenceOverride: false,
  } as const;
}
