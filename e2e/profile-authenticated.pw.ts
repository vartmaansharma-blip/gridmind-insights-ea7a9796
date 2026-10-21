import { test, expect } from "@playwright/test";
import { provisionLocalCustomer } from "./local-backend";
import { requireLocalOnlyRequests } from "./nonproduction-network";
test("personal profile uses genuine local Auth metadata, preserves membership roles and survives reload", async ({
  page,
}) => {
  await requireLocalOnlyRequests(page.context());
  await page.goto("/auth?destination=profile");
  await page.getByLabel("Email", { exact: true }).fill("gridmind-http-a@example.test");
  await page.getByLabel("Password", { exact: true }).fill("gridmind-ci-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("heading", { name: "Personal profile", exact: true })).toBeVisible();
  await page.getByLabel("Display name", { exact: true }).fill("GridMind isolated profile test");
  await page
    .getByLabel("Designation — personal metadata", { exact: true })
    .fill("Test engineer — no authorization");
  await page.getByRole("button", { name: "Save personal details", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "GridMind isolated profile test", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Display name", { exact: true })).toHaveValue(
    "GridMind isolated profile test",
  );
  await expect(page.getByText(/read-only organization role:/)).toBeVisible();
  await page.getByRole("link", { name: "Explore sample organization", exact: true }).click();
  await page.getByRole("button", { name: "Start Exploring", exact: true }).click();
  await expect(page.getByText("GridMind Example Components", { exact: true })).toBeVisible();
  await page.getByText("GridMind areas", { exact: true }).click();
  await page
    .getByRole("navigation", { name: "Global GridMind navigation" })
    .getByRole("link", { name: /^Profile/ })
    .click();
  await expect(page.getByLabel("Display name", { exact: true })).toHaveValue(
    "GridMind isolated profile test",
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Sign in to view your own profile", exact: true }),
  ).toBeVisible();
});

test("genuine authenticated user without memberships has personal profile and sample access", async ({
  page,
}) => {
  const personal = await provisionLocalCustomer();
  await requireLocalOnlyRequests(page.context());
  await page.goto("/auth?destination=profile");
  await page.getByLabel("Email", { exact: true }).fill(personal.email);
  await page.getByLabel("Password", { exact: true }).fill("gridmind-ci-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(
    page.getByText("Context: Personal account without a factory.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open authorized dashboard", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Explore sample organization", exact: true }).click();
  await page.getByRole("button", { name: "Start Exploring", exact: true }).click();
  await expect(page.getByText("GridMind Example Components", { exact: true })).toBeVisible();
});
