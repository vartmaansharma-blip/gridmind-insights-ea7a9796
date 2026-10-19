import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import mark from "@/assets/gridmind-mark.png";
import plate from "@/assets/hero-plate-owner.jpg";
import { EXAMPLE_FIELDS, EXAMPLE_FACTORY, EXAMPLE_PERIOD, buildExampleBrief, type ExampleField, type FieldStatus } from "./example-data";
import "./site.css";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const NAV = [
  { href: "#problem", label: "The problem" },
  { href: "#how", label: "How it works" },
  { href: "#example", label: "Example investigation" },
  { href: "#contact", label: "Contact" },
];

/* ---------------- Shared pieces ---------------- */

function Logo() {
  return (
    <a href="#top" className="flex items-center gap-2.5" aria-label="GridMind — back to top">
      <img src={mark} alt="" width={30} height={30} className="h-[30px] w-[30px]" />
      <span className="gm-display text-[1.15rem] font-semibold">GridMind</span>
    </a>
  );
}

function PrimaryCta({ children = "Discuss an electricity review" }: { children?: ReactNode }) {
  return (
    <a href="#contact" className="gm-btn gm-btn-primary">
      {children} <span aria-hidden>↗</span>
    </a>
  );
}

function StatusChip({ status }: { status: FieldStatus }) {
  const cls = status === "Needs review" ? "gm-status-review" : status === "Missing context" ? "gm-status-missing" : "gm-status-noted";
  const icon = status === "Needs review" ? "◐" : status === "Missing context" ? "○" : "●";
  return <span className={`gm-chip ${cls}`}><span aria-hidden>{icon}</span>{status}</span>;
}

const BILL_ROWS: [string, string, boolean?][] = [
  ["Billing period", "Aug 2026"],
  ["Contract demand", "1,750 kVA"],
  ["Recorded maximum demand", "1,912 kVA", true],
  ["Average power factor", "0.89"],
  ["Units consumed", "2,41,800 kWh"],
];

