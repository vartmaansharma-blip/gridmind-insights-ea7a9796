import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Download, FileText, ShieldCheck } from "lucide-react";
import mark from "@/assets/gridmind-mark.png";
import { inspectSyntheticBillCoverage, syntheticBillFactsSchema } from "@/lib/electricity/synthetic-bill-facts";
import "./site.css";
import "./electricity-demo.css";

/**
 * Public, hard-coded, fictional demonstration. Not connected to Supabase,
 * the private electricity case API, billing documents, or any customer's data.
 */
const RECORD = syntheticBillFactsSchema.parse({
  contractVersion: "synthetic-bill-facts-v1",
  sourceType: "synthetic",
  reviewState: "unverified",
  documentId: "SYN-BILL-DEMO-001",
  supplier: "Unknown",
  billFrom: "2026-09-01",
  billTo: "2026-09-30",
  fields: [
    { kind: "number", name: "contract_demand", decimal: "500", unit: "kVA", source: { documentId: "SYN-BILL-DEMO-001", page: 1, printedLabel: "Contract Demand" } },
    { kind: "number", name: "recorded_maximum_demand", decimal: "310", unit: "kVA", source: { documentId: "SYN-BILL-DEMO-001", page: 1, printedLabel: "Maximum Demand" } },
    { kind: "number", name: "billed_demand", decimal: "400", unit: "kVA", source: { documentId: "SYN-BILL-DEMO-001", page: 1, printedLabel: "Billed Demand" } },
    { kind: "number", name: "power_factor", decimal: "0.92", unit: "ratio", source: { documentId: "SYN-BILL-DEMO-001", page: 1, printedLabel: "Average PF" } },
    { kind: "text", name: "tariff_category", value: "HT industrial (short label)", source: { documentId: "SYN-BILL-DEMO-001", page: 1, printedLabel: "Category" } },
  ],
});

const STEPS = [
  { label: "Follow the evidence", n: "01" },
  { label: "Test an explanation", n: "02" },
  { label: "Understand the decision", n: "03" },
] as const;

type BillItem = {
  id: string;
  label: string;
  printed: string;
  value: string;
  observation: string;
  missing: string;
};
const FIELDS: BillItem[] = [
  { id: "contract_demand", label: "Contract demand", printed: "Contract Demand", value: "500 kVA", observation: "The contracted capacity shown on the fictional bill is 500 kVA.", missing: "Signed agreement and any amended demand terms." },
  { id: "recorded_maximum_demand", label: "Recorded maximum demand", printed: "Maximum Demand", value: "310 kVA", observation: "The highest demand recorded on the fictional bill is 310 kVA.", missing: "Metering interval, meter register and demand period." },
  { id: "billed_demand", label: "Billed demand", printed: "Billed Demand", value: "400 kVA", observation: "The quantity charged as billed demand is 400 kVA, which is not the same as the printed maximum demand.", missing: "Dated, supplier-specific minimum billing-demand terms." },
  { id: "power_factor", label: "Average power factor", printed: "Average PF", value: "0.92", observation: "A power-factor value is printed. The bill alone does not establish whether a charge or rebate applies.", missing: "Applicable tariff provisions and evidence of any PF charge." },
  { id: "tariff_category", label: "Tariff category", printed: "Category", value: "HT industrial", observation: "A short category label appears, but eligibility and tariff source are not verified.", missing: "Actual licensee, full category code and contract documents." },
];

const reviewRequirements = [
  "Identify the actual supply licensee and service territory.",
  "Match the billing period to the relevant tariff order and amendments.",
  "Verify the connection agreement and contracted demand.",
  "Have a qualified tariff specialist assess any discrepancy.",
];

