import { test, expect } from "@playwright/test";
// Explicit browser fixtures: these are NOT live inventory or integration tests.
const night = {
  id: "20000000-0000-4000-8000-000000000001",
  title: "Test-only booking window",
  starts_at: "2027-12-12T21:00:00-05:00",
  ends_at: "2027-12-13T02:00:00-05:00",
  arrival_start: "2027-12-12T21:00:00-05:00",
  arrival_end: "2027-12-12T22:00:00-05:00",
};
const section = {
  id: "10000000-0000-4000-8000-000000000001",
  name: "Test-only section",
  description: "Automated test fixture",
  capacity: 8,
  deposit_cents: 10000,
  minimum_spend_cents: 50000,
  amenities: ["Test seating"],
  available: true,
  policy: "Test terms: non-refundable deposit counts toward the minimum spend.",
};
test("request flow reviews terms and waits for approval without collecting payment", async ({
  page,
}) => {
  let submitted: Record<string, unknown> = {};
  await page.route("**/api/availability?*", (route) =>
    route.fulfill({
      json: route.request().url().includes("window=")
        ? { sections: [section] }
        : { configured: true, windows: [night], sections: [] },
    }),
  );
  await page.route("**/api/reservations", (route) => {
    submitted = route.request().postDataJSON();
    return route.fulfill({
      status: 201,
      json: { reference: "TEST00000001", status: "PENDING_APPROVAL" },
    });
  });
  await page.goto("/reserve");
  await page.getByRole("button", { name: /Test-only booking window/ }).click();
  await page.getByRole("button", { name: "EXPLORE SECTIONS" }).click();
  await page.getByRole("button", { name: /Test-only section/ }).click();
  await page.getByRole("button", { name: "YOUR DETAILS" }).click();
  await page.getByLabel("Full name", { exact: true }).fill("Test Guest");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("guest@example.test");
  await page.getByLabel("Phone number", { exact: true }).fill("3175550100");
  await page.getByRole("button", { name: "REVIEW REQUEST" }).click();
  await expect(
    page.getByText("This is a reservation request.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "SEND REQUEST" }),
  ).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "SEND REQUEST" }).click();
  await expect(
    page.getByRole("heading", { name: "Your request is in." }),
  ).toBeVisible();
  expect(submitted.sectionId).toBe(section.id);
  expect(submitted.windowId).toBe(night.id);
  expect(submitted.accepted).toBe(true);
  await expect(
    page.getByText("Your reservation is not confirmed,", { exact: false }),
  ).toBeVisible();
});
test("stale availability produces a visible retryable error", async ({
  page,
}) => {
  await page.route("**/api/availability?*", (route) =>
    route.fulfill({
      status: 503,
      json: { error: "Availability is temporarily unavailable." },
    }),
  );
  await page.goto("/reserve");
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "temporarily unavailable",
  );
  await expect(
    page.getByRole("button", { name: "EXPLORE SECTIONS" }),
  ).toBeDisabled();
});
