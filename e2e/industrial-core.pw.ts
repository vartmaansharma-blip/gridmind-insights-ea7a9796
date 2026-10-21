import { test, expect } from "@playwright/test";
test("GM-CORE-003 four synthetic scenarios execute the actual server service", async ({ page }) => {
  const coreRequests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/industrial-core")) coreRequests.push(r.postData() ?? "");
  });
  await page.goto("/investigations");
  const region = page.getByRole("region", { name: "Industrial decisions and constraints" });
  for (const scenario of ["A", "B", "C", "D"]) {
    await region.getByLabel("Industrial core scenario").selectOption(scenario);
    const response = page.waitForResponse(
      (r) => r.url().includes("/api/industrial-core") && r.request().method() === "POST",
    );
    await region.getByRole("button", { name: "Run synthetic scenario", exact: true }).click();
    const result = await response;
    expect(result.status()).toBe(200);
    const body = await result.json();
    expect(body.scenario).toBe(scenario);
    expect(body.origin).toBe("synthetic");
    expect(body.decision.algorithmVersion).toBe("gm-core-003/constraints-v1");
    await expect(region.getByText(/Decision:/)).toBeVisible();
    if (scenario === "A") {
      expect(body.decision.recommendation).toBe("produce-approved");
      await expect(region.getByRole("cell", { name: "eligible", exact: true })).toBeVisible();
    }
    if (scenario === "B") {
      expect(body.opportunity.status).toBe("requires_review");
      await expect(region.getByLabel("Opportunity qualification")).toContainText(
        "BUYER_DEMAND_NOT_VERIFIED",
      );
      await expect(region.getByLabel("Opportunity qualification")).toContainText(
        "insufficient_information",
      );
    }
    if (scenario === "C") {
      expect(body.decision.recommendation).toBeNull();
      await expect(region.getByText(/Disruption disruption affects:/)).toContainText("order order");
      await expect(region.getByText(/Disruption disruption affects:/)).toContainText(
        "operation operation",
      );
      await expect(region.getByText(/RESOURCE_UNAVAILABLE/).first()).toBeVisible();
    }
    if (scenario === "D") {
      expect(body.decision.disposition).toBe("no_permitted_alternative");
      await expect(region.getByRole("cell", { name: "prohibited", exact: true })).toBeVisible();
      await expect(
        region.getByText(/approved-steel v1: MANDATORY_REQUIREMENT_FAILED/),
      ).toBeVisible();
    }
    expect(body.decision.verifiedSavings).toBeNull();
    expect(body.workflow.execution).toBe("not_executed");
  }
  expect(coreRequests).toHaveLength(4);
  expect(coreRequests.every((r) => JSON.parse(r).action === "demo")).toBe(true);
});
test("mobile core explains missing authority without writing to a database", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/investigations");
  const region = page.getByRole("region", { name: "Industrial decisions and constraints" });
  await region.getByRole("button", { name: "Run synthetic scenario" }).click();
  await expect(region.getByText(/Decision:/)).toBeVisible();
  await region.getByText("Isolated authenticated workspace", { exact: true }).click();
  await expect(
    region.getByRole("button", { name: "Request approval", exact: true }),
  ).toBeDisabled();
  await expect(region.getByText(/Administrators receive no automatic/)).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
  const response = await page.request.post("/api/industrial-core", {
    data: { action: "load", workspaceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", factoryId: 1 },
  });
  expect(response.status()).toBe(503);
  expect(await response.json()).toEqual({ error: "CORE_DISABLED" });
});
