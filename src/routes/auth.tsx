import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/gm/bits";
import {
  authDestination,
  finishGoogleSignIn,
  googleRedirect,
  googleReturn,
  workspaceDestination,
  requireGoogleProvider,
} from "@/lib/auth/google";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — GridMind" },
      {
        name: "description",
        content: "Sign in to access your private GridMind factory workspace.",
      },
    ],
  }),
  validateSearch: (
    search: Record<string, unknown>,
  ): { destination?: "customer" | "team"; oauth?: "google" } => ({
    destination: authDestination(search.destination),
    oauth: search.oauth === "google" ? ("google" as const) : undefined,
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { destination } = Route.useSearch();
  const [awaitingAccess, setAwaitingAccess] = useState(false);
  const [pendingAccess, setPendingAccess] = useState(false);
  const enterWorkspace = useCallback(async () => {
    setAwaitingAccess(true);
    const { portalCall } = await import("@/lib/investigation/portal-client");
    const principal = await portalCall<import("@/lib/investigation/portal-contract").Principal>({
      action: "principal",
    });
    const target = workspaceDestination(principal, destination);
    if (!target) {
      setPendingAccess(true);
      return;
    }
    await navigate({ to: target });
  }, [destination, navigate]);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // SSR displays the form before React attaches its event handlers. Do not
  // accept input that hydration could discard or submit without a listener.
  const [hydrated, setHydrated] = useState(false);
  const inFlight = useRef(false);
  const callbackWork = useRef<Promise<void> | null>(null);
  useEffect(() => {
    setHydrated(true);
    const callback = googleReturn(window.location.href);
    if (!callback.active && !callbackWork.current) return;
    let cancelled = false;
    inFlight.current = true;
    setBusy(true);
    // Reuse SDK initialization on StrictMode effect replay.
    callbackWork.current ??= finishGoogleSignIn(supabase.auth, callback).finally(() => {
      const clean = new URL("/auth", window.location.origin);
      if (destination) clean.searchParams.set("destination", destination);
      window.history.replaceState(window.history.state, "", clean.pathname + clean.search);
    });
    void callbackWork.current
      .then(async () => {
        if (!cancelled) await enterWorkspace();
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Google sign-in failed. Please try again.");
      })
      .finally(() => {
        if (!cancelled) {
          inFlight.current = false;
          setBusy(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [destination, enterWorkspace]);

  const googleSignIn = async () => {
    if (!hydrated || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      const redirectTo = googleRedirect(window.location.origin, destination);
      await requireGoogleProvider(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      );
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (authError) throw authError;
      // Remain disabled until navigation; browser Back restores via pageshow.
    } catch {
      setError("Google sign-in is unavailable. Try again or use email and password.");
      inFlight.current = false;
      setBusy(false);
    }
  };
  useEffect(() => {
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) {
        inFlight.current = false;
        setBusy(false);
      }
    };
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);

  const retryAccess = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await enterWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Workspace access could not be checked.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const signOut = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signOut();
      if (authError) throw authError;
      setAwaitingAccess(false);
      setPendingAccess(false);
    } catch {
      setError("Sign out failed. Please try again.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!hydrated || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);

    try {
      if (mode === "sign-in") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        toast.success("Signed in");
        await enterWorkspace();
      } else {
        const { data, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;
        if (!data.session) {
          toast.success("Account created. Check your email to confirm your account, then sign in.");
          setMode("sign-in");
        } else {
          toast.success("Account created");
          await enterWorkspace();
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <div className="eyebrow">GridMind</div>
          <h1 className="mt-2 text-3xl font-semibold">Your GridMind workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to continue with your cases and authorized workspace.
          </p>
        </div>

        <Panel
          title={mode === "sign-in" ? "Sign in" : "Create account"}
          desc={
            mode === "sign-in"
              ? "Your factory data stays behind authenticated, factory-scoped access."
              : "Create an account. Workspace access requires an authorized invitation or membership."
          }
        >
          {error && (
            <p role="alert" className="mb-4 text-sm text-danger">
              {error}
            </p>
          )}
          {awaitingAccess ? (
            <div className="grid gap-4">
              <p role="status" className="text-sm text-muted-foreground">
                {pendingAccess
                  ? "Access pending. Your account is signed in, but has no assigned workspace access. Ask your GridMind owner to grant access."
                  : "Checking your authorized workspace access. If this is unavailable, retry or sign out."}
              </p>
              <Button type="button" disabled={busy} onClick={retryAccess}>
                Check access again
              </Button>
              <Button type="button" variant="outline" disabled={busy} onClick={signOut}>
                Sign out
              </Button>
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="mb-4 w-full"
                aria-busy={busy}
                disabled={!hydrated || busy}
                onClick={googleSignIn}
              >
                Continue with Google
              </Button>
              <form method="post" className="grid gap-4" onSubmit={submit}>
                <div className="grid gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={!hydrated || busy}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                    minLength={8}
                    required
                    disabled={!hydrated || busy}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <Button type="submit" variant="cta" disabled={!hydrated || busy}>
                  {busy ? "Working…" : mode === "sign-in" ? "Sign in" : "Create account"}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm text-muted-foreground">
                {mode === "sign-in" ? (
                  <button
                    type="button"
                    disabled={!hydrated || busy}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                    onClick={() => setMode("sign-up")}
                  >
                    Create an account
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!hydrated || busy}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                    onClick={() => setMode("sign-in")}
                  >
                    Already have an account? Sign in
                  </button>
                )}
              </div>
            </>
          )}
        </Panel>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          <Link to="/" className="underline underline-offset-4">
            Continue with demo mode
          </Link>
        </p>
      </div>
    </div>
  );
}