function BillDocument({ highlightRef, staticHighlight = false }: { highlightRef?: React.Ref<HTMLDivElement>; staticHighlight?: boolean }) {
  return (
    <div className="gm-bill p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="gm-eyebrow text-[0.62rem]" style={{ color: "var(--gm-ink-text-2)" }}>Electricity bill · source</p>
          <p className="mt-1 text-sm font-semibold">HT industrial connection</p>
        </div>
        <span className="gm-chip" style={{ color: "var(--gm-amber-ink)" }}>Illustrative · fictional</span>
      </div>
      <dl className="text-[0.88rem]">
        {BILL_ROWS.map(([k, v, hi]) => (
          <div
            key={k}
            ref={hi ? highlightRef : undefined}
            className={`flex justify-between gap-4 border-t px-2 py-2.5 gm-rule-l ${hi ? "gm-hl rounded" : ""}`}
            style={hi && staticHighlight ? { background: "rgba(154,221,0,.22)", outline: "1px solid #6E9E00" } : undefined}
          >
            <dt>{k}</dt>
            <dd className="gm-mono font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ObservationPanel() {
  return (
    <div className="h-full rounded-md border p-5 gm-rule-d" style={{ background: "var(--gm-surface)" }}>
      <p className="gm-eyebrow gm-muted-d">02 · Question &amp; observation</p>
      <p className="mt-3"><span className="gm-chip gm-muted-d">Preliminary observation</span></p>
      <p className="mt-3 text-[0.95rem] leading-relaxed">Recorded maximum demand on this fictional bill is above the contract demand printed beside it.</p>
      <p className="gm-eyebrow mt-5 text-[0.62rem] gm-muted-d">What we don't yet know</p>
      <p className="mt-1 text-sm gm-muted-d">The applicable tariff, previous months, and when the peak occurred.</p>
    </div>
  );
}

function ReviewPanel() {
  return (
    <div className="h-full rounded-md border p-5 gm-rule-d" style={{ background: "var(--gm-surface)" }}>
      <p className="gm-eyebrow gm-muted-d">03 · Review &amp; next step</p>
      <p className="mt-3"><StatusChip status="Needs review" /></p>
      <p className="mt-3 text-[0.95rem] leading-relaxed">Next check: obtain the tariff order and twelve months of bills for qualified review.</p>
      <p className="mt-5 text-sm gm-muted-d">No saving or error is claimed. A qualified reviewer decides.</p>
    </div>
  );
}

function HeroCopy({ headingId }: { headingId: string }) {
  return (
    <>
      <p className="gm-eyebrow" style={{ color: "var(--gm-text-2)" }}>Industrial intelligence</p>
      <h1 id={headingId} className="gm-display mt-5 text-[clamp(2.7rem,6vw,5.6rem)] font-semibold leading-[0.98]">
        <span className="block">Everything is connected.</span>
        <span className="block" style={{ color: "var(--gm-brand-green)" }}>What are we missing?</span>
      </h1>
      <p className="mt-6 max-w-[34rem] text-[clamp(1.02rem,1.25vw,1.18rem)] leading-relaxed" style={{ color: "var(--gm-text-2)" }}>
        Evidence-led electricity reviews for factories. Understand the costs, investigate the questions, and identify what deserves attention.
      </p>
      <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
        <PrimaryCta />
        <Link to="/electricity-demo" className="gm-btn gm-btn-ghost">Try the fictional investigation <span aria-hidden>→</span></Link>
      </div>
    </>
  );
}

function Plate({ eager = false }: { eager?: boolean }) {
  return (
    <div className="gm-plate" aria-hidden>
      <img src={plate} alt="" width={1376} height={768} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : "auto"} onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
    </div>
  );
}

/* ---------------- Header ---------------- */

function Header() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const firstLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY, h = window.innerHeight;
        setSolid((s) => (s ? y > h * 0.45 : y > h * 0.6));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    if (!open) return;
    firstLink.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="gm-header" data-solid={solid || open}>
      <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-5 md:px-10">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-8 text-[0.92rem] lg:flex">
          {NAV.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}
        </nav>
        <div className="flex items-center gap-4 text-[0.92rem]">
          <Link to="/auth" className="whitespace-nowrap hover:underline underline-offset-4">Sign in</Link>
          <span className="hidden sm:inline"><a href="#contact" className="gm-btn gm-btn-primary !px-4 !py-2 text-sm">Discuss a review</a></span>
          <button
            type="button"
            className="rounded-md border px-3 py-1.5 text-sm gm-rule-d lg:hidden"
            aria-expanded={open}
            aria-controls="gm-mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>
      {open && (
        <nav id="gm-mobile-menu" aria-label="Main" className="border-t px-5 pb-6 pt-2 gm-rule-d lg:hidden" style={{ background: "var(--gm-ink)" }}>
          {NAV.map((n, i) => (
            <a key={n.href} ref={i === 0 ? firstLink : undefined} href={n.href} onClick={() => setOpen(false)} className="block border-b py-4 text-lg gm-rule-d">
              {n.label}
            </a>
          ))}
          <Link to="/auth" className="block border-b py-4 text-lg gm-rule-d">Sign in</Link>
          <a href="#contact" onClick={() => setOpen(false)} className="gm-btn gm-btn-primary mt-5">Discuss an electricity review</a>
        </nav>
      )}
    </header>
  );
}

/* ---------------- Scroll-linked three-act sequence (desktop) ---------------- */

function Sequence() {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const billHl = useRef<HTMLDivElement>(null);
  const panel2 = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState({ world: "", ui: "" });

  const measure = useCallback(() => {
    const s = stage.current, a = anchor.current, b = billHl.current, p2 = panel2.current;
    if (!s || !a || !b || !p2) return;
    const sr = s.getBoundingClientRect();
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    const pr = p2.getBoundingClientRect();
    // Measure the bill in its resting place, independent of its current scroll transform.
    const wrap = b.closest<HTMLElement>(".gm-bill-wrap");
    const tf = wrap ? getComputedStyle(wrap).transform : "none";
    const offset = tf && tf !== "none" ? new DOMMatrixReadOnly(tf).m42 : 0;
    const ax = ar.left + ar.width / 2 - sr.left, ay = ar.top + ar.height / 2 - sr.top;
    const bx = br.right - sr.left, by = br.top + br.height / 2 - sr.top - offset;
    const px = pr.left - sr.left;
    setPaths({
      world: `M ${ax} ${ay} C ${ax - 120} ${ay + 40}, ${bx + 160} ${by}, ${bx} ${by}`,
      ui: `M ${bx} ${by} L ${px - 4} ${by}`,
    });
  }, []);

  useIsoLayoutEffect(() => {
    const t = track.current, s = stage.current;
    if (!t || !s) return;
    let raf = 0;
    let act = "";
    const update = () => {
      const r = t.getBoundingClientRect();
      const span = Math.max(1, r.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / span));
      t.style.setProperty("--p", p.toFixed(4));
      const next = p < 0.22 ? "1" : p < 0.66 ? "2" : "3";
      if (next !== act) { act = next; s.dataset.act = next; }
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    update();
    measure();
    const ro = new ResizeObserver(() => { measure(); update(); });
    ro.observe(s);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); ro.disconnect(); cancelAnimationFrame(raf); };
  }, [measure]);

  return (
    <div ref={track} className="gm-seq" aria-label="GridMind introduction">
      <div ref={stage} className="gm-stage" data-act="1">
        <Plate eager />
        <svg className="gm-thread" aria-hidden>
          <g className="gm-thread-world">
            <path d={paths.world} pathLength={1} className="gm-thread-main" fill="none" stroke="#9ADD00" strokeOpacity={0.25} strokeWidth={8} strokeLinecap="round" />
            <path d={paths.world} pathLength={1} className="gm-thread-main" fill="none" stroke="#9ADD00" strokeWidth={2} strokeLinecap="round" />
          </g>
          <path d={paths.ui} pathLength={1} className="gm-thread-ui" fill="none" stroke="#9ADD00" strokeWidth={2} />
        </svg>
        <div ref={anchor} className="gm-anchor" style={{ left: "70%", top: "47%" }}>
          <span className="gm-anchor-label gm-mono rounded px-2 py-1 text-[0.68rem] tracking-wider" style={{ color: "var(--gm-text)", background: "rgba(8,12,11,.72)" }}>ELECTRICITY SUPPLY · PHYSICAL CONTEXT</span>
        </div>

        <div className="relative mx-auto h-full max-w-[1320px] px-10">
          <div className="gm-act1 absolute left-10 top-[20vh] max-w-[46rem]">
            <HeroCopy headingId="hero-title" />
          </div>

          <div className="gm-act2 absolute left-10 top-[12vh] max-w-[44rem]" aria-hidden>
            <p className="gm-eyebrow" style={{ color: "var(--gm-brand-green)" }}>Act II · Discovery — question for review</p>
            <p className="gm-display mt-4 text-[clamp(2rem,3.4vw,3.2rem)] font-semibold leading-tight">What explains this demand-related charge?</p>
            <p className="mt-3 max-w-lg" style={{ color: "var(--gm-text-2)" }}>A question, not a conclusion. The line is a storytelling device, not live telemetry.</p>
          </div>

          <div className="gm-act3 absolute left-10 top-[12vh] max-w-[44rem]" aria-hidden>
            <p className="gm-eyebrow" style={{ color: "var(--gm-brand-green)" }}>Act III · Intelligence</p>
            <p className="gm-display mt-4 text-[clamp(2rem,3.4vw,3.2rem)] font-semibold leading-tight">From questions to evidence.</p>
            <p className="mt-3 max-w-lg" style={{ color: "var(--gm-text-2)" }}>A clearer path from electricity documents to observations, review and next steps.</p>
          </div>

          <div className="absolute inset-x-10 top-[40vh] grid grid-cols-3 gap-6" aria-hidden>
            <div className="gm-bill-wrap"><p className="gm-eyebrow mb-2" style={{ color: "var(--gm-text-2)" }}>01 · Evidence source</p><BillDocument highlightRef={billHl} /></div>
            <div ref={panel2} className="gm-panel-2 pt-6"><ObservationPanel /></div>
            <div className="gm-panel-3 pt-6"><ReviewPanel /></div>
          </div>
        </div>

        <div className="gm-progress" aria-hidden><span><i /></span><span><i /></span><span><i /></span></div>
        <p className="gm-act1 gm-eyebrow absolute bottom-7 left-1/2 -translate-x-1/2" style={{ color: "var(--gm-text-2)" }}>Scroll to explore ↓</p>
      </div>
    </div>
  );
}

