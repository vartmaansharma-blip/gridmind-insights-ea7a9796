import type { CSSProperties, ReactNode } from "react";
import mark from "@/assets/gridmind-mark.png";
import plateOwner from "@/assets/hero-plate-owner.jpg";
import plateA from "@/assets/preview-hero-a.jpg";
import plateB from "@/assets/preview-hero-b.jpg";

/* Preview-scoped brand tokens. They do not touch the app's global theme. */
const tokens = {
  "--gm-brand-green": "#9ADD00",
  "--gm-brand-green-foreground": "#080D08",
  "--gm-brand-green-translucent": "rgba(154,221,0,.16)",
  "--gm-bg": "#080C0B",
  "--gm-surface": "#142018",
  "--gm-text": "#F5F6F2",
  "--gm-text-2": "#B9C2C0",
  "--gm-amber": "#E2A43B",
} as CSSProperties;

const CONTACT_PENDING = "#contact-pending";

function Header() {
  return (
    <header className="relative z-20 flex items-center justify-between px-5 py-5 md:px-12">
      <div className="flex items-center gap-2">
        <img src={mark} alt="" width={28} height={28} className="h-7 w-7" />
        <span className="font-display text-lg font-semibold text-[var(--gm-text)]">GridMind</span>
      </div>
      <nav aria-label="Preview navigation" className="hidden gap-8 text-sm text-[var(--gm-text-2)] lg:flex">
        <a href="#frame-b">Platform</a><a href="#frame-b">How it works</a><a href="#frame-c">Example investigation</a>
      </nav>
      <div className="flex items-center gap-4 text-sm">
        <a href="/auth" className="hidden text-[var(--gm-text)] sm:inline">Sign in</a>
        <a href={CONTACT_PENDING} className="rounded-full bg-[var(--gm-brand-green)] px-4 py-2 font-semibold text-[var(--gm-brand-green-foreground)]">Discuss a review ↗</a>
      </div>
    </header>
  );
}

function Hero({ plate, label, position }: { plate: string; label: string; position: string }) {
  return (
    <section aria-label={label} className="relative isolate min-h-[100svh] overflow-hidden bg-[var(--gm-bg)]">
      <img src={plate} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" style={{ objectPosition: position }} />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--gm-bg)_8%,rgba(8,12,11,.75)_42%,rgba(8,12,11,.1)_75%)] max-md:bg-[linear-gradient(180deg,rgba(8,12,11,.92)_35%,rgba(8,12,11,.35)_80%)]" />
      <Header />
      <div className="relative z-10 max-w-[720px] px-5 pt-[8vh] md:px-16 md:pt-[14vh]">
        <p className="eyebrow tracking-[0.25em] text-[var(--gm-text-2)]">INDUSTRIAL INTELLIGENCE</p>
        <h2 className="mt-5 font-display text-[clamp(2.6rem,6.4vw,5.8rem)] font-semibold leading-[0.98] tracking-tight">
          <span className="block text-[var(--gm-text)]">Everything is connected.</span>
          <span className="block text-[var(--gm-brand-green)]">What are we missing?</span>
        </h2>
        <p className="mt-6 max-w-[520px] text-[clamp(1rem,1.3vw,1.15rem)] leading-relaxed text-[var(--gm-text-2)]">
          Evidence-led electricity reviews for factories. Understand the costs, investigate the questions, and identify what deserves attention.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <a href={CONTACT_PENDING} className="rounded-full bg-[var(--gm-brand-green)] px-6 py-3.5 font-semibold text-[var(--gm-brand-green-foreground)] transition-transform duration-200 hover:-translate-y-0.5">Discuss an electricity review ↗</a>
          <a href="#frame-c" className="font-medium text-[var(--gm-text)] underline-offset-4 hover:underline">Explore an example investigation →</a>
        </div>
      </div>
      <p className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-xs tracking-[0.2em] text-[var(--gm-text-2)]">SCROLL TO EXPLORE ↓</p>
      <span className="absolute right-4 top-24 z-10 rounded bg-black/60 px-2 py-1 font-mono text-[10px] text-[var(--gm-text-2)]">{label} · generated concept plate</span>
    </section>
  );
}

function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "green" | "amber" }) {
  const c = tone === "green" ? "border-[var(--gm-brand-green)] text-[var(--gm-brand-green)]" : tone === "amber" ? "border-[var(--gm-amber)] text-[var(--gm-amber)]" : "border-white/20 text-[var(--gm-text-2)]";
  return <span className={`inline-block rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${c}`}>{children}</span>;
}

