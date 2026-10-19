import { test, expect, type Page } from "@playwright/test";
import { requireLocalOnlyRequests } from "./nonproduction-network";
async function login(page: Page, email: string) {
  await requireLocalOnlyRequests(page.context());
  await page.goto("/auth?destination=team");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("gridmind-ci-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Investigations", exact: true })).toBeVisible();
  await page.goto("/team/electricity");
  await expect(page.getByLabel("Organization / site")).toBeVisible();
}
async function rpc(page: Page, command: Record<string, unknown>) {
  return page.evaluate(async (command) => {
    const key = Object.keys(localStorage).find((k) => /^sb-.*-auth-token$/.test(k));
    const session = key ? JSON.parse(localStorage.getItem(key)!) : null;
    if (!session?.access_token) throw new Error("Missing local session");
    const response = await fetch("/api/electricity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(command),
    });
    return { status: response.status, data: await response.json() };
  }, command);
}
test("electricity case persists private bill, denies foreign tenant, and retains audit after reload", async ({
  page,
  browser,
}) => {
  await login(page, "gridmind-http-a@example.test");
  const site = page.getByLabel("Organization / site");
  await site.selectOption({
    label: await site.locator("option").filter({ hasText: "gridmind-http-factory-a" }).innerText(),
  });
  const investigator = page.getByLabel("Investigator");
  await investigator.selectOption(
    (await investigator.locator("option").nth(1).getAttribute("value")) as string,
  );
  await page.getByLabel("Utility on bill").selectOption("Unknown");
  await page.getByLabel("Bill period start").fill("2026-09-01");
  await page.getByLabel("Bill period end").fill("2026-09-30");
  await page
    .getByLabel("Issue to investigate")
    .fill("SYNTHETIC: explain demand charge on sample bill");
  await page.getByRole("button", { name: "Create electricity case" }).click();
  await expect(page.getByTestId("electricity-status")).toHaveText("Status: opened");
  const caseId = new URL(page.url()).searchParams.get("caseId")!;
  const fixture = Buffer.from(
    "%PDF-1.4\n% SYNTHETIC electricity bill, no real customer data\n%%EOF",
  );
  await page
    .getByLabel("Synthetic electricity bill")
    .setInputFiles({ name: "synthetic-bill.pdf", mimeType: "application/pdf", buffer: fixture });
  await page.getByRole("button", { name: "Upload private bill" }).click();
  await expect(page.getByRole("button", { name: "Download synthetic-bill.pdf" })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download synthetic-bill.pdf" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("synthetic-bill.pdf");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks)).toEqual(fixture);
  await page.getByRole("button", { name: "Move to investigating", exact: true }).click();
  await expect(page.getByTestId("electricity-status")).toHaveText("Status: investigating");
  await page.reload();
  await expect(page.getByRole("button", { name: "Download synthetic-bill.pdf" })).toBeVisible();
  await expect(page.getByText(/evidence uploaded ·/)).toBeVisible();
  const own = await rpc(page, { action: "load", caseId });
  expect(own.status).toBe(200);
  expect(
    own.data.events.filter((e: { kind: string }) => e.kind === "evidence_uploaded"),
  ).toHaveLength(1);
  const otherContext = await browser.newContext(),
    other = await otherContext.newPage();
  try {
    await login(other, "gridmind-http-b@example.test");
    expect((await rpc(other, { action: "load", caseId })).status).toBe(403);
    expect(
      (await rpc(other, { action: "status", caseId, revision: 2, status: "awaiting_expert" }))
        .status,
    ).toBe(403);
    const denied = await other.evaluate(
      async ({ path, apikey }) => {
        const key = Object.keys(localStorage).find((k) => /^sb-.*-auth-token$/.test(k));
        const session = JSON.parse(localStorage.getItem(key!)!);
        const response = await fetch(
          `http://127.0.0.1:54321/storage/v1/object/authenticated/electricity-bills/${path}`,
          { headers: { Authorization: `Bearer ${session.access_token}`, apikey } },
        );
        return response.status;
      },
      { path: own.data.evidence[0].object_path, apikey: process.env.SUPABASE_ANON_KEY! },
    );
    expect(denied).not.toBe(200);
    await other.goto(`/team/electricity?caseId=${caseId}`);
    await expect(other.getByRole("alert")).toHaveText("Case access denied");
    await expect(other.getByText("SYNTHETIC: explain demand charge on sample bill")).toHaveCount(0);
  } finally {
    await otherContext.close();
  }
  await page.getByRole("button", { name: "Move to awaiting expert" }).click();
  await expect(page.getByTestId("electricity-status")).toHaveText("Status: awaiting expert");
  await page.getByRole("button", { name: "Move to closed inconclusive" }).click();
  await expect(page.getByTestId("electricity-status")).toHaveText("Status: closed inconclusive");
  await expect(page.getByRole("button", { name: "Upload private bill" })).toHaveCount(0);
});
