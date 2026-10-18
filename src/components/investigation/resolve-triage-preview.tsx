import { useState } from "react";
import {
  evaluateSyntheticResolveCase,
  fictionalResolutionScenario,
} from "@/lib/gridmind/resolve-workflow";
import {
  assessSyntheticException,
  RESOLVE_LANES,
  SYNTHETIC_EXCEPTION_EXAMPLES,
  type ResolveLane,
} from "@/lib/gridmind/resolve-intake";

const lanes: ResolveLane[] = ["R1", "R2", "R3"];

/** Fictional, read-only idea comparison. NOT a real customer-data intake form. */
export function ResolveTriagePreview() {
  const [lane, setLane] = useState<ResolveLane>("R1");
  const assessment = assessSyntheticException(SYNTHETIC_EXCEPTION_EXAMPLES[lane]);
  const process = evaluateSyntheticResolveCase(fictionalResolutionScenario(lane));
  return (
    <section
      aria-label="GridMind Resolve — synthetic commercial discovery preview"
      className="mb-8 rounded-xl border bg-card p-5 shadow-sm"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        GridMind 3.1 · Internal synthetic preview
      </p>
      <h2 className="mt-2 text-2xl font-semibold">Three fictional problems to compare.</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        These are fictional commercial discovery scenarios, not completed investigations, verified
        causes, customer records, approved recommendations, or live services. The existing synthetic
        workbench below supports C1/C4 exercises only. No commercial wedge is validated.
      </p>
      <div
        role="group"
        aria-label="Synthetic discovery scenario"
        className="mt-5 flex flex-wrap gap-2"
      >
        {lanes.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setLane(id)}
            aria-pressed={id === lane}
            className="rounded-md border px-3 py-2 text-sm font-medium transition-colors"
            style={
              id === lane
                ? { background: "var(--gm-brand-green, #9add00)", color: "#08100b" }
                : undefined
            }
          >
            {id} · {RESOLVE_LANES[id].title}
          </button>
        ))}
      </div>
      <div className="mt-5 grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3 rounded-lg border p-4">
          <p>
            <strong>Fictional problem:</strong> {assessment.recordedQuestion}
          </p>
          <p>
            <strong>Existing alternative:</strong> {assessment.currentAlternative}
          </p>
          <p>
            <strong>Decision owner:</strong> {assessment.decisionOwnerRole}
          </p>
          <p>
            <strong>Unverified consequence:</strong> {assessment.unverifiedConsequence}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">What is missing before a real service?</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
            {assessment.nextQuestions.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
          <div className="mt-5 border-t pt-4">
            <h4 className="font-semibold">Synthetic resolution lifecycle check</h4>
            <p className="mt-2 text-muted-foreground">
              Step: {process.stage.replaceAll("_", " ")}. {process.reasons.join(" ")}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Any simulated review is fictional. No live source approval, qualified technical
              signoff, real customer decision, or verified savings exists.
            </p>
          </div>
          <p className="mt-4 font-medium">
            Status: Fictional discovery only · never approved for customer delivery.
          </p>
        </div>
      </div>
    </section>
  );
}