function downloadFictionalNote(ruleVisible: boolean) {
  const lines = [
    "GRIDMIND — FICTIONAL EVIDENCE NOTE",
    "Illustrative training scenario only. NOT a real customer, bill or expert conclusion.",
    "Document SYN-BILL-DEMO-001 | Page 1 | September 2026",
    "",
    ...FIELDS.map((f) => f.label + ": " + f.value + " [fictional source p.1, '" + f.printed + "']"),
    "",
    "QUESTION: What explains a billed demand of 400 kVA while the recorded maximum is 310 kVA?",
    "OBSERVATION: This is a difference in quantities, NOT proof of overbilling.",
    ruleVisible
      ? "FICTIONAL TEST: If (only if) an imaginary rule requires 80% of 500 kVA, the illustrative floor equals 400 kVA. NOT A REAL TARIFF RULE."
      : "NO TARIFF RULE SUPPLIED: There is no defensible charge calculation.",
    "STATUS: Supplier order unverified. Specialist review NOT performed.",
    "",
    "EVIDENCE REQUIRED:",
    ...reviewRequirements.map((r) => "- " + r),
    "",
    "NO refund, saving, bill error or tariff compliance is asserted.",
    "No documents uploaded or saved. No live system accessed.",
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "gridmind-fictional-investigation-note.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ElectricityDemonstration() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState("billed_demand");
  const [ruleVisible, setRuleVisible] = useState(false);
  const active = FIELDS.find((f) => f.id === selected) ?? FIELDS[2]!;
  const coverage = useMemo(() => inspectSyntheticBillCoverage(RECORD), []);

  return (
    <div className="gm-site gm-demo" id="top">
      <a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] gm-btn gm-btn-primary" href="#walkthrough">Skip to investigation</a>
      <header className="gm-demo-header">
        <div className="gm-demo-wrap gm-demo-header-inner">
          <Link to="/" className="gm-demo-logo" aria-label="GridMind homepage">
            <img src={mark} width={28} height={28} alt="" /> <span className="gm-display">GridMind</span>
          </Link>
          <span className="gm-demo-header-name">Investigation walkthrough</span>
          <Link to="/" className="gm-demo-back"><ArrowLeft size={15} /> Main website</Link>
        </div>
      </header>

      <main>
        <section className="gm-demo-hero">
          <div className="gm-demo-wrap">
            <div className="gm-demo-meta">
              <span className="gm-demo-tag gm-demo-tag-green">Interactive case demonstration</span>
              <span className="gm-demo-tag">Fictional data · No real bills</span>
            </div>
            <p className="gm-eyebrow gm-demo-kicker">An industrial electricity investigation, explained</p>
            <h1 className="gm-display gm-demo-h1">
              The meter says <em>310.</em><br />
              The bill says <em>400.</em><br />
              <span>What are we missing?</span>
            </h1>
            <div className="gm-demo-hero-bottom">
              <p>A difference is not automatically an error. Follow a fictional factory bill from a question to the evidence needed for a responsible decision.</p>
              <a href="#walkthrough" className="gm-btn gm-btn-primary">Explore the investigation <ArrowRight size={17} /></a>
            </div>
            <div className="gm-demo-metrics" aria-label="Fictional bill demand figures">
              <div><small>Contract demand</small><strong>500 <span>kVA</span></strong><p>Printed on the fictional bill</p></div>
              <div><small>Recorded maximum</small><strong>310 <span>kVA</span></strong><p>Observed quantity</p></div>
              <div className="gm-demo-metric-accent"><small>Billed demand</small><strong>400 <span>kVA</span></strong><p>Question for investigation</p></div>
            </div>
          </div>
        </section>

        <section className="gm-demo-work" id="walkthrough" aria-labelledby="walkthrough-title">
          <div className="gm-demo-wrap">
            <div className="gm-demo-work-header">
              <div>
                <p className="gm-eyebrow gm-demo-accent">The GridMind method</p>
                <h2 className="gm-display" id="walkthrough-title">One question. Every source visible.</h2>
              </div>
              <span className="gm-demo-tag">Case SYN-001 · Illustrative only</span>
            </div>
            <div className="gm-demo-steps" role="tablist" aria-label="Investigation stages">
              {STEPS.map((s, i) => (
                <button
                  key={s.n}
                  type="button"
                  role="tab"
                  id={"gm-demo-tab-" + i}
                  aria-controls="gm-demo-stage"
                  aria-selected={step === i}
                  tabIndex={step === i ? 0 : -1}
                  className={step === i ? "gm-demo-step is-current" : "gm-demo-step"}
                  onClick={() => setStep(i)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                      e.preventDefault();
                      const next = (step + (e.key === "ArrowRight" ? 1 : STEPS.length - 1)) % STEPS.length;
                      setStep(next);
                      document.getElementById("gm-demo-tab-" + next)?.focus();
                    }
                  }}
                ><small>{s.n}</small><span>{s.label}</span></button>
              ))}
            </div>

            <div className="gm-demo-grid">
              <aside className="gm-demo-source" aria-label="Fictional electricity bill">
                <div className="gm-demo-source-head">
                  <FileText size={19} aria-hidden />
                  <div><strong>Electricity bill extract</strong><p>Fictional Source · SYN-BILL-DEMO-001 · p.1</p></div>
                </div>
                <div className="gm-demo-paper">
                  <div className="gm-demo-paper-head">
                    <span>ILLUSTRATIVE UTILITY</span>
                    <span>NOT A REAL BILL</span>
                  </div>
                  <p className="gm-demo-paper-title">Example Works — Industrial Connection</p>
                  <p className="gm-demo-paper-sub">September 2026 · Supplier not verified</p>
                  <div className="gm-demo-paper-rows">
                    {FIELDS.map((f) => (
                      <button
                        type="button"
                        key={f.id}
                        aria-pressed={selected === f.id}
                        className={selected === f.id ? "gm-demo-paper-row is-selected" : "gm-demo-paper-row"}
                        onClick={() => { setSelected(f.id); setStep(0); }}
                      >
                        <span>{f.printed}</span>
                        <strong>{f.value}</strong>
                      </button>
                    ))}
                  </div>
                  <p className="gm-demo-paper-foot">No account, consumer number or actual tariff rate is represented.</p>
                </div>
                <p className="gm-demo-source-note">Select any line to trace its observation. Nothing is uploaded, stored, or sent to GridMind.</p>
              </aside>

              <div
                id="gm-demo-stage"
                role="tabpanel"
                aria-labelledby={"gm-demo-tab-" + step}
                className="gm-demo-stage"
                aria-live="polite"
              >
                {step === 0 && (
                  <>
                    <span className="gm-demo-stage-n">01 / Observation</span>
                    <h3 className="gm-display">A number without its context is just a number.</h3>
                    <div className="gm-demo-trace">
                      <span>Evidence trail</span>
                      <div><span>SYN-BILL-DEMO-001</span><ArrowRight size={15} /><span>Page 1</span><ArrowRight size={15} /><span>{active.printed}</span></div>
                    </div>
                    <p className="gm-demo-stage-lede">{active.observation}</p>
                    <div className="gm-demo-question">
                      <p className="gm-eyebrow">What is still missing?</p>
                      <p>{active.missing}</p>
                    </div>
                    <p className="gm-demo-caution">Observed discrepancy ≠ validated billing error. Source traceability is only the first step.</p>
                  </>
                )}
                {step === 1 && (
                  <>
                    <span className="gm-demo-stage-n">02 / Hypothesis testing</span>
                    <h3 className="gm-display">Could there be a legitimate explanation?</h3>
                    <p className="gm-demo-stage-lede">The maximum demand is 310 kVA, but 400 kVA was billed. Some real tariffs have minimum billed-demand rules; we cannot assume which one applies here.</p>
                    <div className="gm-demo-rule">
                      <label className="gm-demo-rule-label">
                        <input type="checkbox" checked={ruleVisible} onChange={(e) => setRuleVisible(e.target.checked)} />
                        <span><strong>Test an invented example rule</strong><small>Fictional assumption only — not a JSERC tariff provision</small></span>
                      </label>
                      {ruleVisible ? (
                        <div className="gm-demo-rule-result" data-testid="example-rule-result">
                          <p className="gm-eyebrow">Hypothetical arithmetic</p>
                          <strong>80% × 500 kVA = 400 kVA</strong>
                          <p>If a verified contract actually required this imaginary 80% floor, the displayed quantities could be internally consistent. We have NOT established such a rule for any supplier.</p>
                        </div>
                      ) : (
                        <p className="gm-demo-no-rule">No applicable tariff provision has been supplied. A billing calculation would be unjustified.</p>
                      )}
                    </div>
                    <p className="gm-demo-caution">No overcharge, refund or saving is claimed. An expert must verify the actual licensee, order and agreement.</p>
                  </>
                )}
                {step === 2 && (
                  <>
                    <span className="gm-demo-stage-n">03 / Decision boundary</span>
                    <h3 className="gm-display">An honest outcome is useful—even when the answer is “not yet.”</h3>
                    <div className="gm-demo-review">
                      <ShieldCheck size={21} aria-hidden />
                      <div><strong>Qualified review not performed</strong><p>Not approved for a customer finding or a change to electrical infrastructure.</p></div>
                    </div>
                    <p className="gm-demo-stage-lede">We would first request the specific records necessary to decide whether this difference matters:</p>
                    <ul className="gm-demo-reqs">
                      {reviewRequirements.map((req) => <li key={req}><Check size={15} aria-hidden />{req}</li>)}
                    </ul>
                    <div className="gm-demo-question">
                      <p className="gm-eyebrow">Decision in this demonstration</p>
                      <p><strong>More evidence required.</strong> No financial or legal conclusion.</p>
                    </div>
                  </>
                )}
                <div className="gm-demo-stage-footer">
                  <span>{step + 1} of {STEPS.length} · {coverage.reviewState} observations</span>
                  {step < 2 ? (
                    <button type="button" className="gm-btn gm-btn-primary" onClick={() => setStep((s) => s + 1)}>
                      Continue <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button type="button" className="gm-btn gm-btn-primary" onClick={() => downloadFictionalNote(ruleVisible)}>
                      Download fictional evidence note <Download size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="gm-demo-close" aria-labelledby="gm-demo-close-title">
          <div className="gm-demo-wrap gm-demo-close-inner">
            <div>
              <p className="gm-eyebrow gm-demo-accent">From demonstration to field investigation</p>
              <h2 id="gm-demo-close-title" className="gm-display">Your factory's question may be different.</h2>
              <p>This example illustrates how GridMind intends to investigate. It is not a completed customer case, accredited audit, or proven saving. A real engagement would require defined scope, permissions, secure handling and qualified review.</p>
            </div>
            <Link className="gm-btn gm-btn-primary" to="/" hash="contact">Discuss a problem <ArrowRight size={16} /></Link>
          </div>
        </section>
      </main>
      <footer className="gm-demo-footer">
        <div className="gm-demo-wrap"><span>GridMind · Industrial problem resolution</span><span>Entire example is fictional. No bills uploaded.</span></div>
      </footer>
    </div>
  );
}
