import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/gm/bits";
import {
  authDestination,
  finishGoogleSignIn,
  GoogleProviderError,
  googlePublicConfig,
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
  const [showPassword, setShowPassword] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // SSR displays the form before React attaches its event handlers. Do not
  // accept input that hydration could discard or submit without a listener.
  const [hydrated, setHydrated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const inFlight = useRef(false);
  const callbackWork = useRef<Promise<void> | null>(null);
  useEffect(() => {
    setHydrated(true);
    const callback = googleReturn(window.location.href);
    if (!callback.active && !callbackWork.current) {
      // Supabase persists and refreshes its browser session, but the original
      // /auth route always displayed another login form on a return visit.
      // Reuse an existing *verified* session before asking for credentials.
      let cancelled = false;
      void (async () => {
        try {
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (cancelled) return;
          if (sessionError) throw new Error("Could not restore your saved sign-in. Please try again.");
          if (!data.session) return;

          const { data: verified, error: userError } = await supabase.auth.getUser();
          if (cancelled) return;
          if (userError || verified.user?.id !== data.session.user.id)
            throw new Error("Your saved sign-in could not be verified. Please sign in again.");

          inFlight.current = true;
          setBusy(true);
          await enterWorkspace();
        } catch (err) {
          if (!cancelled) {
            setAwaitingAccess(false);
            setPendingAccess(false);
            setError(err instanceof Error ? err.message : "Could not restore your saved sign-in.");
          }
        } finally {
          if (!cancelled) {
            inFlight.current = false;
            setBusy(false);
            setCheckingSession(false);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }
    setCheckingSession(false);
    let cancelled = false;
    inFlight.current = true;
    setBusy(true);
    setGoogleBusy(true);
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
          setGoogleBusy(false);
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
    setGoogleBusy(true);
    setError(null);
    try {
      const redirectTo = googleRedirect(window.location.origin, destination);
      // Match the generated browser client's public fallback configuration
      // when VITE_* is omitted on previews. Never use server/secret keys here.
      const config = googlePublicConfig({
        url: import.meta.env.VITE_SUPABASE_URL,
        key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      });
      await requireGoogleProvider(config.url, config.key);
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (authError) throw authError;
      // Remain disabled until navigation; browser Back restores via pageshow.
    } catch (err) {
      const message =
        err instanceof GoogleProviderError && err.reason === "provider_disabled"
          ? "Google sign-in is unavailable because Google is not enabled in GridMind's authentication settings. Please use email sign-in while the administrator configures Google."
          : err instanceof GoogleProviderError
            ? "Google sign-in could not be checked right now. Please try again or use email and password."
            : "Google sign-in could not start. Please try again or use email and password.";
      setError(message);
      inFlight.current = false;
      setBusy(false);
      setGoogleBusy(false);
    }
  };
  useEffect(() => {
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) {
        inFlight.current = false;
        setBusy(false);
        setGoogleBusy(false);
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
          <div className="eyebrow">GridMind · Secure access</div>
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
              {checkingSession && (
                <p role="status" className="mb-4 text-sm text-muted-foreground">
                  Checking your saved sign-in…
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                className="mb-5 min-h-11 w-full gap-3 border-[#747775] bg-white px-4 text-sm font-medium text-[#1f1f1f] transition-colors duration-150 hover:border-[#5f6368] hover:bg-[#f6f8fc] hover:text-[#1f1f1f] active:bg-[#edf2f7] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none"
                aria-busy={googleBusy}
                disabled={!hydrated || busy || checkingSession}
                onClick={googleSignIn}
              >
                {googleBusy ? (
                  <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                ) : (
                  <img
                    src="https://developers.google.com/static/identity/images/g-logo.png"
                    alt=""
                    aria-hidden="true"
                    width={20}
                    height={20}
                    className="size-5 shrink-0"
                  />
                )}
                <span>{googleBusy ? "Connecting to Google…" : "Continue with Google"}</span>
              </Button>

              <div className="mb-5 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or use email</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <form method="post" className="grid gap-4" onSubmit={submit}>
                <div className="grid gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    inputMode="email"
                    className="min-h-11"
                    required
                    disabled={!hydrated || busy || checkingSession}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                      minLength={8}
                      className="min-h-11 pr-12"
                      required
                      disabled={!hydrated || busy || checkingSession}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 inline-flex min-w-11 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      disabled={!hydrated || busy || checkingSession}
                      onClick={() => setShowPassword((visible) => !visible)}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" aria-hidden="true" />
                      ) : (
                        <Eye className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
                <Button type="submit" variant="cta" className="min-h-11" disabled={!hydrated || busy || checkingSession}>
                  {busy && !googleBusy ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
                  {busy && !googleBusy ? (mode === "sign-in" ? "Signing in…" : "Creating account…") : mode === "sign-in" ? "Sign in" : "Create account"}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm text-muted-foreground">
                {mode === "sign-in" ? (
                  <button
                    type="button"
                    disabled={!hydrated || busy || checkingSession}
                    className="inline-flex min-h-11 items-center justify-center rounded-sm px-2 font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setMode("sign-up")}
                  >
                    Create an account
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!hydrated || busy || checkingSession}
                    className="inline-flex min-h-11 items-center justify-center rounded-sm px-2 font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          <Link to="/" className="inline-flex min-h-11 items-center justify-center rounded-sm px-2 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Continue with demo mode
          </Link>
        </p>
      </div>
    </div>
  );
}
