import { useState } from "react";
import { Button } from "@/components/ui/button";
import { previewSyntheticMachineCsv, SYNTHETIC_EXAMPLE_CSV, type FormatPreview } from "@/lib/gridmind/synthetic-machine-csv";

/**
 * Read-only local illustration of the future canonical ingestion contract.
 * Never transmits a pasted value or updates the connected factory database.
 */
export function SyntheticEvidenceFormatPreview() {
  const [text, setText] = useState(SYNTHETIC_EXAMPLE_CSV);
  const [preview, setPreview] = useState<FormatPreview | null>(null);

  return (
    <section className="panel p-5 lg:col-span-2" aria-labelledby="synthetic-format-preview">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="synthetic-format-preview" className="font-semibold">Measurement format sandbox</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Try the format of an equipment energy-and-output record using <strong>fictional data only</strong>.
            This local browser preview checks dates, sources, units and duplicated periods. It never saves,
            uploads, or adds observations to the selected machine.
          </p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">Synthetic only · Not connected</span>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Required columns: period_start, period_end, energy_kwh, output_units, operating_hours,
        operating_state, product_code, source_reference. Start/end timestamps require explicit offsets.
        The sample is invented and not a calibration or sensor record. Do not paste confidential factory data.
      </p>
      <label htmlFor="machine-format-csv" className="mt-4 block text-sm font-semibold">
        Fictional measurement periods (CSV)
      </label>
      <textarea
        id="machine-format-csv"
        rows={7}
        spellCheck={false}
        value={text}
        maxLength={16384}
        onChange={(event) => { setText(event.currentTarget.value); setPreview(null); }}
        className="mt-2 w-full resize-y rounded-md border border-border bg-card p-3 font-mono text-xs leading-6 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
      />
      <div className="mt-3 flex flex-wrap gap-3">
        <Button size="sm" type="button" onClick={() => setPreview(previewSyntheticMachineCsv(text))}>
          Check synthetic format
        </Button>
        <Button size="sm" type="button" variant="outline" onClick={() => { setText(SYNTHETIC_EXAMPLE_CSV); setPreview(null); }}>
          Restore example
        </Button>
        <Button size="sm" type="button" variant="outline" onClick={() => { setText(""); setPreview(null); }}>
          Clear local text
        </Button>
      </div>
      {preview && (
        <div className="mt-5 rounded-lg border border-border p-4 text-sm" role="status" aria-live="polite">
          <p className="font-semibold">
            {preview.status === "format_valid_synthetic"
              ? "Fictional input format accepted for review"
              : preview.status === "coverage_insufficient"
                ? "Not enough comparison-ready periods"
                : "Format requires corrections"}
          </p>
          <p className="mt-2 text-muted-foreground">
            {preview.candidatePeriods} source periods · {preview.comparableNumericPeriods} nonzero numeric candidates ·
            {preview.distinctSources} distinct declared source references · {preview.issues.length} format errors.
          </p>
          {preview.issues.length > 0 && (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {preview.issues.slice(0, 12).map((x, i) => (
                <li key={i}>{x.row ? `CSV row ${x.row}: ` : ""}{x.message}</li>
              ))}
            </ul>
          )}
          {preview.notes.length > 0 && (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-xs text-muted-foreground">
              {preview.notes.map((note, i) => <li key={i}>{note}</li>)}
            </ul>
          )}
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            This only checks a fictional input format. No real source is verified, no baseline
            comparability is established, and no fault diagnosis, upload, professional review or savings
            result has occurred. Authoritative production ingestion requires a separately approved
            tenant-isolated server workflow.
          </p>
        </div>
      )}
    </section>
  );
}
