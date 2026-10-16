import type { SupabaseClient } from "@supabase/supabase-js";
import type { Principal } from "@/lib/investigation/portal-contract";

export type AuthDestination = "customer" | "team" | undefined;
export function authDestination(value: unknown): AuthDestination {
  return value === "customer" || value === "team" ? value : undefined;
}

// The fixed same-origin route and enum prevent open redirects. Supabase must
// also allowlist the exact /auth callback (including query) per environment.
export function googleRedirect(origin: string, destination: AuthDestination): string {
  const base = new URL(origin);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname);
  if (
    base.origin !== origin ||
    (base.protocol !== "https:" && !(local && base.protocol === "http:"))
  ) {
    throw new Error("Google sign-in requires a secure website or a local development origin.");
  }
  const url = new URL("/auth", base);
  url.searchParams.set("oauth", "google");
  const safe = authDestination(destination);
  if (safe) url.searchParams.set("destination", safe);
  return url.href;
}

export function googleReturn(href: string) {
  const url = new URL(href);
  const hash = new URLSearchParams(url.hash.slice(1));
  const error =
    url.searchParams.get("error") ??
    hash.get("error") ??
    url.searchParams.get("error_code") ??
    hash.get("error_code") ??
    (hash.has("error_description") || url.searchParams.has("error_description")
      ? "provider_error"
      : null);
  const code = url.searchParams.get("error_code") ?? hash.get("error_code");
  return {
    active:
      url.searchParams.get("oauth") === "google" ||
      !!error ||
      hash.has("access_token") ||
      url.searchParams.has("code"),
    error: error
      ? error === "access_denied" || code === "access_denied"
        ? "Google sign-in was cancelled or access was denied. Try again or use email and password."
        : "Google sign-in could not be completed. Try again or use email and password."
      : null,
  };
}

export async function finishGoogleSignIn(
  auth: SupabaseClient["auth"],
  callback: ReturnType<typeof googleReturn>,
) {
  // Wait for the generated browser client's URL detection and persistence.
  // This app uses browser sessions and bearer API calls, not server cookies.
  if (callback.error) throw new Error(callback.error);
  const initialized = await auth.initialize();
  if (initialized.error)
    throw new Error("Google sign-in could not be completed. Please try again.");
  const { data, error } = await auth.getSession();
  if (error || !data.session)
    throw new Error("Google sign-in did not return a session. Please try again.");
  const verified = await auth.getUser();
  if (verified.error || verified.data.user?.id !== data.session.user.id) {
    throw new Error("Your sign-in session could not be verified. Please sign in again.");
  }
}

// Navigation never grants access. The portal rechecks permissions per request.
// A signed-in prospective customer may use the request-only /cases portal even
// without factory/case membership: portal_store allows only their own intake and
// returns no private cases until an owner explicitly grants case access.
// This customer *intent* must never be interpreted as a factory/team grant.
export function workspaceDestination(principal: Principal, destination: AuthDestination) {
  if (destination === "customer") return "/cases" as const;
  if (!principal.factories.length && !principal.isCustomer) return null;
  if (!principal.factories.length) return "/cases" as const;
  if (destination === "team") return "/team/cases" as const;
  return "/" as const;
}

// Public provider availability only: never request the management API, client
// secret or Google tokens. Fail closed if settings cannot be confirmed.
export async function requireGoogleProvider(
  url: string,
  key: string,
  fetcher: typeof fetch = fetch,
) {
  if (!url || !key || key.startsWith("sb_secret_"))
    throw new Error("Google sign-in is unavailable.");
  const response = await fetcher(new URL("/auth/v1/settings", url), {
    headers: { apikey: key },
    credentials: "omit",
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok || (await response.json()).external?.google !== true) {
    throw new Error("Google sign-in is unavailable.");
  }
}
