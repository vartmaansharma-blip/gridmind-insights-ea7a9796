import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const host = process.env.GRIDMIND_PREVIEW_HOST ?? "127.0.0.1";
const port = Number(process.env.GRIDMIND_PREVIEW_PORT ?? "4173");
const baseUrl = `http://${host}:${port}`;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid GRIDMIND_PREVIEW_PORT: ${port}`);
}

const output = [];
const preview = spawn(
  process.execPath,
  [
    "run",
    "preview",
    "--",
    "--ip",
    host,
    "--port",
    String(port),
    "--show-interactive-dev-session=false",
  ],
  {
    cwd: process.cwd(),
    env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

for (const stream of [preview.stdout, preview.stderr]) {
  stream.on("data", (chunk) => {
    output.push(String(chunk));
    if (output.length > 200) output.shift();
  });
}

let spawnError;
preview.once("error", (error) => {
  spawnError = error;
});

async function stopPreview() {
  if (preview.exitCode !== null) return;

  preview.kill("SIGTERM");
  await Promise.race([new Promise((resolve) => preview.once("exit", resolve)), delay(2_000)]);

  if (preview.exitCode === null) preview.kill("SIGKILL");
}

function diagnostics() {
  return output.join("").slice(-12_000);
}

async function waitUntilReady() {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    if (spawnError) throw spawnError;
    if (preview.exitCode !== null) {
      throw new Error(`Preview exited with code ${preview.exitCode}.`);
    }

    try {
      const response = await fetch(baseUrl, { redirect: "manual" });
      if (response.status === 200) return;
    } catch {
      // The preview process is still starting.
    }

    await delay(250);
  }

  throw new Error("Preview did not become ready within 30 seconds.");
}

const routes = [
  "/",
  "/auth",
  "/website",
  "/app/overview",
  "/problem",
  "/how-it-works",
  "/example",
  "/about",
  "/contact",
  "/cases",
  "/cases/10000000-0000-4000-8000-000000000001",
  "/team/intake",
  "/team/cases",
  "/team/cases/10000000-0000-4000-8000-000000000001",
  "/factory",
  "/energy",
  "/opportunities",
  "/alerts",
  "/savings",
  "/investigations",
  "/investigations-connected",
];

try {
  await waitUntilReady();

  for (const route of routes) {
    const response = await fetch(`${baseUrl}${route}`, { redirect: "manual" });
    if (response.status !== 200) {
      throw new Error(`${route} returned HTTP ${response.status}; expected 200.`);
    }
  }

  const machinesRedirect = await fetch(`${baseUrl}/machines/`, {
    redirect: "manual",
  });
  if (machinesRedirect.status !== 307 || machinesRedirect.headers.get("location") !== "/machines") {
    throw new Error(
      `/machines/ returned HTTP ${machinesRedirect.status} with location ${machinesRedirect.headers.get("location")}; expected 307 to /machines.`,
    );
  }

  console.log(
    `Production preview smoke check passed for ${routes.length} routes and the machines redirect.`,
  );
} catch (error) {
  const log = diagnostics();
  if (log) console.error(`\nPreview output:\n${log}`);
  throw error;
} finally {
  await stopPreview();
}
