import { PreferencesPanel } from "@/components/gm/preferences-panel";
import { useNavigationAccess } from "@/lib/navigation-context";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  loadPersonalProfile,
  savePersonalMetadata,
  profileName,
  type PersonalProfile,
} from "@/lib/auth/profile";
export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Personal profile — GridMind" }] }),
  component: PersonalProfilePage,
});
function PersonalProfilePage() {
  const { setAccess } = useNavigationAccess();
  const [profile, setProfile] = useState<PersonalProfile | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(true),
    [signedOut, setSignedOut] = useState(false);
  const generation = useRef(0),
    locked = useRef(false);
  const load = useCallback(async () => {
    const current = ++generation.current;
    setProfile(null);
    setBusy(true);
    setError("");
    setSignedOut(false);
    try {
      const loaded = await loadPersonalProfile(supabase);
      if (current === generation.current) {
        setProfile(loaded);
        setAccess({
          userId: loaded.user.id,
          factories: !loaded.accessError && loaded.factories.length > 0,
          staff: !loaded.accessError && loaded.factories.length > 0,
          customer: false,
        });
      }
    } catch (e) {
      if (current === generation.current) {
        if (e instanceof Error && e.message === "PROFILE_SIGN_IN_REQUIRED") setSignedOut(true);
        else setError("Your account could not be verified. Retry or sign in again.");
      }
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }, [setAccess]);
  useEffect(() => {
    void load();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "USER_UPDATED" && locked.current) return;
      if (["SIGNED_OUT", "SIGNED_IN", "USER_UPDATED"].includes(event)) {
        generation.current++;
        setProfile(null);
        setNotice("");
        setTimeout(() => void load(), 0);
      }
    });
    const invalidate = () => {
      generation.current++;
    };
    return () => {
      invalidate();
      data.subscription.unsubscribe();
    };
  }, [load]);
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header>
        <p className="eyebrow">Personal account · real authentication</p>
        <h1 className="mt-2 text-3xl font-semibold">Personal profile</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your own account, separate from the fictional Demo Operations Manager. A personal
          designation never grants an organization role.
        </p>
      </header>
      <div className="flex flex-wrap gap-3">
        <Button variant="cta" asChild>
          <Link to="/explore">Explore sample organization</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/">Back to GridMind website</Link>
        </Button>
      </div>
      {busy && <p role="status">Verifying your account…</p>}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {signedOut && (
        <section className="panel space-y-4 p-5">
          <h2 className="text-xl font-semibold">Sign in to view your own profile</h2>
          <Button asChild variant="cta">
            <Link to="/auth" search={{ destination: "profile" }}>
              Sign in for personal profile
            </Link>
          </Button>
        </section>
      )}
      {profile && (
        <>
          <section className="panel space-y-4 p-5">
            <div className="flex items-center gap-3">
              <span
                aria-label="Profile initials"
                className="flex size-12 items-center justify-center rounded-full bg-cta font-semibold text-cta-foreground"
              >
                {profileName(profile.user)
                  .split(/\s+/)
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
              <div>
                <h2 className="text-xl font-semibold">{profileName(profile.user)}</h2>
                <p className="break-all text-sm">
                  {profile.user.email ?? "Email unavailable"} ·{" "}
                  {profile.user.email_confirmed_at
                    ? "Verified email"
                    : "Email verification pending"}
                </p>
              </div>
            </div>
            <p className="text-sm">
              Sign-in providers:{" "}
              {profile.user.identities?.map((i) => i.provider).join(", ") ||
                "Not available from verified identity"}
            </p>
            <form
              key={profile.user.id + profile.user.updated_at}
              className="grid gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (locked.current) return;
                locked.current = true;
                const current = generation.current,
                  id = profile.user.id;
                const form = new FormData(e.currentTarget);
                setBusy(true);
                setError("");
                setNotice("");
                try {
                  await savePersonalMetadata(supabase, id, {
                    display_name: String(form.get("display_name") ?? ""),
                    designation: String(form.get("designation") ?? ""),
                  });
                  if (current === generation.current) {
                    await load();
                    setNotice(
                      "Personal details saved. Organization roles and email were not changed.",
                    );
                  }
                } catch (e) {
                  setProfile(null);
                  setError(e instanceof Error ? e.message : "Profile could not be saved.");
                } finally {
                  locked.current = false;
                  setBusy(false);
                }
              }}
            >
              <label className="text-sm">
                Display name
                <input
                  name="display_name"
                  defaultValue={profileName(profile.user)}
                  required
                  maxLength={100}
                  disabled={busy}
                  className="mt-1 block w-full rounded border bg-background p-2"
                />
              </label>
              <label className="text-sm">
                Designation — personal metadata
                <input
                  name="designation"
                  defaultValue={
                    typeof profile.user.user_metadata?.designation === "string"
                      ? profile.user.user_metadata.designation.slice(0, 100)
                      : ""
                  }
                  maxLength={100}
                  disabled={busy}
                  className="mt-1 block w-full rounded border bg-background p-2"
                />
              </label>
              <Button type="submit" variant="cta" disabled={busy}>
                Save personal details
              </Button>
            </form>
          </section>
          <section className="panel space-y-3 p-5">
            <h2 className="text-xl font-semibold">Verified memberships and permitted workspaces</h2>
            {profile.accessError ? (
              <p role="status">{profile.accessError}</p>
            ) : (
              <>
                <p className="text-sm">
                  Context:{" "}
                  {profile.organizations.length
                    ? "Real authorized organization"
                    : "Personal account without a factory"}
                  .
                </p>
                {!profile.organizations.length && (
                  <p>
                    Access pending. You can use your personal profile and explore the sample without
                    registering a business.
                  </p>
                )}
                <ul className="space-y-2">
                  {profile.organizations.map((o) => (
                    <li key={o.id} className="rounded border p-3 text-sm">
                      <strong>{o.name}</strong> · read-only organization role: {o.role}
                      <ul>
                        {profile.factories
                          .filter((f) => f.organizationId === o.id)
                          .map((f) => (
                            <li key={f.id} className="mt-2">
                              {f.name} · factory role: {f.role} · factory #{f.id}
                            </li>
                          ))}
                      </ul>
                    </li>
                  ))}
                </ul>
                {profile.factories.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" asChild>
                      <Link to="/dashboard">Open authorized dashboard</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/team/cases">Open assigned team investigations</Link>
                    </Button>
                  </div>
                )}
                <Button variant="outline" asChild>
                  <Link to="/cases">My customer investigations</Link>
                </Button>
              </>
            )}
          </section>
          <Button
            variant="outline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setNotice("");
              const { error } = await supabase.auth.signOut();
              if (error) {
                setError("Sign out failed. Please retry.");
                setBusy(false);
              } else {
                generation.current++;
                setProfile(null);
                setSignedOut(true);
                setBusy(false);
              }
            }}
          >
            Sign out
          </Button>
        </>
      )}
      <PreferencesPanel />
      <Button variant="outline" disabled={busy} onClick={() => void load()}>
        Refresh verified account and access
      </Button>
    </main>
  );
}
