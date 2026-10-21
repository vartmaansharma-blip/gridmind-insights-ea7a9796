import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { SampleRecordDetail, RecordLink } from "./record-detail";
import { sampleRecordIndex, searchSampleRecords, rememberRecord } from "@/lib/sample/record-search";
import { sampleSections } from "@/lib/sample/navigation";
import type { SampleWorkspace } from "@/lib/sample/workspace";

export function SampleRecordBrowser({ s, recordId }: { s: SampleWorkspace; recordId?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [scope, setScope] = useState("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [inspect, setInspect] = useState<string>();
  const trigger = useRef<HTMLButtonElement>(null);
  const index = sampleRecordIndex(s);
  const allowedKey = JSON.stringify(index.map((r) => r.id));
  useEffect(() => {
    const allowed = new Set<string>(JSON.parse(allowedKey));
    setRecent((old) =>
      recordId ? rememberRecord(old, recordId, allowed) : old.filter((id) => allowed.has(id)),
    );
    setFavorites((old) => old.filter((id) => allowed.has(id)));
  }, [recordId, allowedKey]);
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k" &&
        !target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')
      ) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, []);
  const selected = index.find((r) => r.id === inspect);
  const investigation = s.cases.find((c) => c.id === inspect);
  const matches = searchSampleRecords(s, query, kind).filter((r) =>
    scope === "favorites"
      ? favorites.includes(r.id)
      : scope === "recent"
        ? recent.includes(r.id)
        : true,
  );
  if (scope === "recent") matches.sort((a, b) => recent.indexOf(a.id) - recent.indexOf(b.id));
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button ref={trigger} variant="outline">
            <Search aria-hidden="true" />
            Find sample records
          </Button>
        </DialogTrigger>
        {!inspect && (
          <DialogContent
            className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"
            onCloseAutoFocus={(event) => {
              if (inspect) event.preventDefault();
            }}
          >
            <DialogTitle>Find sample records</DialogTitle>
            <DialogDescription>
              {s.profile.organization} · {s.profile.factory} · SYNTHETIC · revision{" "}
              {s.sourceRevision}. Search, inspect, or open a connected record. Favorites and recent
              records last only this sample session.
            </DialogDescription>
            <nav aria-label="Sample section shortcuts" className="flex flex-wrap gap-2 text-sm">
              {Object.entries(sampleSections)
                .filter(([key]) => !["orders", "materials"].includes(key))
                .map(([key, label]) => (
                  <Link
                    key={key}
                    to="/explore/$"
                    params={{ _splat: key }}
                    onClick={() => setOpen(false)}
                    className="rounded border px-3 py-2 underline"
                  >
                    {label}
                  </Link>
                ))}
            </nav>
            <Input
              aria-label="Search sample records"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, record ID, or type"
              maxLength={120}
            />
            <div className="flex flex-wrap gap-3 text-sm">
              <label>
                Record type{" "}
                <select
                  aria-label="Record type"
                  className="min-h-11 rounded border bg-background p-2"
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                >
                  <option value="all">All types</option>
                  {[...new Set(index.map((r) => r.kind))].sort().map((k) => (
                    <option key={k} value={k}>
                      {k.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Show{" "}
                <select
                  aria-label="Show"
                  className="min-h-11 rounded border bg-background p-2"
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                >
                  <option value="all">All records</option>
                  <option value="favorites">Favorites</option>
                  <option value="recent">Recently opened</option>
                </select>
              </label>
            </div>
            <p role="status" className="text-sm text-muted-foreground">
              {matches.length} matching sample records
            </p>
            {matches.length === 0 && (
              <p>No matching records. Clear the search or choose All records / All types.</p>
            )}
            <ul className="max-h-[45dvh] space-y-2 overflow-y-auto">
              {matches.map((r) => (
                <li key={r.id} className="rounded border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to="/explore/$"
                      params={{ _splat: r.path }}
                      onClick={() => setOpen(false)}
                      className="min-h-11 min-w-0 break-words font-semibold underline underline-offset-4"
                    >
                      {r.label}
                      <span className="block text-xs font-normal">
                        {r.id} · {r.kind.replaceAll("_", " ")}
                      </span>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 shrink-0"
                      aria-label={`Favorite ${r.label}`}
                      aria-pressed={favorites.includes(r.id)}
                      onClick={() =>
                        setFavorites((old) =>
                          old.includes(r.id) ? old.filter((id) => id !== r.id) : [...old, r.id],
                        )
                      }
                    >
                      <Star
                        aria-hidden="true"
                        fill={favorites.includes(r.id) ? "currentColor" : "none"}
                      />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-2 min-h-11"
                    onClick={() => {
                      setOpen(false);
                      setInspect(r.id);
                    }}
                  >
                    Inspect {r.label}
                  </Button>
                </li>
              ))}
            </ul>
          </DialogContent>
        )}
      </Dialog>
      <Sheet
        open={Boolean(inspect)}
        onOpenChange={(value) => {
          if (!value) setInspect(undefined);
        }}
      >
        <SheetContent
          className="w-full overflow-y-auto sm:max-w-xl"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) setInspect(undefined);
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus();
          }}
        >
          <SheetTitle>{selected?.label ?? "Record unavailable"}</SheetTitle>
          <SheetDescription className="mb-4">
            {s.profile.organization} · {s.profile.factory} · SYNTHETIC · revision {s.sourceRevision}
            . Read-only inspection; open the record for its workflow.
          </SheetDescription>
          {selected ? (
            <>
              <Link
                to="/explore/$"
                params={{ _splat: selected.path }}
                onClick={() => setInspect(undefined)}
                className="mb-4 inline-block min-h-11 underline"
              >
                Open full record
              </Link>
              {investigation ? (
                <section className="space-y-3">
                  <p>Investigation: {investigation.title}</p>
                  <p>
                    Review required. Sources and evaluations are available in the full
                    investigation.
                  </p>
                  <RecordLink s={s} id={investigation.subjectId} />
                </section>
              ) : (
                <SampleRecordDetail s={s} id={selected.id} />
              )}
            </>
          ) : (
            <p>
              This record no longer exists in the current sample. Close this panel and search again.
            </p>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
