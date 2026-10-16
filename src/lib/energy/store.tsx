import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { analyze, type Analysis } from "./analysis";
import { createDemoFactory, DEMO_FACTORY_ID } from "./demo-data";
import type { CanonicalOpportunityStatus } from "../gridmind/opportunity-status";
import type { Factory } from "./types";
import { snapshotToFactory } from "./factory-snapshot";
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
  refresh: () => Promise<void>;
  setActive: (id: string) => void;
  addFactory: (f: Pick<Factory, "name" | "location" | "sector" | "contractDemandKva" | "demandChargePerKva">) => Promise<void>;
  updateFactory: (id: string, fn: (f: Factory) => Factory) => void;
  deleteFactory: (id: string) => void;
  loadDemo: () => void;
  runAnalysis: () => void;
  setOppStatus: (oppId: string, s: CanonicalOpportunityStatus) => void;
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
      await recordFactoryObservation({
        factoryId,
        metric,
        unit,
        value: typeof value === "number" && Number.isFinite(value) ? value : null,
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
  const persistQueues = useRef(new Map<string, Promise<void>>());
  const pendingOpportunityWrites = useRef(0);
  const editGeneration = useRef(0);

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
      // Serialize writes per factory so a slower, older request cannot finish
      // after a newer edit and overwrite it. A failed write is visible to the
      // user instead of silently leaving the screen's optimistic state unsaved.
      const previous = persistQueues.current.get(factory.id) ?? Promise.resolve();
      const current = previous
        .catch(() => undefined)
        .then(() => persistFactory(factory));
      persistQueues.current.set(factory.id, current);
      void current.catch((error) => {
        console.error("[GridMind] canonical factory write failed", error);
        toast.error("GridMind couldn't save these changes. Check your connection and permissions, then try again.");
      }).finally(() => {
        if (persistQueues.current.get(factory.id) === current) {
          persistQueues.current.delete(factory.id);
        }
      });
      persistTimers.current.delete(factory.id);
    }, 600);
    persistTimers.current.set(factory.id, timer);
  }, []);

  const updateFactory = useCallback((id: string, fn: (f: Factory) => Factory) => {
    editGeneration.current += 1;
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

  // Refetch from the authenticated, RLS-scoped source without navigating or
  // replacing unsaved optimistic edits. The selected factory is preserved.
  const refresh = useCallback(async () => {
    const generation = editGeneration.current;
    if (persistTimers.current.size || persistQueues.current.size || pendingOpportunityWrites.current) {
      throw new Error("Please wait until your changes finish saving before refreshing.");
    }
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!sessionData.session) {
      throw new Error("Your session has ended. Sign in again to refresh your factory.");
    }
    const snapshots = await getAuthenticatedFactorySnapshots();
    if (editGeneration.current !== generation ||
        persistTimers.current.size || persistQueues.current.size || pendingOpportunityWrites.current) {
      throw new Error("Your data changed during refresh. Try again after it finishes saving.");
    }
    const refreshed = snapshots.map(snapshotToFactory);
    setState((prev) => {
      // A sign-out that races the network response must never restore old data.
      if (!prev.authenticated) return prev;
      return {
        ...prev,
        factories: refreshed,
        activeId: refreshed.some((factory) => factory.id === prev.activeId)
          ? prev.activeId
          : refreshed[0]?.id ?? null,
        loading: false,
      };
    });
  }, []);

  const value: Ctx = {
    factories: state.factories,
    active,
    analysis,
    authenticated: state.authenticated,
    loading: state.loading,
    refresh,
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
      editGeneration.current += 1;
      pendingOpportunityWrites.current += 1;
      void updateOpportunityStatus(id, status)
        .catch((error) => console.error("[GridMind] canonical opportunity update failed", error))
        .finally(() => { pendingOpportunityWrites.current -= 1; });
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
