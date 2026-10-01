import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AlertTriangle, BadgeIndianRupee, Factory as FactoryIcon, LayoutDashboard, Lightbulb, Play, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEnergy } from "@/lib/energy/store";
import { inrCompact } from "@/lib/energy/format";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/energy", label: "Energy", icon: Zap },
  { to: "/opportunities", label: "Opportunities", icon: Lightbulb },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/savings", label: "Savings", icon: BadgeIndianRupee },
  { to: "/factory", label: "Factory data", icon: FactoryIcon },
] as const;

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid size-8 grid-cols-2 gap-0.5 rounded-md bg-cta p-1.5">
        <span className="rounded-[2px] bg-cta-foreground" />
        <span className="rounded-[2px] bg-cta-foreground/40" />
        <span className="rounded-[2px] bg-cta-foreground/40" />
        <span className="rounded-[2px] bg-cta-foreground" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold">GridMind</div>
        <div className="text-[10px] uppercase tracking-[0.14em] opacity-60">Factory Energy Intelligence</div>
      </div>
    </div>
  );
}

const factorySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  location: z.string().trim().max(120),
  sector: z.string().trim().max(120),
  contractDemandKva: z.coerce.number().min(0).max(1e6),
  demandChargePerKva: z.coerce.number().min(0).max(10000),
});

export function AddFactoryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { addFactory } = useEnergy();
  const navigate = useNavigate();
  const [err, setErr] = useState<string | null>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a factory</DialogTitle>
          <DialogDescription>Start with the basics from your electricity bill. You can add monthly data next.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = Object.fromEntries(new FormData(e.currentTarget));
            const r = factorySchema.safeParse(fd);
            if (!r.success) return setErr(r.error.issues[0]?.message ?? "Invalid input");
            addFactory(r.data);
            onOpenChange(false);
            setErr(null);
            toast.success("Factory added — now enter monthly data");
            navigate({ to: "/factory" });
          }}
        >
          <div className="grid gap-1.5"><Label htmlFor="name">Factory name</Label><Input id="name" name="name" required maxLength={100} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label htmlFor="location">Location</Label><Input id="location" name="location" maxLength={120} /></div>
            <div className="grid gap-1.5"><Label htmlFor="sector">Sector</Label><Input id="sector" name="sector" maxLength={120} /></div>
            <div className="grid gap-1.5"><Label htmlFor="cd">Contract demand (kVA)</Label><Input id="cd" name="contractDemandKva" type="number" min={0} defaultValue={0} /></div>
            <div className="grid gap-1.5"><Label htmlFor="dc">Demand charge (₹/kVA)</Label><Input id="dc" name="demandChargePerKva" type="number" min={0} defaultValue={400} /></div>
          </div>
          {err && <p className="text-sm text-danger">{err}</p>}
          <DialogFooter><Button type="submit" variant="cta">Add factory</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { factories, active, setActive, analysis, runAnalysis } = useEnergy();
  const [addOpen, setAddOpen] = useState(false);
  const navigate = useNavigate();

  const onRun = () => {
    if (!analysis?.hasData) {
      toast.info("Add monthly data first");
      navigate({ to: "/factory" });
      return;
    }
    runAnalysis();
    toast.success(`Analysis complete: ${analysis.opportunities.length} opportunities, ${inrCompact(analysis.totalSavingAnnual)}/yr estimated`);
    navigate({ to: "/opportunities" });
  };

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-rail p-4 text-rail-foreground lg:flex">
        <Logo />
        <nav className="mt-8 grid gap-0.5">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-rail-muted transition-colors hover:bg-rail-active hover:text-rail-foreground"
              activeProps={{ className: "bg-rail-active !text-rail-foreground font-medium" }}>
              <n.icon className="size-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-lg border border-sidebar-border p-3 text-xs text-rail-muted">
          Validation MVP. All savings are engineering estimates until verified with metered data.
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="flex items-center gap-2 px-4 py-3 sm:px-6">
          <div className="lg:hidden"><Logo /></div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:flex-1">
            <Select value={active?.id ?? ""} onValueChange={setActive}>
              <SelectTrigger className="h-9 w-[150px] bg-card sm:w-[280px]"><SelectValue placeholder="Select factory" /></SelectTrigger>
              <SelectContent>
                {factories.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.isDemo ? "Demo · " : ""}{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="sm:hidden" onClick={() => setAddOpen(true)} aria-label="Add factory"><Plus /></Button>
            <Button variant="outline" className="hidden sm:inline-flex" onClick={() => setAddOpen(true)}><Plus /> Add factory</Button>
          </div>
          <Button variant="cta" onClick={onRun} className="hidden sm:inline-flex"><Play /> Run analysis</Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">{children}</main>

      <Button variant="cta" onClick={onRun} className="fixed bottom-20 right-4 z-30 rounded-full sm:hidden"><Play /> Run analysis</Button>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-sidebar-border bg-rail lg:hidden">
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }}
            className="flex flex-col items-center gap-1 py-2.5 text-[10px] text-rail-muted"
            activeProps={{ className: "!text-cta" }}>
            <n.icon className="size-5" /> <span className="truncate">{n.label.split(" ")[0]}</span>
          </Link>
        ))}
      </nav>
      <AddFactoryDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
