import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { analyze, type Analysis } from "./analysis";
import { createDemoFactory, DEMO_FACTORY_ID } from "./demo-data";
import type { Factory, OpportunityStatus } from "./types";
import { supabase } from "@/integrations/supabase/client";
import {
  createFactoryWorkspace,
  getAuthenticatedFactorySnapshots,
  recordFactoryObservation,
  syncFactoryAssets,
  updateFactoryProfile,
  updateOpportunityStatus,
} from "@/lib/gridmind/repository";

/**
 * Canonical application state boundary.
 *
 * Important:
 * - Supabase is authoritative for authenticated factories.
 * - The demo factory exists only in memory and is explicitly synthetic.
 * - localStorage is intentionally not used for operational, economic, or
 *   factory state.
 * - Observation edits are append-only records; the repository resolves the
 *   latest manual entry for each entry key.
 */

type State = {
  factories: Factory[];
  activeId: string | null;
  authenticated: boolean;
  loading: boolean;
};

type Ctx = {
  factories: Factory[];
  active: Factory | null;
  analysis: Analysis | null;
  authenticated: boolean;
  loading: boolean;
  setActive: (id: string) => void;
  addFactory: (f: Pick<Factory, "name" | "location" | "sector" | "contractDemandKva" | "demandChargePerKva">) => Promise<void>;
  updateFactory: (id: string, fn: (f: Factory) => Factory) => void;
  deleteFactory: (id: string) => void;
  loadDemo: () => void;
  runAnalysis: () => void;
  setOppStatus: (oppId: string, s: OpportunityStatus) => void;
};

const StoreCtx = createContext<Ctx | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);
export { uid };

const metricMap = {
  kwh: ["energy_kwh", "kWh"],
  cost: ["energy_cost_inr", "INR"],
  peakKva: ["peak_kva", "kVA"],
  production: ["production_units", "unit"],
  operatingHours: ["operating_hours", "hour"],
  powerFactor: ["power_factor", "ratio"],
} as const;

