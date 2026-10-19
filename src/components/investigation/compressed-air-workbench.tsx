import { useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { RecordForm } from "./record-form";
import { textField } from "./fields";
import { authenticatedAirCommand } from "@/lib/compressed-air/connected-client";
import { airStoredSchema, type AirCommand, type AirStored } from "@/lib/compressed-air/connected";
import fixture from "../../../data/compressed-air/synthetic.csv?raw";
import { analyzeCompressedAir } from "@/lib/compressed-air/investigation";

const scopeSchema = z.object({ assets: z.array(z.object({ id: z.number(), name: z.string() })) });
const messages: Record<string, string> = {
  COMPRESSED_AIR_DISABLED:
    "Compressed-air storage is available only in the enabled disposable test environment.",
  STALE_CASE_REVISION:
    "A newer revision exists. Reload the evidence before submitting this change.",
  AIR_STALE_REVIEW: "The source changed. Review the current imported dataset before continuing.",
  AIR_INVALID_CSV:
    "Import rejected. Use the exact header, canonical units, explicit timezones and non-overlapping intervals shown in the synthetic example.",
  CASE_ACCESS_DENIED:
    "Your current case permission does not allow this operation. Ask the case manager to check the assignment.",
  INDEPENDENT_REVIEWER_REQUIRED:
    "An active assigned reviewer, different from the importer, must record this review.",
  AIR_APPROVAL_REQUIRED: "Record the simulated customer approval before completion.",
  AIR_REVISION_MISSING:
    "That revision does not exist. Choose a revision between 1 and the current head.",
  CONNECTION_INTERRUPTED:
    "The connection was interrupted. Your entries are preserved here; retry the same request to recover its receipt.",
  INVALID_CASE_CONTRACT:
    "Check the required fields, source line numbers and input limits before submitting.",
};

/** Internal functional adapter only; shares the selected case and its access controls. */
export function CompressedAirWorkbench({ caseId }: { caseId: string }) {
  const [stored, setStored] = useState<AirStored | null>(null);
  const [assets, setAssets] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const retry = useRef<AirCommand | null>(null);
  const run = async (cmd: AirCommand) => {
    retry.current = cmd;
    const raw = await authenticatedAirCommand(cmd);
    if (cmd.action === "scope") setAssets(scopeSchema.parse(raw).assets);
    else {
      const result = airStoredSchema.parse(raw);
      setStored(result);
      if (cmd.action === "export") {
        const report = z.object({ report: z.record(z.unknown()) }).parse(raw).report;
        const url = URL.createObjectURL(
          new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = `${caseId}-air-v${result.revision}-${crypto.randomUUID()}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    }
    retry.current = null;
  };
  const safe = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      setError("");
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      setError(messages[code] ?? (code || "Compressed-air operation failed"));
    } finally {
      setBusy(false);
    }
  };
  const common = () => ({
    caseId,
    expectedRevision: stored?.revision ?? 0,
    requestKey: crypto.randomUUID(),
  });
  const snapshot = stored?.snapshot;
  const analysis = useMemo(
    () => (snapshot ? analyzeCompressedAir(snapshot.dataset) : null),
    [snapshot],
  );
  const current = stored && stored.revision === stored.headRevision;
  const editor = current && stored.role !== "reviewer";
  return (
    <section className="panel grid gap-4 p-5">
      <fieldset disabled={busy} className="grid min-w-0 gap-4">
        <h2 className="text-lg font-semibold">Compressed-air evidence attachment</h2>
        <p className="text-sm">
          Isolated synthetic experiment. Reviews and customer approvals are simulated. Method
          qualification is pending. Outcomes remain inconclusive; no savings or fault diagnosis.
        </p>
        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              void safe(async () => {
                await run({ action: "scope", caseId });
                await run({ action: "load", caseId });
              })
            }
          >
            Load compressed-air evidence
          </Button>
          {retry.current && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void safe(() => run(retry.current!))}
            >
              Retry compressed-air request
            </Button>
          )}
        </div>
        {stored && (
          <>
            <p>
              Revision {stored.revision} / {stored.headRevision} · {stored.role}
            </p>
            {editor && (
              <RecordForm
                key={`import-${stored.revision}`}
                value={{
                  assetId: String(assets[0]?.id ?? ""),
                  sourceName: "synthetic.csv",
                  csv: fixture,
                }}
                fields={[
                  {
                    key: "assetId",
                    label: "Authorized asset",
                    options: assets.map((a) => String(a.id)),
                  },
                  textField("sourceName", "Synthetic source name"),
                  textField("csv", "Synthetic CSV only", "multiline"),
                ]}
                label="Append synthetic import"
                onSave={(v) =>
                  safe(() =>
                    run({
                      action: "import",
                      ...common(),
                      assetId: Number(v.assetId),
                      sourceName: String(v.sourceName),
                      csv: String(v.csv),
                    }),
                  )
                }
              />
            )}
            <p className="text-sm">{assets.map((a) => `${a.id}: ${a.name}`).join(" · ")}</p>
            {snapshot && (
              <>
                {analysis && (
                  <div className="grid gap-2 text-sm">
                    <h3 className="font-semibold">Observed interval comparisons</h3>
                    {analysis.comparisons.map((c) => (
                      <p key={c.ref.line}>
                        Source line {c.ref.line}: {c.state.replaceAll("_", " ")} · baseline lines{" "}
                        {c.baselineLines.join(", ") || "unmatched"}.
                        {c.residualKw &&
                          ` Residual power range: ${c.residualKw.map((v) => v.toFixed(2)).join(" to ")} kW.`}
                      </p>
                    ))}
                    <h3 className="font-semibold">Unverified hypotheses</h3>
                    {analysis.hypotheses.length ? (
                      analysis.hypotheses.map((h) => (
                        <p key={h.statement}>
                          {h.statement}. {h.nextCheck}.
                        </p>
                      ))
                    ) : (
                      <p>
                        No resolved excess; absence of a resolved difference does not prove
                        efficient operation.
                      </p>
                    )}
                    <p>
                      Canonical units: kW, m³/min, bar. Pressure reference and flow reference
                      conditions have not been professionally validated. Thresholds and declared
                      uncertainties are demonstration assumptions.
                    </p>
                    <p>{analysis.limitations.join(". ")}</p>
                    {snapshot.review && (
                      <p>
                        Simulated finding review: {snapshot.review.rationale} ·{" "}
                        {snapshot.review.confounders}
                      </p>
                    )}
                  </div>
                )}
                <p className="break-all text-sm">
                  Source SHA-256: {snapshot.dataset.sourceSha256}
                  <br />
                  Dataset hash: {snapshot.datasetHash}
                  <br />
                  {snapshot.dataset.samples.length} intervals · review:{" "}
                  {snapshot.review?.decision ?? "unreviewed"}
                </p>
                {current && (
                  <RecordForm
                    key={`review-${stored.revision}`}
                    value={{
                      decision: "revise",
                      competence: "",
                      rationale: "",
                      confounders: "",
                      statement: "",
                      sourceLines: "",
                      uncertainty: "",
                    }}
                    fields={[
                      {
                        key: "decision",
                        label: "Simulated review decision",
                        options: ["revise", "reject", "accept"],
                      },
                      textField("competence", "Competence and review scope", "multiline"),
                      textField("rationale", "Review rationale", "multiline"),
                      textField("confounders", "Confounders and limitations", "multiline"),
                      textField("statement", "Finding statement", "multiline"),
                      textField("sourceLines", "Physical source lines (comma separated)"),
                      textField("uncertainty", "Finding uncertainty", "multiline"),
                    ]}
                    label="Append independent simulated review"
                    onSave={(v) =>
                      safe(() =>
                        run({
                          action: "review",
                          ...common(),
                          datasetHash: snapshot.datasetHash,
                          decision: v.decision as "accept" | "revise" | "reject",
                          competence: String(v.competence),
                          rationale: String(v.rationale),
                          confounders: String(v.confounders),
                          findings: [
                            {
                              statement: String(v.statement),
                              sourceLines: String(v.sourceLines).split(",").map(Number),
                              uncertainty: String(v.uncertainty),
                            },
                          ],
                        }),
                      )
                    }
                  />
                )}
                {editor && snapshot.review?.decision === "accept" && (
                  <RecordForm
                    value={{ owner: "", description: "" }}
                    fields={[
                      textField("owner", "Action owner"),
                      textField("description", "Proposed action", "multiline"),
                    ]}
                    label="Propose simulated action"
                    onSave={(v) =>
                      safe(() =>
                        run({
                          action: "propose",
                          ...common(),
                          datasetHash: snapshot.datasetHash,
                          id: crypto.randomUUID(),
                          owner: String(v.owner),
                          description: String(v.description),
                        }),
                      )
                    }
                  />
                )}
                {snapshot.actions.map((a) => (
                  <div key={a.id} className="grid gap-2">
                    <p>
                      {a.description} · {a.owner} · {a.status}
                    </p>
                    {editor && a.status === "proposed" && stored.role === "manager" && (
                      <RecordForm
                        value={{ customerApproval: "" }}
                        fields={[
                          textField(
                            "customerApproval",
                            "Simulated customer authorization reference",
                            "multiline",
                          ),
                        ]}
                        label="Record simulated approval"
                        onSave={(v) =>
                          safe(() =>
                            run({
                              action: "approve",
                              ...common(),
                              datasetHash: snapshot.datasetHash,
                              id: a.id,
                              customerApproval: String(v.customerApproval),
                            }),
                          )
                        }
                      />
                    )}
                    {editor && a.status === "approved" && (
                      <RecordForm
                        value={{ completionEvidence: "" }}
                        fields={[
                          textField(
                            "completionEvidence",
                            "Completion evidence reference",
                            "multiline",
                          ),
                        ]}
                        label="Record simulated completion"
                        onSave={(v) =>
                          safe(() =>
                            run({
                              action: "complete",
                              ...common(),
                              datasetHash: snapshot.datasetHash,
                              id: a.id,
                              completionEvidence: String(v.completionEvidence),
                            }),
                          )
                        }
                      />
                    )}
                  </div>
                ))}
                {editor && snapshot.actions.some((a) => a.status === "completed") && (
                  <RecordForm
                    value={{ confounders: "", rationale: "" }}
                    fields={[
                      textField(
                        "confounders",
                        "Outcome confounders and measurement limitations",
                        "multiline",
                      ),
                      textField("rationale", "Verification assessment basis", "multiline"),
                    ]}
                    label="Record descriptive outcome verification"
                    onSave={(v) =>
                      safe(() =>
                        run({
                          action: "verifyOutcome",
                          ...common(),
                          datasetHash: snapshot.datasetHash,
                          confounders: String(v.confounders),
                          rationale: String(v.rationale),
                        }),
                      )
                    }
                  />
                )}
                {snapshot.verification && (
                  <p>
                    Outcome: {snapshot.verification.outcome} ·{" "}
                    {snapshot.verification.descriptiveEvidence.replaceAll("_", " ")}. No causal or
                    financial conclusion.
                  </p>
                )}
                {current && (
                  <Button
                    disabled={busy}
                    variant="outline"
                    onClick={() => void safe(() => run({ action: "export", ...common() }))}
                  >
                    Export source-bound report and custody receipt
                  </Button>
                )}
              </>
            )}
            <RecordForm
              value={{ revision: stored.headRevision }}
              fields={[textField("revision", "Historical revision", "number")]}
              label="Load immutable revision"
              onSave={(v) =>
                safe(() => run({ action: "load", caseId, revision: Number(v.revision) }))
              }
            />
          </>
        )}
      </fieldset>
    </section>
  );
}
