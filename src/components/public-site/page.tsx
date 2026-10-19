import { Link } from "@tanstack/react-router";
import mark from "@/assets/gridmind-mark.png";
import "./site.css";

export type PublicPageKey = "problem" | "how-it-works" | "example" | "about" | "contact";
const pages: Record<PublicPageKey, { label: string; title: string; intro: string; detail: string }> = {
  "problem": { label: "The problem", title: "Electricity costs need context", intro: "Demand charges, power factor and tariff category can raise questions that a single bill cannot settle.", detail: "GridMind starts with the document, the contract, the applicable tariff provisions and the operating context. We distinguish a recorded figure from an actual billing error or recoverable cost." },
  "how-it-works": { label: "How it works", title: "From documents to a defensible next step", intro: "An assisted investigation, not automated machine diagnosis.", detail: "Agree a narrow question and evidence-handling terms. Reconcile the bills and source records. Identify open questions. Ask a qualified electrical or tariff specialist to review what needs expertise. Deliver a scoped brief with limitations and recommended next checks." },
  "example": { label: "Example investigation", title: "Follow a fictional electricity-bill question", intro: "An illustration of the evidence-first workflow, not a customer result.", detail: "A fictional bill shows a recorded maximum demand higher than the stated contract demand. That difference prompts verification against the applicable tariff and historical records; it does not establish an error, penalty or saving." },
  "about": { label: "About GridMind", title: "Evidence first. Infrastructure intelligence over time.", intro: "GridMind begins with human-reviewed electricity-cost investigations for factories.", detail: "The longer-term ambition is an industrial intelligence layer that connects operating evidence across physical systems. That future vision is not a currently delivered product, and we will expand only as customer needs and verified capabilities justify it." },
  "contact": { label: "Contact", title: "Start with one electricity-cost question", intro: "Tell GridMind what your factory needs to understand before sharing confidential records.", detail: "We first determine whether a bounded review is appropriate. Do not upload confidential plant information through public channels. Requests enter a private, permissioned workflow and do not constitute a completed technical assessment." },
};
const navigation: { to: "/" | "/problem" | "/how-it-works" | "/example" | "/about" | "/contact"; label: string }[] = [
  { to: "/", label: "Home" }, { to: "/problem", label: "The problem" },
  { to: "/how-it-works", label: "How it works" }, { to: "/example", label: "Example" },
  { to: "/about", label: "About" }, { to: "/contact", label: "Contact" },
];
export function PublicPage({ page }: { page: PublicPageKey }) {
 const current = pages[page];
 return <div className="gm-site min-h-screen" style={{ background:"var(--gm-ink)", color:"var(--gm-text)" }}>
  <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50" style={{ background:"var(--gm-brand-green)", color:"var(--gm-brand-green-foreground)" }}>Skip to content</a>
  <header className="border-b gm-rule-d">
   <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-6 px-5 py-5 md:px-10">
    <Link to="/" className="flex items-center gap-3 gm-display text-xl font-semibold"><img src={mark} alt="" width={30} height={30} />GridMind</Link>
    <nav aria-label="Public navigation" className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
     {navigation.map(item=><Link key={item.to} to={item.to} aria-current={item.to===`/${page}`?"page":undefined} className="hover:underline underline-offset-4">{item.label}</Link>)}
    </nav>
    <Link to="/auth" className="gm-btn gm-btn-primary !px-4 !py-2">Sign in ↗</Link>
   </div>
  </header>
  <main id="content" className="mx-auto max-w-[1320px] px-5 py-24 md:px-10 md:py-36">
   <p className="gm-eyebrow" style={{color:"var(--gm-brand-green)"}}>{current.label} · GridMind</p>
   <h1 className="gm-display mt-5 max-w-[58rem] text-[clamp(2.7rem,6vw,5rem)] font-semibold leading-[1.04]">{current.title}</h1>
   <p className="mt-8 max-w-[50rem] text-xl leading-relaxed gm-muted-d">{current.intro}</p>
   <div className="mt-14 max-w-[50rem] border-t pt-8 gm-rule-d"><p className="text-lg leading-relaxed">{current.detail}</p></div>
   {page==="example" && <Link to="/" hash="example" className="gm-btn gm-btn-primary mt-12">Explore the fictional interactive example ↗</Link>}
   {page==="contact" ? <div className="mt-12"><Link to="/cases" className="gm-btn gm-btn-primary">Request a private conversation ↗</Link><p className="mt-4 text-sm gm-muted-d">Existing customers can sign in to their private case workspace.</p></div>
   : <Link to="/contact" className="gm-btn gm-btn-primary mt-12">Discuss an electricity review ↗</Link>}
  </main>
  <footer className="border-t px-5 py-8 gm-rule-d md:px-10"><div className="mx-auto flex max-w-[1320px] flex-wrap gap-5 text-sm gm-muted-d">
   {navigation.map(item=><Link key={item.to} to={item.to} className="hover:underline">{item.label}</Link>)}
   <span>Evidence-led · Qualified review · No guaranteed savings</span></div></footer>
 </div>
}