/* ---------------- Normal-flow version (mobile, tablet, reduced motion) ---------------- */

function FlowIntro() {
  return (
    <div className="gm-flow">
      <section aria-labelledby="hero-title-flow" className="relative isolate flex min-h-[100svh] items-start overflow-hidden">
        <Plate eager />
        <div className="relative z-10 mx-auto w-full max-w-[1320px] px-5 pb-16 pt-[clamp(6.5rem,16vh,9rem)] md:px-10">
          <div className="max-w-[40rem]"><HeroCopy headingId="hero-title-flow" /></div>
        </div>
      </section>
      <section className="px-5 py-16 md:px-10" style={{ background: "var(--gm-ink)" }}>
        <div className="mx-auto max-w-[1320px]">
          <p className="gm-eyebrow" style={{ color: "var(--gm-brand-green)" }}>Discovery · question for review</p>
          <h2 className="gm-display mt-4 text-[clamp(1.9rem,6vw,3rem)] font-semibold leading-tight">What explains this demand-related charge?</h2>
          <p className="mt-3 max-w-lg" style={{ color: "var(--gm-text-2)" }}>A question, not a conclusion. Evidence comes first.</p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div><BillDocument staticHighlight /></div>
            <ObservationPanel />
            <ReviewPanel />
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------------- Chapters ---------------- */

function SectionHead({ n, eyebrow, title, intro, light }: { n: string; eyebrow: string; title: ReactNode; intro?: ReactNode; light?: boolean }) {
  return (
    <div data-reveal className="max-w-[48rem]">
      <p className="gm-eyebrow" style={{ color: light ? "#4E7A00" : "var(--gm-brand-green)" }}>{n} · {eyebrow}</p>
      <h2 className="gm-display mt-4 text-[clamp(2rem,4.2vw,3.6rem)] font-semibold leading-[1.04]">{title}</h2>
      {intro && <p className={`mt-5 max-w-[38rem] text-[1.08rem] leading-relaxed ${light ? "gm-muted" : "gm-muted-d"}`}>{intro}</p>}
    </div>
  );
}

function Problem() {
  const items = [
    ["Demand", "Contract demand, recorded maximum demand and the way they are billed sit on different lines, and often on different documents."],
    ["Power factor", "A number is printed. Whether it matters depends on tariff provisions that are not on the bill."],
    ["Tariff category", "Short codes hide which schedule applies, and which conditions follow from it."],
  ];
  return (
    <section id="problem" className="gm-light px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto grid max-w-[1320px] gap-14 lg:grid-cols-[1.1fr_1fr]">
        <SectionHead light n="01" eyebrow="The problem" title={<>An electricity bill is evidence.<br />It rarely explains itself.</>}
          intro="Factories pay for electricity every month, but the figures that drive the bill are spread across lines, tariffs and records that few people have time to read together." />
        <ol className="border-t gm-rule-l">
          {items.map(([t, d], i) => (
            <li key={t} data-reveal className="grid grid-cols-[3rem_1fr] gap-4 border-b py-7 gm-rule-l">
              <span className="gm-mono text-sm gm-muted">0{i + 1}</span>
              <div><p className="gm-display text-xl font-semibold">{t}</p><p className="mt-2 leading-relaxed gm-muted">{d}</p></div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const STEPS = [
  { t: "Share what you have", you: "Recent electricity bills, the connection details you know, and the questions you already have.", we: "Agree with you, in writing, what is shared and how it is handled.", out: "A clear list of documents received and anything missing." },
  { t: "Organise the sources", you: "Answer short questions about how the plant runs: shifts, major loads, planned changes.", we: "Lay out every figure with the document and line it came from.", out: "A source table you can check line by line." },
  { t: "Observe and question", you: "Confirm or correct the context.", we: "Separate what the documents show from what they do not, and frame open questions.", out: "Observations, each marked with what is known and what is still missing." },
  { t: "Qualified review and next steps", you: "Decide what to pursue. Changes stay with qualified plant personnel.", we: "Bring in a qualified electrical or tariff reviewer where a question needs one.", out: "A scoped evidence brief with next checks, not guaranteed savings." },
];

function HowItWorks() {
  const [i, setI] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + STEPS.length) % STEPS.length;
    setI(n); refs.current[n]?.focus();
  };
  const s = STEPS[i]!;
  return (
    <section id="how" className="gm-light border-t px-5 py-24 gm-rule-l md:px-10 md:py-32" style={{ background: "var(--gm-mineral-2)" }}>
      <div className="mx-auto max-w-[1320px]">
        <SectionHead light n="02" eyebrow="How it works" title="A review you can follow, one source at a time." />
        <div className="mt-14 grid gap-10 lg:grid-cols-[22rem_1fr]">
          <div role="tablist" aria-label="Review steps" aria-orientation="vertical" className="flex flex-col">
            {STEPS.map((st, k) => (
              <button key={st.t} ref={(el) => { refs.current[k] = el; }} role="tab" id={`step-tab-${k}`} aria-controls="step-panel" aria-selected={i === k} tabIndex={i === k ? 0 : -1}
                onClick={() => setI(k)} onKeyDown={onKey} className="gm-step">
                <span className="gm-step-n gm-mono mr-3 text-sm">0{k + 1}</span>
                <span className="gm-display text-lg font-semibold">{st.t}</span>
              </button>
            ))}
          </div>
          <div id="step-panel" role="tabpanel" aria-labelledby={`step-tab-${i}`} key={i} className="gm-detail-enter grid gap-8 border-t pt-8 gm-rule-l md:grid-cols-3">
            {([["You provide", s.you], ["GridMind does", s.we], ["You get", s.out]] as const).map(([h, b]) => (
              <div key={h}><p className="gm-eyebrow gm-muted">{h}</p><p className="mt-3 text-[1.05rem] leading-relaxed">{b}</p></div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function Example() {
  const [activeId, setActiveId] = useState(EXAMPLE_FIELDS[0]!.id);
  const [scope, setScope] = useState<"selected" | "all">("all");
  const f: ExampleField = EXAMPLE_FIELDS.find((x) => x.id === activeId) ?? EXAMPLE_FIELDS[0]!;
  const reset = () => { setActiveId(EXAMPLE_FIELDS[0]!.id); setScope("all"); };
  return (
    <section id="example" className="gm-dark px-5 py-24 md:px-10 md:py-32" style={{ background: "var(--gm-ink)" }}>
      <div className="mx-auto max-w-[1320px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead n="03" eyebrow="Example investigation" title="Pick a line on the bill. See what it can and cannot tell you."
            intro={<>Fictional factory and bill. {EXAMPLE_FACTORY} · {EXAMPLE_PERIOD}.</>} />
          <span className="gm-chip" style={{ color: "var(--gm-amber)" }}>Illustrative example · fictional data</span>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,26rem)_1fr]">
          <div>
            <p className="gm-eyebrow gm-muted-d mb-3">Bill fields</p>
            <ul aria-label="Fictional bill fields">
              {EXAMPLE_FIELDS.map((x) => (
                <li key={x.id}>
                  <button type="button" className="gm-field-btn" aria-pressed={x.id === activeId} onClick={() => setActiveId(x.id)}>
                    <span className="font-medium">{x.label}</span>
                    <span className="gm-mono text-sm">{x.value}</span>
                    <span className="col-span-2 text-sm gm-muted-d">{x.question}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div key={f.id} className="gm-detail-enter rounded-md border p-6 md:p-8 gm-rule-d" style={{ background: "var(--gm-surface)" }} aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="gm-display text-[1.6rem] font-semibold leading-tight">{f.question}</p>
              <StatusChip status={f.status} />
            </div>
            <dl className="mt-7 grid gap-6 md:grid-cols-2">
              <div><dt className="gm-eyebrow" style={{ color: "var(--gm-brand-green)" }}>Evidence</dt><dd className="mt-2 leading-relaxed">{f.evidence}</dd></div>
              <div><dt className="gm-eyebrow gm-muted-d">Observation · preliminary</dt><dd className="mt-2 leading-relaxed">{f.observation}</dd></div>
              <div><dt className="gm-eyebrow gm-muted-d">Not yet known</dt><dd className="mt-2"><ul className="list-disc space-y-1 pl-5 gm-muted-d">{f.missing.map((m) => <li key={m}>{m}</li>)}</ul></dd></div>
              <div><dt className="gm-eyebrow gm-muted-d">Next check</dt><dd className="mt-2 leading-relaxed">{f.nextCheck}</dd></div>
            </dl>
            <div className="mt-8 flex flex-wrap items-center gap-4 border-t pt-6 gm-rule-d">
              <fieldset className="flex items-center gap-4 text-sm">
                <legend className="sr-only">Brief contents</legend>
                <label className="flex items-center gap-2"><input type="radio" name="scope" checked={scope === "all"} onChange={() => setScope("all")} /> All fields</label>
                <label className="flex items-center gap-2"><input type="radio" name="scope" checked={scope === "selected"} onChange={() => setScope("selected")} /> This field only</label>
              </fieldset>
              <button type="button" className="gm-btn gm-btn-primary !py-2.5 text-sm"
                onClick={() => downloadText(buildExampleBrief(scope === "all" ? [] : [f.id]), "gridmind-example-brief-FICTIONAL.txt")}>
                Download fictional brief
              </button>
              <button type="button" className="text-sm underline underline-offset-4 gm-muted-d hover:text-[var(--gm-text)]" onClick={reset}>Reset example</button>
            </div>
          </div>
        </div>
        <p className="mt-8 text-sm gm-muted-d">
          Want to see a fuller workflow? <Link to="/cases" search={{ mode: "demo" }} className="underline underline-offset-4">Explore the sample workspace</Link> or open the <Link to="/dashboard" className="underline underline-offset-4">GridMind Dashboard</Link>. Both use synthetic data.
        </p>
      </div>
    </section>
  );
}

const FAQS = [
  ["Is this an official energy audit?", "No. It is an evidence-led review of the documents you share. Where a question needs a qualified electrical or tariff specialist, we say so and bring one in."],
  ["Will you guarantee a saving?", "No. Some reviews find questions worth pursuing; some find nothing material. Both are useful outcomes, and we will not promise either in advance."],
  ["Do you connect to our meters or machines?", "Not for this review. It works from bills and the records you choose to share. There is no live monitoring."],
  ["Who makes changes at the plant?", "Your qualified plant personnel. GridMind provides evidence and next checks, not control of equipment."],
  ["What does it cost?", "Scope and pricing are agreed with you before any work starts."],
];

function Deliverable() {
  return (
    <section id="deliverable" className="gm-light px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1320px]">
        <SectionHead light n="04" eyebrow="What you receive" title="A brief you can check, with its limits written down." />
        <div className="mt-14 grid gap-12 lg:grid-cols-2">
          <div data-reveal>
            <p className="gm-eyebrow gm-muted">The evidence brief</p>
            <ul className="mt-4 border-t gm-rule-l">
              {["Every figure linked to the document and line it came from", "Observations kept separate from interpretation", "What is still unknown, stated plainly", "Next checks, and who should make them"].map((x) => (
                <li key={x} className="flex gap-3 border-b py-4 gm-rule-l"><span aria-hidden className="gm-mono" style={{ color: "#4E7A00" }}>—</span>{x}</li>
              ))}
            </ul>
          </div>
          <div data-reveal>
            <p className="gm-eyebrow gm-muted">Boundaries</p>
            <ul className="mt-4 border-t gm-rule-l">
              {["No guaranteed savings or invented results", "No live monitoring or automatic fault detection", "No changes to your connection or equipment", "Qualified review where a question needs it"].map((x) => (
                <li key={x} className="flex gap-3 border-b py-4 gm-rule-l"><span aria-hidden className="gm-mono gm-muted">×</span>{x}</li>
              ))}
            </ul>
          </div>
        </div>
        <div data-reveal className="gm-faq mt-20 max-w-[52rem]">
          <p className="gm-eyebrow gm-muted">Questions</p>
          <div className="mt-2 border-t gm-rule-l">
            {FAQS.map(([q, a]) => (
              <details key={q} className="border-b gm-rule-l"><summary>{q}</summary><p className="pb-5 leading-relaxed gm-muted">{a}</p></details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Vision() {
  return (
    <section id="vision" className="relative isolate overflow-hidden px-5 py-28 md:px-10 md:py-36" style={{ background: "var(--gm-ink)" }}>
      <div className="mx-auto max-w-[1320px]">
        <SectionHead n="05" eyebrow="Beyond electricity" title="Electricity is where we start. It is not where the questions end."
          intro="Over time, GridMind intends to connect the same evidence-first method to more of a plant's physical systems and records. That is an ambition, not a service available today." />
        <p data-reveal className="mt-8"><span className="gm-chip" style={{ color: "var(--gm-amber)" }}>Future direction · not currently offered</span></p>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="border-t px-5 py-28 gm-rule-d md:px-10 md:py-36" style={{ background: "var(--gm-surface-2)" }}>
      <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[1.3fr_1fr]">
        <SectionHead n="06" eyebrow="Start a conversation" title={<>Have a question about your factory's electricity costs?</>}
          intro="Tell us what you are seeing on your bills. We will tell you honestly whether a review is likely to help." />
        <div data-reveal className="self-end rounded-md border p-6 gm-rule-d" role="region" aria-labelledby="contact-request-title" style={{ background: "var(--gm-ink)" }}>
          <span className="gm-chip" style={{ color: "var(--gm-brand-green)" }}>Private investigation request</span>
          <p id="contact-request-title" className="gm-display mt-4 text-xl font-semibold">Start with one clear question.</p>
          <p className="mt-2 leading-relaxed gm-muted-d">Open a private workspace to describe the decision you need to make. Your request is reviewed before any engagement is agreed.</p>
          <p className="mt-3 text-xs leading-relaxed gm-muted-d">This is an early beta. Do not share confidential plant records or upload technical files. A request is not a technical assessment or a guaranteed response.</p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
            <Link to="/cases" className="gm-btn gm-btn-primary !px-5 !py-3">Request a conversation <span aria-hidden>↗</span></Link>
            <Link to="/auth" search={{ destination: "customer" }} className="underline underline-offset-4">Existing customer? Sign in</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t px-5 py-10 text-sm gm-rule-d md:px-10" style={{ background: "var(--gm-ink)" }}>
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Footer" className="flex flex-wrap gap-6 gm-muted-d">
          {NAV.map((n) => <a key={n.href} href={n.href} className="hover:text-[var(--gm-text)]">{n.label}</a>)}
          <Link to="/auth" className="hover:text-[var(--gm-text)]">Sign in</Link>
        </nav>
        <p className="w-full gm-muted-d">Examples on this page use fictional data. Hero photograph is a generated concept image, not a customer site.</p>
      </div>
    </footer>
  );
}

/* ---------------- Page ---------------- */

export function PublicSite() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || !("IntersectionObserver" in window)) return;
    el.dataset.anim = "on";
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -10% 0px" });
    el.querySelectorAll("[data-reveal]").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
  return (
    <div ref={root} id="top" className="gm-site">
      <a href="#problem" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-20 focus:z-[70] focus:rounded focus:px-3 focus:py-2" style={{ background: "var(--gm-brand-green)", color: "var(--gm-brand-green-foreground)" }}>Skip to content</a>
      <Header />
      <main>
        <Sequence />
        <FlowIntro />
        <Problem />
        <HowItWorks />
        <Example />
        <Deliverable />
        <Vision />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
