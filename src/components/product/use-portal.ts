import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { portalCall } from "@/lib/investigation/portal-client";
import type {
  PortalCommand,
  PortalList,
  Principal,
  Intake,
} from "@/lib/investigation/portal-contract";
export function usePortal(demo: boolean) {
  const [ready, setReady] = useState(false),
    [signedIn, setSignedIn] = useState(demo),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [version, setVersion] = useState(0);
  const [principal, setPrincipal] = useState<Principal>({ factories: [], isCustomer: false }),
    [cases, setCases] = useState<PortalList["cases"]>([]),
    [requests, setRequests] = useState<Intake[]>([]);
  const retry = useRef<PortalCommand | null>(null);
  const refresh = useCallback(async () => {
    const [p, c, r] = await Promise.all([
      portalCall<Principal>({ action: "principal" }, demo),
      portalCall<PortalList>({ action: "list" }, demo),
      portalCall<{ requests: Intake[] }>({ action: "intakeList" }, demo),
    ]);
    setPrincipal(p);
    setCases(c.cases);
    setRequests(r.requests);
    setVersion((v) => v + 1);
  }, [demo]);
  useEffect(() => {
    let active = true;
    if (demo) {
      setSignedIn(true);
      setReady(true);
      void refresh().catch((e) => active && setError(e.message));
      return () => {
        active = false;
      };
    }
    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        setSignedIn(!!data.session);
        if (data.session) await refresh();
      } catch {
        if (active) setError("Workspace could not be loaded. Sign in or explore the sample.");
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [demo, refresh]);
  const run = async (command: PortalCommand) => {
    retry.current = command;
    setBusy(true);
    try {
      const result = await portalCall(command, demo);
      await refresh();
      setError("");
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      throw e;
    } finally {
      setBusy(false);
    }
  };
  const safe = async (action: () => Promise<unknown>) => {
    try {
      await action();
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  };
  return {
    ready,
    signedIn,
    busy,
    error,
    setError,
    principal,
    cases,
    requests,
    version,
    run,
    safe,
    refresh,
    retry,
  };
}
