import { test, expect, type Page } from "@playwright/test";
const backend = "http://127.0.0.1:54329";
const user = {
  id: "10000000-0000-4000-8000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "synthetic@example.test",
  app_metadata: { provider: "google" },
  user_metadata: { role: "admin" },
  created_at: "2026-01-01T00:00:00Z",
};
function session() {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = `${btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${btoa(JSON.stringify({ sub: user.id, exp, aud: "authenticated", role: "authenticated" }))}.synthetic`;
  return {
    access_token: token,
    refresh_token: "synthetic-refresh",
    expires_in: 3600,
    expires_at: exp,
    token_type: "bearer",
    user,
  };
}
async function fixture(
  page: Page,
  principal = { factories: [] as { id: number; name: string; role: string }[], isCustomer: false },
) {
  const writes: string[] = [];
  await page.context().route("**/*", (route) => {
    const u = new URL(route.request().url());
    if (u.hostname !== "127.0.0.1" && u.protocol.startsWith("http")) return route.abort();
    return route.continue();
  });
  await page.route(`${backend}/**`, (route) => {
    const u = new URL(route.request().url());
    if (u.pathname === "/auth/v1/user") return route.fulfill({ json: user });
    if (u.pathname === "/auth/v1/settings")
      return route.fulfill({ json: { external: { google: true } } });
    if (u.pathname === "/auth/v1/token" || u.pathname === "/auth/v1/signup")
      return route.fulfill({ json: session() });
    if (u.pathname === "/auth/v1/logout") return route.fulfill({ status: 204 });
    return route.abort();
  });
  await page.route("**/api/portal", (route) => {
    const action = route.request().postDataJSON().action;
    if (action === "principal") return route.fulfill({ json: principal });
    if (action === "list") return route.fulfill({ json: { cases: [] } });
    if (action === "intakeList") return route.fulfill({ json: { requests: [] } });
    writes.push(action);
    return route.abort();
  });
  return writes;
}
async function callback(page: Page, destination = "team") {
  const s = session();
  await page.goto(
    `/auth?oauth=google&destination=${destination}#access_token=${s.access_token}&refresh_token=${s.refresh_token}&expires_in=3600&token_type=bearer`,
  );
}

