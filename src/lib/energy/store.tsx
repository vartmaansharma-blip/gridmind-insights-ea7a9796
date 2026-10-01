import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { analyze, type Analysis } from "./analysis";
import { createDemoFactory, DEMO_FACTORY_ID } from "./demo-data";
import type { Factory, OpportunityStatus } from "./types";

// Local persistence for the MVP. Swap this provider for a backend-backed one later.
const KEY = "gridmind:v1";

type State = { factories: Factory[]; activeId: string | null };

type Ctx = {
  factories: Factory[];
  active: Factory | null;
  analysis: Analysis | null;
  setActive: (id: string) => void;
  addFactory: (f: Pick<Factory, "name" | "location" | "sector" | "contractDemandKva" | "demandChargePerKva">) => string;
  updateFactory: (id: string, fn: (f: Factory) => Factory) => void;
  deleteFactory: (id: string) => void;
  loadDemo: () => void;
  runAnalysis: () => void;
  setOppStatus: (oppId: string, s: OpportunityStatus) => void;
};

const StoreCtx = createContext<Ctx | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);
export { uid };

export function EnergyStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ factories: [createDemoFactory()], activeId: DEMO_FACTORY_ID });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as State;
        if (Array.isArray(parsed.factories)) setState(parsed);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const active = state.factories.find((f) => f.id === state.activeId) ?? state.factories[0] ?? null;
  const analysis = useMemo(() => (active ? analyze(active) : null), [active]);

  const updateFactory = useCallback((id: string, fn: (f: Factory) => Factory) => {
    setState((s) => ({ ...s, factories: s.factories.map((f) => (f.id === id ? fn(f) : f)) }));
  }, []);

  const value: Ctx = {
    factories: state.factories,
    active,
    analysis,
    setActive: (id) => setState((s) => ({ ...s, activeId: id })),
    addFactory: (input) => {
      const id = uid();
      const f: Factory = {
        id, ...input, productUnit: "unit", isDemo: false, months: [], equipment: [], interventions: [], opportunityStatus: {},
      };
      setState((s) => ({ factories: [...s.factories, f], activeId: id }));
      return id;
    },
    updateFactory,
    deleteFactory: (id) =>
      setState((s) => {
        const factories = s.factories.filter((f) => f.id !== id);
        return { factories, activeId: factories[0]?.id ?? null };
      }),
    loadDemo: () =>
      setState((s) => ({
        factories: [createDemoFactory(), ...s.factories.filter((f) => f.id !== DEMO_FACTORY_ID)],
        activeId: DEMO_FACTORY_ID,
      })),
    runAnalysis: () => {
      if (active) updateFactory(active.id, (f) => ({ ...f, lastAnalyzedAt: new Date().toISOString() }));
    },
    setOppStatus: (oppId, st) => {
      if (active) updateFactory(active.id, (f) => ({ ...f, opportunityStatus: { ...f.opportunityStatus, [oppId]: st } }));
    },
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useEnergy() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useEnergy must be used inside EnergyStoreProvider");
  return c;
}
