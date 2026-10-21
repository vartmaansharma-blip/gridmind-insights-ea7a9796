import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { digest } from "../src/lib/industrial-core/engine";

test("finite planning uses the real server path, explains blocked orders and exports bound source", async ({
  page,
  context,
}) => {
  const backend: string[] = [],
    errors: string[] = [];
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (/supabase|\/rest\/v1|\/functions\/v1/.test(url.href)) backend.push(url.href);
    return url.protocol.startsWith("http") && url.hostname !== "127.0.0.1"
      ? route.abort()
      : route.continue();
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/investigations");
  const region = page.getByRole("region", { name: "Finite production planning", exact: true });
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/industrial-core") &&
      r.request().postDataJSON().action === "planning_demo",
  );
  await region.getByRole("button", { name: "Plan invented orders" }).click();
  const packet = await (await response).json();
  expect(packet.status).toBe("candidate_feasible");
  expect(packet.tasks).toHaveLength(2);
  expect(await digest(packet.inputSnapshot)).toBe(packet.inputDigest);
  expect(Date.parse(packet.tasks[0].endsAt)).toBeLessThanOrEqual(
    Date.parse(packet.tasks[1].startsAt),
  );
  await expect(
    region.getByText("Planning result: Feasible draft within supplied records", { exact: true }),
  ).toBeVisible();
  await expect(
    region.getByText(/No work is assigned and no stock or machine time is reserved/),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await region.getByRole("button", { name: "Download planning draft" }).click();
  const file = await (await download).path();
  expect(file).toBeTruthy();
  expect(JSON.parse(await readFile(file!, "utf8"))).toEqual(packet);
  await region.getByLabel("Planning scenario").selectOption("shortage");
  await expect(
    region.getByText("Planning result: Feasible draft within supplied records", { exact: true }),
  ).toHaveCount(0);
  await region.getByRole("button", { name: "Plan invented orders" }).click();
  await expect(region.getByText(/Approved stock is insufficient/)).toBeVisible();
  await region.getByLabel("Planning scenario").selectOption("breakdown");
  await region.getByRole("button", { name: "Plan invented orders" }).click();
  await expect(region.getByText(/The resource is stopped/).first()).toBeVisible();
  await expect(region.getByText(/No supplied job can be placed/)).toBeVisible();
  expect(backend).toEqual([]);
  expect(errors).toEqual([]);
});

test("mobile planning recovers from a failed request without retaining an old draft", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return url.protocol.startsWith("http") && url.hostname !== "127.0.0.1"
      ? route.abort()
      : route.continue();
  });
  let fail = true;
  await page.route("**/api/industrial-core", (route) => {
    if (route.request().postDataJSON().action === "planning_demo" && fail) {
      fail = false;
      return route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "SYNTHETIC_TEST_OUTAGE" }),
      });
    }
    return route.fallback();
  });
  await page.goto("/investigations");
  const region = page.getByRole("region", { name: "Finite production planning", exact: true });
  await region.getByRole("button", { name: "Plan invented orders" }).click();
  await expect(region.getByRole("alert")).toContainText("SYNTHETIC_TEST_OUTAGE");
  await region.getByRole("button", { name: "Plan invented orders" }).click();
  await expect(
    region.getByText("Planning result: Feasible draft within supplied records", { exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
