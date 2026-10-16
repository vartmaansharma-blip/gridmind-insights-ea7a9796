import { execFileSync } from "node:child_process";

/** Local acceptance setup only. Never logs or exposes the admin credential to a browser. */
export function localBackend() {
  const origin = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
  if (origin !== "http://127.0.0.1:54321") throw new Error("Acceptance requires loopback Supabase");
  let output: string;
  try {
    output = execFileSync("supabase", ["status", "-o", "env"], {
      cwd: new URL("../", import.meta.url),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    throw new Error("Start the disposable local Supabase stack before acceptance");
  }
  const value = (name: string) => output.match(new RegExp(`^${name}="([^"]+)"$`, "m"))?.[1];
  if (value("API_URL") !== origin || !value("SERVICE_ROLE_KEY"))
    throw new Error("Local Supabase status contract is invalid");
  const serviceKey = value("SERVICE_ROLE_KEY")!;
  return { origin, serviceKey };
}

export async function provisionLocalReviewer(factoryId: number, organizationId: number) {
  const { origin, serviceKey } = localBackend();
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
  const email = `gridmind-reviewer-${crypto.randomUUID()}@example.test`;
  const auth = await fetch(`${origin}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password: "gridmind-ci-password", email_confirm: true }),
  });
  const user = await auth.json();
  if (!auth.ok || typeof user.id !== "string")
    throw new Error("Could not provision the isolated reviewer fixture");
  for (const [table, row] of [
    [
      "organization_members",
      { organization_id: organizationId, user_id: user.id, role: "viewer", status: "active" },
    ],
    [
      "factory_members",
      { organization_id: organizationId, factory_id: factoryId, user_id: user.id, role: "viewer" },
    ],
  ] as const) {
    const response = await fetch(`${origin}/rest/v1/${table}`, {
      method: "POST",
      headers,
      body: JSON.stringify(row),
    });
    await response.text();
    if (!response.ok)
      throw new Error(`Could not provision local ${table} fixture: HTTP ${response.status}`);
  }
  return { id: user.id as string, email };
}
