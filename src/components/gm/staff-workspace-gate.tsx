import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { portalCall } from "@/lib/investigation/portal-client";
import type { Principal } from "@/lib/investigation/portal-contract";
import { isStaffPrincipal } from "@/lib/auth/workspace-routing";

/**
 * A frontend rendering guard only. Factory RLS and portal permissions remain
 * the authoritative access controls for every network request.
 * SSR renders no private material while the signed-in identity is checked.
 */
export function StaffWorkspaceGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"checking" | "allowed" | "signed_out" | "denied" | "unavailable">("checking");
  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const user = await supabase.auth.getUser();
        if (!active) return;
        if (user.error || !user.data.user) { setStatus("signed_out"); return; }
        const principal = await portalCall<Principal>({ action: "principal" });
        if (active) setStatus(isStaffPrincipal(principal) ? "allowed" : "denied");
      } catch {
        if (active) setStatus("unavailable");
      }
    };
    void check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      if (active) { setStatus("checking"); void check(); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  if (status === "allowed") return <>{children}</>;
  if (status === "checking") return <main className="mx-auto max-w-lg p-10" role="status">Checking authorized factory access…</main>;
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-6 py-14">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">GridMind · Workspace access</p>
      <h1 className="text-2xl font-semibold">
        {status === "signed_out" ? "Sign in to continue" :
          status === "unavailable" ? "Factory access could not be verified" : "This workspace is for authorized factory staff"}
      </h1>
      <p className="text-sm leading-6 text-muted-foreground">
        {status === "unavailable"
          ? "The secure access service is currently unavailable. No factory records are shown until your permissions can be verified."
          : "A customer account does not automatically provide access to internal energy and machine workspaces. A GridMind team member must approve access."}
      </p>
      <div className="flex flex-wrap gap-4 text-sm">
        <Link to="/auth" search={{ destination: status === "signed_out" ? "team" : "customer" }} className="font-semibold underline">Sign in</Link>
        <Link to="/onboarding" className="font-semibold underline">Your factory connection</Link>
        <Link to="/" className="font-semibold underline">Public homepage</Link>
      </div>
    </main>
  );
}