const monthBounds = (month: string) => {
  const start = new Date(`${month}-01T00:00:00+05:30`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
};

function snapshotToFactory(snapshot: Awaited<ReturnType<typeof getAuthenticatedFactorySnapshots>>[number]): Factory {
  const metadata = new Map<string, { value: number; createdAt: string }>();
  for (const o of snapshot.observations) {
    const key = typeof o.metadata.entry_key === "string" ? o.metadata.entry_key : null;
    if (!key || o.valueNumeric === null) continue;
    if (!metadata.has(key) || metadata.get(key)!.createdAt < o.createdAt) {
      metadata.set(key, { value: o.valueNumeric, createdAt: o.createdAt });
    }
  }

  const monthsByKey = new Map<string, Record<string, number | string>>();
  for (const item of metadata) {
    const [month, metric] = item[0].split(":");
    if (!month || !metric) continue;
    const row = monthsByKey.get(month) ?? { month };
    row[metric] = item[1].value;
    monthsByKey.set(month, row);
  }

  const months = [...monthsByKey.values()]
    .sort((a, b) => String(a.month).localeCompare(String(b.month)))
    .map((row) => ({
      month: String(row.month),
      // NaN is the in-memory sentinel for an absent metric. persistFactory skips
      // non-finite values, so missing data never becomes a recorded zero.
      kwh: row.kwh === undefined ? Number.NaN : Number(row.kwh),
      cost: row.cost === undefined ? Number.NaN : Number(row.cost),
      peakKva: row.peakKva === undefined ? Number.NaN : Number(row.peakKva),
      production: row.production === undefined ? Number.NaN : Number(row.production),
      operatingHours: row.operatingHours === undefined ? Number.NaN : Number(row.operatingHours),
      ...(row.powerFactor !== undefined ? { powerFactor: Number(row.powerFactor) } : {}),
    }));

  const profile = snapshot.metadata;

  const interventions = snapshot.interventions.map((iv) => ({
    id: String(iv.id),
    title: iv.description ?? "GridMind intervention",
    opportunityId: iv.opportunityId ? String(iv.opportunityId) : undefined,
    implementedMonth: iv.status === "implemented" && iv.factoryId ? new Date().toISOString().slice(0, 7) : "",
    cost: Number(iv.implementationCost ?? 0),
  })).filter((iv) => iv.implementedMonth);

  return {
    id: String(snapshot.factoryId),
    organizationId: snapshot.organizationId,
    name: snapshot.name,
    location: snapshot.location ?? "",
    sector: snapshot.industry ?? "",
    productUnit: typeof profile.productUnit === "string" ? profile.productUnit : "unit",
    contractDemandKva: Number(profile.contractDemandKva ?? 0),
    demandChargePerKva: Number(profile.demandChargePerKva ?? 0),
    isDemo: false,
    months,
    equipment: snapshot.assets.map((a) => ({
      id: String(a.id),
      name: a.name,
      category: "other",
      ratedKw: Number(a.ratedPowerKw ?? 0),
      quantity: 1,
      hoursPerMonth: 0,
      loadFactor: 0,
    })),
    interventions,
    opportunityStatus: Object.fromEntries(snapshot.opportunities.map((o) => [String(o.id), o.status as OpportunityStatus])),
  };
}

async function persistFactory(factory: Factory) {
  if (factory.isDemo) return;

  const factoryId = Number(factory.id);
  if (!Number.isFinite(factoryId)) return;

  await updateFactoryProfile(factoryId, {
    name: factory.name,
    location: factory.location,
    industry: factory.sector,
    metadata: {
      contractDemandKva: factory.contractDemandKva,
      demandChargePerKva: factory.demandChargePerKva,
      productUnit: factory.productUnit,
      application_contract_version: 2,
    },
  });

  await syncFactoryAssets(factoryId, factory.equipment);

  for (const month of factory.months) {
    const { start, end } = monthBounds(month.month);
    for (const [field, [metric, unit]] of Object.entries(metricMap) as Array<[keyof typeof metricMap, readonly [string, string]]>) {
      const value = month[field];
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      if (field === "powerFactor" && value === 0) continue;
      await recordFactoryObservation({
        factoryId,
        metric,
        unit,
        value,
        observedAt: start,
        observedUntil: end,
        entryKey: `${month.month}:${field}`,
      });
    }
  }
}

export function EnergyStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({
    factories: [createDemoFactory()],
    activeId: DEMO_FACTORY_ID,
    authenticated: false,
    loading: true,
  });
  const persistTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    let cancelled = false;

    const loadForSession = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (cancelled) return;

        if (!sessionData.session) {
          setState({ factories: [createDemoFactory()], activeId: DEMO_FACTORY_ID, authenticated: false, loading: false });
          return;
        }

        const snapshots = await getAuthenticatedFactorySnapshots();
        if (cancelled) return;
        const factories = snapshots.map(snapshotToFactory);
        setState({
          factories,
          activeId: factories[0]?.id ?? null,
          authenticated: true,
          loading: false,
        });
      } catch (error) {
        console.error("[GridMind] canonical factory load failed", error);
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
      }
    };

    void loadForSession();
    const { data: authSubscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") void loadForSession();
      if (event === "SIGNED_OUT") {
        setState({ factories: [createDemoFactory()], activeId: DEMO_FACTORY_ID, authenticated: false, loading: false });
      }
    });

    return () => {
      cancelled = true;
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => () => {
    for (const timer of persistTimers.current.values()) clearTimeout(timer);
  }, []);

  const active = state.factories.find((f) => f.id === state.activeId) ?? state.factories[0] ?? null;
  const analysis = useMemo(() => (active ? analyze(active) : null), [active]);

  const schedulePersist = useCallback((factory: Factory) => {
    if (factory.isDemo) return;
    const existing = persistTimers.current.get(factory.id);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      void persistFactory(factory).catch((error) => {
        console.error("[GridMind] canonical factory write failed", error);
      });
      persistTimers.current.delete(factory.id);
    }, 600);
    persistTimers.current.set(factory.id, timer);
  }, []);

  const updateFactory = useCallback((id: string, fn: (f: Factory) => Factory) => {
    setState((s) => {
      const factories = s.factories.map((f) => {
        if (f.id !== id) return f;
        const next = fn(f);
        schedulePersist(next);
        return next;
      });
      return { ...s, factories };
    });
  }, [schedulePersist]);

  const value: Ctx = {
    factories: state.factories,
    active,
    analysis,
    authenticated: state.authenticated,
    loading: state.loading,
    setActive: (id) => setState((s) => ({ ...s, activeId: id })),
    addFactory: async (input) => {
      const factoryId = await createFactoryWorkspace(input);
      const snapshots = await getAuthenticatedFactorySnapshots();
      const factories = snapshots.map(snapshotToFactory);
      const created = factories.find((factory) => factory.id === String(factoryId));
      if (!created) {
        throw new Error("Factory was created but is not visible through the authenticated workspace. Check factory membership and RLS.");
      }
      setState({ factories, activeId: created.id, authenticated: true, loading: false });
    },
    updateFactory,
    deleteFactory: () => {
      console.warn("[GridMind] factory deletion is intentionally disabled until lifecycle semantics are implemented.");
    },
    loadDemo: () => setState((s) => ({
      ...s,
      factories: [createDemoFactory(), ...s.factories.filter((f) => f.id !== DEMO_FACTORY_ID)],
      activeId: DEMO_FACTORY_ID,
    })),
    runAnalysis: () => {
      if (active) updateFactory(active.id, (f) => ({ ...f, lastAnalyzedAt: new Date().toISOString() }));
    },
    setOppStatus: (oppId, status) => {
      const id = Number(oppId);
      if (!Number.isInteger(id)) {
        console.warn("[GridMind] ignored non-canonical opportunity id", oppId);
        return;
      }
      void updateOpportunityStatus(id, status).catch((error) => console.error("[GridMind] canonical opportunity update failed", error));
      setState((s) => ({
        ...s,
        factories: s.factories.map((f) => f.id === active?.id ? { ...f, opportunityStatus: { ...f.opportunityStatus, [oppId]: status } } : f),
      }));
    },
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useEnergy() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useEnergy must be used inside EnergyStoreProvider");
  return c;
}