function BillExtract({ compact = false }: { compact?: boolean }) {
  const rows: [string, string, boolean?][] = [
    ["Billing period", "Aug 2026"], ["Contract demand", "1,750 kVA"], ["Recorded maximum demand", "1,912 kVA", true], ["Demand-related charge", "See tariff schedule", true], ["Power factor (avg)", "0.94"],
  ];
  return (
    <div className="rounded-lg border border-white/10 bg-[var(--gm-surface)] p-4 text-sm">
      <div className="mb-3 flex items-center justify-between"><Tag>Electricity bill · source</Tag><Tag tone="amber">Illustrative — fictional data</Tag></div>
      <dl className="divide-y divide-white/5">
        {rows.slice(0, compact ? 4 : 5).map(([k, v, hi]) => (
          <div key={k} className={`flex justify-between py-2 ${hi ? "rounded bg-[var(--gm-brand-green-translucent)] px-2 outline outline-1 outline-[var(--gm-brand-green)]" : ""}`}>
            <dt className="text-[var(--gm-text-2)]">{k}</dt><dd className="font-mono text-[var(--gm-text)]">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function FrameB() {
  return (
    <section id="frame-b" aria-label="Frame B — Discovery" className="relative isolate min-h-[100svh] overflow-hidden bg-[var(--gm-bg)] px-5 py-16 md:px-16">
      <img src={plateOwner} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30" style={{ objectPosition: "70% center" }} />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--gm-bg)_20%,rgba(8,12,11,.6))]" />
      <Tag>Frame B · Discovery</Tag>
      <div className="mt-10 grid items-center gap-10 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="eyebrow text-[var(--gm-brand-green)]">QUESTION FOR REVIEW</p>
          <h3 className="mt-4 font-display text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-tight text-[var(--gm-text)]">What explains this demand-related charge?</h3>
          <p className="mt-4 max-w-md text-[var(--gm-text-2)]">A question, not a conclusion. The line connects the factory to one field in an ordinary bill — a storytelling device, not live telemetry.</p>
        </div>
        <div className="relative">
          <svg aria-hidden className="pointer-events-none absolute -left-40 top-1/2 hidden h-24 w-44 -translate-y-1/2 lg:block" viewBox="0 0 176 96" fill="none">
            <path d="M0 80 C60 80 90 20 176 20" stroke="var(--gm-brand-green)" strokeWidth="2" />
            <circle cx="3" cy="80" r="4" fill="var(--gm-brand-green)" />
          </svg>
          <BillExtract compact />
        </div>
      </div>
    </section>
  );
}

function FrameC() {
  return (
    <section id="frame-c" aria-label="Frame C — Intelligence" className="min-h-[100svh] bg-[var(--gm-bg)] px-5 py-16 md:px-16">
      <Tag>Frame C · Intelligence</Tag>
      <h3 className="mt-8 font-display text-[clamp(2rem,4vw,3.4rem)] font-semibold text-[var(--gm-text)]">From questions to evidence.</h3>
      <p className="mt-3 max-w-xl text-[var(--gm-text-2)]">A clearer path from electricity documents to observations, review and next steps.</p>
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <div><p className="mb-2 font-mono text-xs text-[var(--gm-text-2)]">01 · Evidence source</p><BillExtract /></div>
        <div className="rounded-lg border border-[var(--gm-brand-green)] bg-[var(--gm-surface)] p-4 text-sm">
          <p className="mb-2 font-mono text-xs text-[var(--gm-text-2)]">02 · Question & observation</p>
          <Tag>Preliminary observation</Tag>
          <p className="mt-3 text-[var(--gm-text)]">Recorded maximum demand in this fictional bill is above contract demand. Whether any charge applies depends on the tariff schedule.</p>
          <p className="mt-4 font-mono text-[11px] uppercase text-[var(--gm-text-2)]">What we know</p><p className="text-[var(--gm-text-2)]">Two figures on one bill.</p>
          <p className="mt-3 font-mono text-[11px] uppercase text-[var(--gm-text-2)]">What we don't yet know</p><p className="text-[var(--gm-text-2)]">Applicable tariff, prior months, operating context.</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[var(--gm-surface)] p-4 text-sm">
          <p className="mb-2 font-mono text-xs text-[var(--gm-text-2)]">03 · Review & next step</p>
          <Tag tone="amber">Needs review</Tag>
          <p className="mt-3 text-[var(--gm-text)]">Next check: obtain the tariff order and 12 months of bills for qualified review.</p>
          <p className="mt-3 text-[var(--gm-text-2)]">No saving is claimed. A qualified reviewer decides.</p>
        </div>
      </div>
    </section>
  );
}

export function DesignPreview() {
  return (
    <main style={tokens} className="bg-[var(--gm-bg)] text-[var(--gm-text)]">
      <h1 className="sr-only">Internal design preview — GridMind hero compositions</h1>
      <div className="sticky top-0 z-50 bg-[var(--gm-brand-green)] px-4 py-1.5 text-center text-xs font-semibold text-[var(--gm-brand-green-foreground)]">
        Internal design preview — illustrative, fictional data · not linked from the site · contact destination pending
      </div>
      <Hero plate={plateOwner} label="Frame A · Option 1 (owner reference)" position="65% center" />
      <Hero plate={plateA} label="Frame A · Option 2 (overlook)" position="75% center" />
      <Hero plate={plateB} label="Frame A · Option 3 (panorama)" position="75% center" />
      <FrameB />
      <FrameC />
      <div id="contact-pending" className="px-5 py-10 text-center text-sm text-[var(--gm-text-2)]">Contact destination pending — no message is sent from this preview.</div>
    </main>
  );
}
