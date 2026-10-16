import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  FileText,
  Layers3,
  ShieldCheck,
  Workflow,
  CheckCircle2,
  Activity,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DashboardBrand } from "@/components/gm/dashboard-frame";
import { customerBrief } from "@/lib/investigation/customer-brief";
import { syntheticCase } from "@/lib/investigation/fixtures";
export function Website() {
  const [sample, setSample] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-card focus:p-3"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <DashboardBrand />
          <nav aria-label="Public navigation" className="flex flex-wrap items-center gap-5 text-sm">
            <a href="#process" className="text-muted-foreground hover:text-foreground">
              How it works
            </a>
            <button
              onClick={() => setSample(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              Sample brief
            </button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/auth" search={{ destination: "customer" }}>
                Sign in <ArrowUpRight className="size-3" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>
      <main id="main">
        <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:py-24">
          <div>
            <div className="eyebrow inline-flex items-center gap-2">
              <span className="size-2 rounded-full bg-cta" />
              Evidence-led industrial investigations · Private beta
            </div>
            <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.12] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              A clear decision starts with a clear evidence chain.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground">
              Bring one operational question into focus. GridMind connects the scope, source
              records, investigation and review in a single workspace—so the next decision has a
              traceable basis.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="cta" size="lg" asChild>
                <Link to="/cases">
                  Request an investigation <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/cases" search={{ mode: "demo" }}>
                  Explore the workspace
                </Link>
              </Button>
            </div>
            <p className="mt-4 max-w-lg text-xs leading-6 text-muted-foreground">
              The preview uses invented records. No customer results, professional approval or
              verified savings are claimed.
            </p>
          </div>
          <div className="relative self-center">
            <div
              aria-hidden
              className="absolute -inset-5 -z-0 rounded-3xl bg-[radial-gradient(ellipse_at_top_right,var(--color-muted),transparent_70%)]"
            />
            <div className="panel relative overflow-hidden shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <span className="eyebrow">Industrial Decision Brief</span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider">
                  Synthetic sample
                </span>
              </div>
              <div className="p-6 sm:p-8">
                <div className="mb-3 flex gap-2 text-xs text-muted-foreground">
                  <FileText className="size-4" /> Evidence to decision
                </div>
                <h2 className="text-xl font-semibold leading-8 tracking-tight">
                  What does the recorded change in energy intensity establish?
                </h2>
                <div className="my-6 grid grid-cols-3 gap-3">
                  {[
                    ["01", "Scope"],
                    ["02", "Evidence"],
                    ["03", "Review"],
                  ].map(([n, l]) => (
                    <div key={n} className="border-t-2 border-cta pt-3">
                      <div className="text-xs text-muted-foreground">{n}</div>
                      <div className="mt-1 text-sm font-medium">{l}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-muted/40 p-5">
                  <p className="eyebrow">Recorded comparison</p>
                  <div className="mt-2 flex items-end gap-3">
                    <span className="text-4xl font-semibold tracking-tight">+33.33%</span>
                    <span className="pb-1 text-xs text-muted-foreground">
                      sample intensity change
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-muted-foreground">
                    Three invented periods. Source-linked arithmetic. Physical cause and recoverable
                    savings remain unknown.
                  </p>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {["E01 · January", "E02 · February", "E03 · March"].map((v) => (
                    <span
                      key={v}
                      className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground"
                    >
                      {v}
                    </span>
                  ))}
                </div>
                <Button variant="outline" className="mt-6 w-full" onClick={() => setSample(true)}>
                  Read the sample brief <ArrowUpRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:grid-cols-3 sm:px-8">
            {[
              [
                Layers3,
                "Sources stay connected",
                "Every observation retains its source and limitations.",
              ],
              [
                ShieldCheck,
                "Review is a release gate",
                "Working analysis stays separate from the published brief.",
              ],
              [
                Workflow,
                "One shared case",
                "Customer requests and team delivery follow the same case.",
              ],
            ].map(([Icon, title, text], i) => {
              const I = Icon as typeof FileText;
              return (
                <div key={i} className="flex gap-4">
                  <I className="mt-1 size-5 shrink-0 text-cta" />
                  <div>
                    <h2 className="text-sm font-semibold">{String(title)}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{String(text)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <section id="process" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
          <div className="eyebrow">The investigation journey</div>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight">
            One question. A complete path to the next decision.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                "01",
                "Define the decision",
                "Agree the question, site, time window and exclusions before analysis.",
              ],
              [
                "02",
                "Reconcile the evidence",
                "Request the relevant records, preserve source references and make conflicts visible.",
              ],
              [
                "03",
                "Investigate and review",
                "Apply the appropriate method, record competing explanations and independently review the current version.",
              ],
              [
                "04",
                "Deliver and follow up",
                "Release the reviewed brief, record the customer decision and measure outcomes separately.",
              ],
            ].map(([n, t, d]) => (
              <article key={n} className="panel p-6">
                <div className="font-mono text-sm text-cta">{n}</div>
                <h3 className="mt-5 font-semibold">{t}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{d}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-16 sm:px-8 lg:grid-cols-2">
          {[
            [
              Zap,
              "Energy and resource evidence",
              "Compare documented consumption and output within an explicit boundary. Tariff validity, causal attribution and savings require their own evidence.",
            ],
            [
              Activity,
              "Downtime and interruption evidence",
              "Build a source-linked chronology, reconcile clocks and separate observations from competing explanations. A timeline alone does not establish a root cause.",
            ],
          ].map(([Icon, t, d], i) => {
            const I = Icon as typeof FileText;
            return (
              <article key={i} className="panel p-7">
                <I className="size-6 text-cta" />
                <div className="eyebrow mt-5">Methods under evaluation</div>
                <h2 className="mt-2 text-xl font-semibold">{String(t)}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{String(d)}</p>
              </article>
            );
          })}
        </section>
        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2">
            <div>
              <div className="eyebrow">Clarity over certainty</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Know what the evidence supports—and what it doesn't.
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                An inconclusive result can still identify the missing record or next verification
                decision. GridMind is designed to make that boundary visible.
              </p>
            </div>
            <div className="grid gap-3">
              {[
                [
                  "Does the system diagnose equipment faults?",
                  "No. The current methods organize evidence and bounded comparisons. Equipment decisions require competent people and site procedures.",
                ],
                [
                  "Is the sample a real customer case?",
                  "No. All sample records, comparisons and review actions are invented. They demonstrate the workflow, not commercial or technical approval.",
                ],
                [
                  "Can I upload confidential records now?",
                  "No. This beta uses synthetic records and reference-based responses. Real source-file intake requires authorized private custody and release safeguards.",
                ],
              ].map(([q, a]) => (
                <details key={q} className="rounded-lg border border-border p-4">
                  <summary className="cursor-pointer text-sm font-semibold">{q}</summary>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="panel flex flex-wrap items-center justify-between gap-8 p-7 sm:p-10">
            <div>
              <div className="eyebrow">Start with one question</div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                What decision does your team need to make?
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Describe the question before sharing technical records.
              </p>
            </div>
            <Button variant="cta" size="lg" asChild>
              <Link to="/cases">
                Open your workspace <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-7 text-xs text-muted-foreground sm:px-8">
          <DashboardBrand />
          <p>Evidence-led investigation · Human responsibility · Source-linked decisions</p>
          <Link to="/team/cases">
            Team workspace <ArrowUpRight className="inline size-3" />
          </Link>
        </div>
      </footer>
      <Dialog open={sample} onOpenChange={setSample}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-auto">
          <DialogHeader>
            <DialogTitle>Sample Industrial Decision Brief</DialogTitle>
            <DialogDescription>
              Invented records only. Not expert-approved or a customer result.
            </DialogDescription>
          </DialogHeader>
          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7">
            {customerBrief(syntheticCase("C4"))}
          </pre>
          <Button asChild variant="outline">
            <Link to="/cases" search={{ mode: "demo" }}>
              Explore the sample workspace <ArrowRight className="size-4" />
            </Link>
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
