import { Link } from "@tanstack/react-router";
import { type SampleWorkspace } from "@/lib/sample/workspace";
import { recordPath } from "@/lib/sample/record-navigation";
export function RecordLink({ s, id }: { s: SampleWorkspace; id: string }) {
  const label =
    s.core.entities.find((e) => e.id === id)?.label ??
    s.cases.find((c) => c.id === id)?.title ??
    id;
  return (
    <Link
      to="/explore/$"
      params={{ _splat: recordPath(s, id) }}
      className="underline underline-offset-4 hover:text-success"
    >
      {label} <span className="num text-xs">({id})</span>
    </Link>
  );
}
export function EvidenceCard({ s, id }: { s: SampleWorkspace; id: string }) {
  const e = s.core.evidence.find((e) => e.id === id);
  if (!e) return <p>Evidence {id} is unavailable; no conclusion should rely on it.</p>;
  return (
    <article className="min-w-0 rounded border p-3 text-sm">
      <h4 className="font-semibold">{e.title}</h4>
      <p className="num text-xs">{e.id} · SYNTHETIC</p>
      <p className="mt-2 break-words">Source: {e.source}</p>
      <p>Observed/replay timestamp: {e.observedAt}</p>
      <p>Valid until: {e.expiresAt}</p>
      <p>
        Review: {e.verification} within the fictional fixture only; no professional attestation.
      </p>
      <details>
        <summary className="cursor-pointer">Content integrity and assumptions</summary>
        <p className="num break-all text-xs">SHA-256: {e.digest}</p>
        <p>
          Hashes identify supplied content; they do not prove authenticity. Sample cycle/setup
          values are engineering demonstration parameters, not observed plant measurements.
        </p>
      </details>
    </article>
  );
}
export function SampleRecordDetail({ s, id }: { s: SampleWorkspace; id: string }) {
  const e = s.core.entities.find((e) => e.id === id);
  if (!e) {
    const c = s.cases.find((c) => c.id === id);
    return c ? null : (
      <section role="status" className="panel p-4">
        <h2 className="text-xl font-semibold">Record not available in this sample session</h2>
        <p>Newly created records reset on refresh. No substitute or real record was loaded.</p>
        <Link to="/explore" className="underline">
          Return to the sample overview
        </Link>
      </section>
    );
  }
  const forward = Object.entries(e.attributes)
    .filter(([k]) => k.endsWith("Id") || k.endsWith("Ids"))
    .flatMap(([, v]) => (Array.isArray(v) ? v : [v]))
    .filter((v) => typeof v === "string" && s.core.entities.some((e) => e.id === v)) as string[];
  const reverse = s.core.entities
    .filter(
      (r) =>
        r.id !== id &&
        Object.values(r.attributes).some((v) => v === id || (Array.isArray(v) && v.includes(id))),
    )
    .map((r) => r.id);
  const graph = s.core.relationships
    .filter((r) => r.from === id || r.to === id)
    .flatMap((r) => [r.from, r.to])
    .filter((v) => v !== id);
  const cases = s.cases
    .filter((c) => c.subjectId === id || c.orderIds.includes(id))
    .map((c) => c.id);
  return (
    <section
      aria-label={`Record ${id}`}
      className="panel min-w-0 space-y-4 border-l-4 border-l-cta p-4"
    >
      <p className="eyebrow">
        Sample organization / {s.profile.factory} / {e.kind.replaceAll("_", " ")}
      </p>
      <h2 className="text-2xl font-semibold">{e.label}</h2>
      <p className="num text-xs">
        Record {e.id} · input revision {s.sourceRevision} · SYNTHETIC
      </p>
      <p className="text-sm">
        Inspect the exact relationships and source below. Next step: open a related order, machine
        or investigation to follow the same fictional records.
      </p>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        {Object.entries(e.attributes).map(([key, value]) => (
          <div key={key} className="min-w-0">
            <dt className="text-muted-foreground">{key}</dt>
            <dd className="num break-words">{JSON.stringify(value)}</dd>
          </div>
        ))}
      </dl>
      <nav aria-label="Related sample records">
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {[...new Set([...forward, ...reverse, ...graph, ...cases])].map((key) => (
            <li key={key}>
              <RecordLink s={s} id={key} />
            </li>
          ))}
        </ul>
      </nav>
      <div className="grid gap-3 lg:grid-cols-2">
        {e.evidenceIds.map((id) => (
          <EvidenceCard key={id} s={s} id={id} />
        ))}
      </div>
    </section>
  );
}
