import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/gm/bits";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — GridMind" },
      { name: "description", content: "Sign in to access your private GridMind factory workspace." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // SSR displays the form before React attaches its event handlers. Do not
  // accept input that hydration could discard or submit without a listener.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      if (mode === "sign-in") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        toast.success("Signed in");
        navigate({ to: "/" });
      } else {
        const { data, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;
        if (!data.session) {
          toast.success("Account created. Check your email to confirm your account, then sign in.");
          setMode("sign-in");
        } else {
          toast.success("Account created");
          navigate({ to: "/" });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <div className="eyebrow">GridMind</div>
          <h1 className="mt-2 text-3xl font-semibold">Private factory workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to load factory data from the authenticated Supabase workspace.
          </p>
        </div>

        <Panel
          title={mode === "sign-in" ? "Sign in" : "Create account"}
          desc={mode === "sign-in" ? "Your factory data stays behind authenticated, factory-scoped access." : "Create the account that will own your GridMind workspace."}
        >
          <form className="grid gap-4" onSubmit={submit}>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required disabled={!hydrated || busy} value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={8} required disabled={!hydrated || busy} value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            <Button type="submit" variant="cta" disabled={!hydrated || busy}>
              {busy ? "Working…" : mode === "sign-in" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "sign-in" ? (
              <button type="button" disabled={!hydrated || busy} className="font-medium text-foreground underline-offset-4 hover:underline" onClick={() => setMode("sign-up")}>
                Create an account
              </button>
            ) : (
              <button type="button" disabled={!hydrated || busy} className="font-medium text-foreground underline-offset-4 hover:underline" onClick={() => setMode("sign-in")}>
                Already have an account? Sign in
              </button>
            )}
          </div>
        </Panel>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          <Link to="/" className="underline underline-offset-4">Continue with demo mode</Link>
        </p>
      </div>
    </div>
  );
}
