import type { BrowserContext } from "@playwright/test";

/**
 * Safety boundary for tests using disposable local Supabase credentials.
 * Do not allow fixture credentials or JWTs to leave loopback if generated
 * client configuration drifts back to a hardcoded hosted Supabase URL.
 */
const guarded = new WeakSet<BrowserContext>();
export async function requireLocalOnlyRequests(context: BrowserContext) {
  if (guarded.has(context)) return;
  await context.route("**/*", (route) => {
    let target: URL;
    try {
      target = new URL(route.request().url());
    } catch {
      return route.abort();
    }
    if (["http:", "https:"].includes(target.protocol) &&
        !["127.0.0.1", "localhost"].includes(target.hostname)) {
      return route.abort();
    }
    return route.continue();
  });
  guarded.add(context);
}
