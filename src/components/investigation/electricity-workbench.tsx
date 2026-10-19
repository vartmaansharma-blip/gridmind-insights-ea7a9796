import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { DashboardFrame } from "@/components/gm/dashboard-frame";
import { STAFF_NAV } from "@/components/gm/dashboard-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { electricityCall, uploadBill, downloadBill } from "@/lib/electricity/client";
import {
  utilities,
  nextStatuses,
  type CaseRecord,
  type Detail,
  type Site,
  type Command,
} from "@/lib/electricity/contract";
export function ElectricityWorkbench({ caseId }: { caseId?: string }) {
  const [sites, setSites] = useState<Site[]>([]),
    [site, setSite] = useState("");
  const [cases, setCases] = useState<CaseRecord[]>([]),
    [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const createKey = useRef<string | null>(null),
    uploadKey = useRef<string | null>(null);
  const requestVersion = useRef(0);
  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    setDetail(null);
    if (caseId) {
      const result = await electricityCall<Detail>({ action: "load", caseId });
      if (version === requestVersion.current) setDetail(result);
    } else {
      const [options, rows] = await Promise.all([
        electricityCall<{ sites: Site[] }>({ action: "options" }),
        electricityCall<CaseRecord[]>({ action: "list" }),
      ]);
      if (version === requestVersion.current) {
        setSites(options.sites);
        setCases(rows);
      }
    }
  }, [caseId]);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        requestVersion.current++;
        setDetail(null);
        setCases([]);
        setSites([]);
        setError("Sign in to your team workspace first.");
      }
    });
    return () => {
      requestVersion.current++;
      data.subscription.unsubscribe();
    };
  }, []);
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    let active = true;
    setReady(false);
    setDetail(null);
    setError("");
    void refresh()
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [refresh]);
  const create = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget,
      fd = new FormData(form);
    createKey.current ??= crypto.randomUUID();
    void run(async () => {
      const c = await electricityCall<CaseRecord>({
        action: "create",
        id: createKey.current!,
        factoryId: Number(site),
        investigatorId: String(fd.get("investigator")),
        utility: String(fd.get("utility")) as (typeof utilities)[number],
        from: String(fd.get("from")),
        to: String(fd.get("to")),
        issue: String(fd.get("issue")),
      });
      createKey.current = null;
      window.location.assign(`/team/electricity?caseId=${c.id}`);
    });
  };
  return (
    <DashboardFrame
      links={STAFF_NAV}
      header={
        <div className="p-4 font-semibold">Electricity investigation · Internal workspace</div>
      }
    >
      <h1 className="text-3xl font-semibold">Electricity-cost investigations</h1>
      <p className="my-4 rounded-lg border p-4 text-sm">
        Synthetic acceptance only. No customer bills until release approval. Uploaded sources are
        unverified; qualified energy experts must assess the applicable supplier, period, category
        and contract. No tariff certification or promised savings.
      </p>
      {error && (
        <p role="alert" className="my-4 text-danger">
          {error}
        </p>
      )}
      <div className="mb-5 flex gap-3">
        <Button asChild variant="outline">
          <Link to="/auth" search={{ destination: "team" }}>
            Team sign in
          </Link>
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => void run(refresh)}>
          Reload records
        </Button>
        <Button asChild variant="outline">
          <Link to="/team/electricity">All electricity cases</Link>
        </Button>
      </div>
      {!ready && <p role="status">Loading private records…</p>}
      {ready && !caseId && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="panel p-5">
            <h2 className="mb-4 text-xl font-semibold">Open a case</h2>
            {sites.length === 0 ? (
              <p>
                No managed sites available. An active factory owner or admin creates cases and
                assigns a same-site investigator.
              </p>
            ) : (
              <form
                className="grid gap-4"
                onSubmit={create}
                onChange={() => {
                  createKey.current = null;
                }}
              >
                <label>
                  Organization / site
                  <select
                    aria-label="Organization / site"
                    className="mt-1 w-full rounded border bg-background p-2"
                    required
                    value={site}
                    onChange={(e) => {
                      setSite(e.target.value);
                      createKey.current = null;
                    }}
                  >
                    <option value="">Select a site</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.organization} / {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Investigator
                  <select
                    name="investigator"
                    aria-label="Investigator"
                    required
                    className="mt-1 w-full rounded border bg-background p-2"
                    key={site}
                  >
                    <option value="">Select an eligible member</option>
                    {sites
                      .find((s) => String(s.id) === site)
                      ?.investigators.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.role} · {i.id}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Utility on bill
                  <select
                    name="utility"
                    aria-label="Utility on bill"
                    defaultValue="Unknown"
                    className="mt-1 w-full rounded border bg-background p-2"
                  >
                    {utilities.map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Bill period start
                  <Input name="from" type="date" required />
                </label>
                <label>
                  Bill period end
                  <Input name="to" type="date" required />
                </label>
                <label>
                  Issue to investigate
                  <Textarea
                    name="issue"
                    required
                    minLength={10}
                    maxLength={4000}
                    placeholder="Describe the charge or billing question. Do not assume an error or savings."
                  />
                </label>
                <Button disabled={busy || !site}>Create electricity case</Button>
              </form>
            )}
          </section>
          <section className="panel p-5">
            <h2 className="mb-4 text-xl font-semibold">Your cases</h2>
            {cases.length === 0 && <p>No electricity cases available.</p>}
            {cases.map((c) => (
              <Link
                className="mb-3 block rounded border p-4"
                key={c.id}
                to="/team/electricity"
                search={{ caseId: c.id }}
              >
                <strong>{c.issue}</strong>
                <p>
                  {c.utility} · {c.bill_from} to {c.bill_to} · {c.status.replaceAll("_", " ")}
                </p>
              </Link>
            ))}
          </section>
        </div>
      )}
      {detail && (
        <div className="grid gap-6">
          <section className="panel p-5">
            <h2 className="text-xl font-semibold">
              {detail.organization} / {detail.site}
            </h2>
            <p className="my-3">{detail.case.issue}</p>
            <p>
              {detail.case.utility} · {detail.case.bill_from} to {detail.case.bill_to}
            </p>
            <p>Investigator: {detail.case.investigator_id}</p>
            <p data-testid="electricity-status">
              Status: {detail.case.status.replaceAll("_", " ")}
            </p>
            <p className="text-xs">
              Case {detail.case.id} · Revision {detail.case.revision}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {nextStatuses[detail.case.status]?.map((status) => (
                <Button
                  key={status}
                  disabled={busy}
                  variant="outline"
                  onClick={() =>
                    void run(async () => {
                      await electricityCall({
                        action: "status",
                        caseId: detail.case.id,
                        revision: detail.case.revision,
                        status,
                      } as Command);
                      await refresh();
                    })
                  }
                >
                  Move to {status.replaceAll("_", " ")}
                </Button>
              ))}
            </div>
          </section>
          <section className="panel p-5">
            <h2 className="mb-3 text-xl font-semibold">Private bill evidence</h2>
            <p className="mb-3 text-sm">
              PDF, PNG or JPEG, up to 10 MiB. Source authenticity and document safety are
              unverified. Download only trusted synthetic fixtures; uploads cannot be overwritten.
            </p>
            {detail.case.status !== "closed_inconclusive" && (
              <form
                className="grid gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!file) return;
                  uploadKey.current ??= crypto.randomUUID();
                  void run(async () => {
                    await uploadBill(detail.case.id, file, uploadKey.current!);
                    uploadKey.current = null;
                    setFile(null);
                    await refresh();
                  });
                }}
              >
                <label>
                  Synthetic electricity bill
                  <Input
                    type="file"
                    accept="application/pdf,image/png,image/jpeg"
                    onChange={(e) => {
                      setFile(e.target.files?.[0] ?? null);
                      uploadKey.current = null;
                    }}
                  />
                </label>
                <Button disabled={busy || !file}>Upload private bill</Button>
              </form>
            )}
            <ul className="mt-4 grid gap-3">
              {detail.evidence.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-3">
                  <span>
                    {e.filename} · {e.state} · Unverified
                  </span>
                  {e.state === "uploaded" ? (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => void run(() => downloadBill(e))}
                    >
                      Download {e.filename}
                    </Button>
                  ) : (
                    <span className="text-sm">
                      Upload incomplete; retry the selected file before leaving this page.
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
          <section className="panel p-5">
            <h2 className="mb-3 text-xl font-semibold">Audit history</h2>
            <ol>
              {detail.events.map((e) => (
                <li key={e.id} className="mb-2 text-sm">
                  {e.kind.replaceAll("_", " ")} · {e.created_at} · {e.actor_id}
                </li>
              ))}
            </ol>
          </section>
          <p className="text-sm">
            Customer publishing is not enabled. A future customer brief must separately identify
            observed facts, hypotheses, missing evidence, expert-reviewed recommendations and
            customer-approved actions. Raw bills stay private.
          </p>
        </div>
      )}
    </DashboardFrame>
  );
}