test("branded Google control stays accessible and password reveal does not submit the form", async ({ page }) => {
  await fixture(page);
  await page.goto("/auth?destination=customer");
  const googleButton = page.getByRole("button", { name: "Continue with Google" });
  await expect(googleButton).toBeEnabled();
  await expect(googleButton.locator("img")).toHaveAttribute(
    "src",
    "https://developers.google.com/static/identity/images/g-logo.png",
  );
  await expect(googleButton.locator("img")).toHaveAttribute("alt", "");
  await expect(googleButton).toHaveAttribute("aria-busy", "false");
  const password = page.getByLabel("Password", { exact: true });
  await expect(password).toHaveAttribute("type", "password");
  await password.fill("synthetic-password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(password).toHaveValue("synthetic-password");
  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(password).toHaveAttribute("type", "password");
  await expect(page).toHaveURL(/\/auth\?destination=customer$/);
});

test("auth actions meet mobile tap targets and reduced motion avoids decorative transitions", async ({ page }) => {
  await fixture(page);
  await page.setViewportSize({ width: 380, height: 760 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/auth");
  const google = page.getByRole("button", { name: "Continue with Google" });
  await expect(google).toBeVisible();
  const height = await google.evaluate((element) => element.getBoundingClientRect().height);
  expect(height).toBeGreaterThanOrEqual(44);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
  await google.focus();
  await expect(google).toBeFocused();
  const transitionSeconds = await google.evaluate((element) =>
    getComputedStyle(element).transitionDuration.split(",").map((duration) => parseFloat(duration)),
  );
  expect(transitionSeconds.every((duration) => Number.isFinite(duration) && duration <= 0.001)).toBe(true);
});

test("server-rendered Google and password controls are disabled until hydration", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/auth?destination=team");
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeDisabled();
  await expect(page.getByLabel("Email", { exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeDisabled();
  await context.close();
});
test("Google entry sends fixed callback with team destination and no extra Google scopes", async ({
  page,
}) => {
  await fixture(page);
  let requested = "";
  await page.route(`${backend}/auth/v1/authorize**`, async (route) => {
    requested = route.request().url();
    await route.fulfill({ contentType: "text/html", body: "Synthetic provider" });
  });
  await page.goto("/auth?destination=team&redirectTo=https://evil.example");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect.poll(() => requested).not.toBe("");
  const u = new URL(requested);
  expect(u.searchParams.get("provider")).toBe("google");
  expect(u.searchParams.get("redirect_to")).toBe(
    "http://127.0.0.1:4186/auth?oauth=google&destination=team",
  );
  expect(u.searchParams.has("scopes")).toBe(false);
});
test("disabled provider stays on auth with usable email sign-in", async ({ page }) => {
  await fixture(page);
  await page.route(`${backend}/auth/v1/settings`, (route) =>
    route.fulfill({ json: { external: { google: false } } }),
  );
  await page.goto("/auth");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page.getByRole("alert")).toContainText("unavailable");
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
  await expect(page).toHaveURL(/\/auth$/);
});
test("cancelled/error callback is sanitized and cannot reuse an old session to navigate", async ({
  page,
}) => {
  await fixture(page);
  await page.addInitScript(
    (s) => localStorage.setItem("sb-127-auth-token", JSON.stringify(s)),
    session(),
  );
  await page.goto(
    "/auth?oauth=google&destination=team#error=access_denied&error_description=PRIVATE_PROVIDER_DETAIL",
  );
  await expect(page.getByRole("alert")).toContainText("cancelled");
  await expect(page.getByRole("alert")).not.toContainText("PRIVATE_PROVIDER_DETAIL");
  await expect(page).toHaveURL("http://127.0.0.1:4186/auth?destination=team");
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeEnabled();
});
test("callback without a session fails and restores controls", async ({ page }) => {
  await fixture(page);
  await page.goto("/auth?oauth=google&destination=customer");
  await expect(page.getByRole("alert")).toContainText("did not return a session");
  await expect(page.getByLabel("Email", { exact: true })).toBeEnabled();
});
test("new Google user with forged admin metadata remains pending and writes no grants", async ({
  page,
}) => {
  const writes = await fixture(page);
  await callback(page);
  await expect(page.getByRole("status")).toContainText("Access pending");
  await expect(page).toHaveURL("http://127.0.0.1:4186/auth?destination=team");
  expect(writes).toEqual([]);
  await page.getByRole("button", { name: "Check access again" }).click();
  await expect(page.getByRole("status")).toContainText("Access pending");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByLabel("Email", { exact: true })).toBeEnabled();
});
for (const destination of ["customer", "team"] as const) {
  test(`Google callback preserves ${destination} routing and session on reload`, async ({
    page,
  }) => {
    await fixture(page, {
      factories: [{ id: 1, name: "Invented site", role: "viewer" }],
      isCustomer: true,
    });
    await callback(page, destination);
    await expect(page).toHaveURL(destination === "team" ? /\/team\/cases\/?$/ : /\/cases\/?$/);
    await page.reload();
    const stored = await page.evaluate(() =>
      Object.keys(localStorage).some((k) => /^sb-.*-auth-token$/.test(k)),
    );
    expect(stored).toBe(true);
  });
  test(`email/password still signs in to ${destination}`, async ({ page }) => {
    await fixture(page, {
      factories: [{ id: 1, name: "Invented site", role: "viewer" }],
      isCustomer: true,
    });
    await page.goto(`/auth?destination=${destination}`);
    await page.getByLabel("Email", { exact: true }).fill(user.email);
    await page.getByLabel("Password", { exact: true }).fill("synthetic-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(destination === "team" ? /\/team\/cases\/?$/ : /\/cases\/?$/);
  });
}
test("case-only customer asking for team is routed to customer cases", async ({ page }) => {
  await fixture(page, { factories: [], isCustomer: true });
  await callback(page);
  await expect(page).toHaveURL(/\/cases\/?$/);
});
test("failed access lookup stays on auth and supports retry", async ({ page }) => {
  await fixture(page);
  await page.route("**/api/portal", (route) =>
    route.fulfill({ status: 403, json: { error: "CASE_ACCESS_DENIED" } }),
  );
  await callback(page);
  await expect(page.getByRole("alert")).toContainText("does not have active access");
  await expect(page).toHaveURL(/\/auth\?destination=team$/);
  await expect(page.getByRole("button", { name: "Check access again" })).toBeEnabled();
});
test("email sign-up requiring confirmation remains supported", async ({ page }) => {
  await fixture(page);
  await page.route(`${backend}/auth/v1/signup`, (route) =>
    route.fulfill({ json: { user, session: null } }),
  );
  await page.goto("/auth?destination=customer");
  await page.getByRole("button", { name: "Create an account", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill("synthetic-password");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
  await expect(page).toHaveURL(/\/auth\?destination=customer$/);
});

test("provider errors recover to working email sign-in without displaying provider details", async ({
  page,
}) => {
  await fixture(page, { factories: [], isCustomer: true });
  await page.goto("/auth?destination=customer&error=server_error&error_description=PRIVATE_DETAIL");
  await expect(page.getByRole("alert")).toContainText("could not be completed");
  await expect(page.getByRole("alert")).not.toContainText("PRIVATE_DETAIL");
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill("synthetic-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/cases\/?$/);
});
test("invalid password restores controls and does not navigate", async ({ page }) => {
  await fixture(page);
  await page.route(`${backend}/auth/v1/token**`, (route) =>
    route.fulfill({
      status: 400,
      json: { code: "invalid_credentials", msg: "Invalid login credentials" },
    }),
  );
  await page.goto("/auth?destination=team");
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Invalid login credentials");
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeEnabled();
  await expect(page).toHaveURL(/\/auth\?destination=team$/);
});
test("invalid OAuth session fails before any workspace lookup", async ({ page }) => {
  await fixture(page);
  let lookups = 0;
  await page.route("**/api/portal", (route) => {
    lookups++;
    return route.abort();
  });
  await page.route(`${backend}/auth/v1/user`, (route) =>
    route.fulfill({ status: 401, json: { code: "bad_jwt", msg: "Invalid session" } }),
  );
  await callback(page);
  await expect(page.getByRole("alert")).toContainText("could not be completed");
  expect(lookups).toBe(0);
  await expect(page).toHaveURL(/\/auth\?destination=team$/);
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeEnabled();
});

test("provider availability network failure restores controls without leaving auth", async ({
  page,
}) => {
  await fixture(page);
  await page.route(`${backend}/auth/v1/settings`, (route) => route.abort("connectionfailed"));
  await page.goto("/auth?destination=customer");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page.getByRole("alert")).toContainText("unavailable");
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeEnabled();
  await expect(page.getByLabel("Email", { exact: true })).toBeEnabled();
  await expect(page).toHaveURL(/\/auth\?destination=customer$/);
});
