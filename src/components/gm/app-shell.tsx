import { STAFF_NAV } from "./dashboard-nav";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  AlertTriangle,
  BadgeIndianRupee,
  Cpu,
  Factory as FactoryIcon,
  LayoutDashboard,
  Lightbulb,
  Play,
  Plus,
  Zap,
} from "lucide-react";
import { DashboardFrame, DashboardBrand as Logo } from "./dashboard-frame";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useEnergy } from "@/lib/energy/store";
import { inrCompact } from "@/lib/energy/format";

const factorySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  location: z.string().trim().max(120),
  sector: z.string().trim().max(120),
  contractDemandKva: z.coerce.number().min(0).max(1e6),
  demandChargePerKva: z.coerce.number().min(0).max(10000),
});

export function AddFactoryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { addFactory } = useEnergy();
  const navigate = useNavigate();
  const [err, setErr] = useState<string | null>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a factory</DialogTitle>
          <DialogDescription>
            Start with the basics from your electricity bill. You can add monthly data next.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = Object.fromEntries(new FormData(e.currentTarget));
            const r = factorySchema.safeParse(fd);
            if (!r.success) return setErr(r.error.issues[0]?.message ?? "Invalid input");
            setErr(null);
            try {
              await addFactory(r.data);
              onOpenChange(false);
              toast.success("Factory added — now enter monthly data");
              navigate({ to: "/factory" });
            } catch (error) {
              const message = error instanceof Error ? error.message : "Factory creation failed";
              setErr(message);
              toast.error("Factory creation failed");
            }
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="name">Factory name</Label>
            <Input id="name" name="name" required maxLength={100} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" maxLength={120} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sector">Sector</Label>
              <Input id="sector" name="sector" maxLength={120} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cd">Contract demand (kVA)</Label>
              <Input id="cd" name="contractDemandKva" type="number" min={0} defaultValue={0} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dc">Demand charge (₹/kVA)</Label>
              <Input id="dc" name="demandChargePerKva" type="number" min={0} defaultValue={400} />
            </div>
          </div>
          {err && <p className="text-sm text-danger">{err}</p>}
          <DialogFooter>
            <Button type="submit" variant="cta">
              Add factory
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { factories, active, setActive, analysis, runAnalysis, authenticated, loading, factoryLoadError } = useEnergy();
  const [addOpen, setAddOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (authenticated && !loading && !active && !factoryLoadError && !addOpen) setAddOpen(true);
  }, [authenticated, loading, active, factoryLoadError, addOpen]);

  const onRun = () => {
    if (!analysis?.hasData) {
      toast.info("Add monthly data first");
      navigate({ to: "/factory" });
      return;
    }
    runAnalysis();
    toast.success(
      `Analysis complete: ${analysis.opportunities.length} opportunities, ${inrCompact(analysis.totalSavingAnnual)}/yr estimated`,
    );
    navigate({ to: "/opportunities" });
  };

  return (
    <DashboardFrame
      links={STAFF_NAV}
      header={
        <div className="flex min-h-16 items-center gap-2 px-4 py-3 sm:px-6">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:flex-1">
            <Select value={active?.id ?? ""} onValueChange={setActive}>
              <SelectTrigger className="h-9 w-[150px] bg-card sm:w-[280px]">
                <SelectValue placeholder="Select factory" />
              </SelectTrigger>
              <SelectContent>
                {factories.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.isDemo ? "Demo · " : ""}
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              className="sm:hidden"
              onClick={() => setAddOpen(true)}
              aria-label="Add factory"
            >
              <Plus />
            </Button>
            <Button
              variant="outline"
              className="hidden sm:inline-flex"
              onClick={() => setAddOpen(true)}
            >
              <Plus /> Add factory
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {loading ? (
              <span role="status" className="text-xs text-muted-foreground">Checking sign-in…</span>
            ) : authenticated ? (
              <Button variant="outline" size="sm" onClick={() => void supabase.auth.signOut()}>
                Sign out
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
            <Button variant="cta" onClick={onRun} className="hidden sm:inline-flex">
              <Play /> Run analysis
            </Button>
          </div>
          <div className="hidden border-l border-border pl-3 text-[10px] text-muted-foreground xl:block">
            <div className="font-semibold text-foreground">
              {analysis?.quality.grade ?? "No data"} quality · {analysis?.quality.score ?? 0}/100
            </div>
            <div>
              {active?.lastAnalyzedAt
                ? `Analysed ${new Date(active.lastAnalyzedAt).toLocaleString()}`
                : "Analysis not yet recorded"}
            </div>
          </div>
        </div>
      }
      floating={
        <Button
          variant="cta"
          onClick={onRun}
          className="fixed bottom-20 right-4 z-30 rounded-full sm:hidden"
        >
          <Play /> Run analysis
        </Button>
      }
      footer={<AddFactoryDialog open={addOpen} onOpenChange={setAddOpen} />}
      sidebarFooter={
        <>
          <div className="mb-1 font-semibold text-rail-foreground">
            Factory Performance Intelligence
          </div>
          Estimates remain potential until a measured baseline and post-intervention comparison are
          accepted.
        </>
      }
    >
      {factoryLoadError ? (
        <section className="mx-auto max-w-2xl py-16" role="alert">
          <div className="panel border border-warning/30 p-8 text-center">
            <h1 className="text-xl font-semibold">Factory records are temporarily unavailable</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{factoryLoadError}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Your account access and your factory-data connection are separate. No new factory was created.
            </p>
          </div>
        </section>
      ) : authenticated && !active ? (
        <section className="mx-auto max-w-2xl py-16">
          <div className="panel p-8 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-cta/10 text-cta">
              <FactoryIcon className="size-6" />
            </div>
            <div className="eyebrow">Workspace setup</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Create your first factory
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Your account is authenticated, but it has no factory membership yet. Create the
              factory workspace before entering operational data. GridMind will keep this workspace
              private and factory-scoped.
            </p>
            <Button variant="cta" className="mt-6" onClick={() => setAddOpen(true)}>
              <Plus /> Create factory
            </Button>
          </div>
        </section>
      ) : (
        children
      )}
    </DashboardFrame>
  );
}
