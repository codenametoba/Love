import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const routes = [
  "/",
  "/the-space",
  "/events",
  "/menu",
  "/moments",
  "/private-events",
  "/visit",
  "/reserve",
  "/privacy",
  "/booking-policy",
  "/accessibility",
  "/terms",
  "/admin/login",
  "/reservation/invalid",
];
test("all public routes render without runtime or image errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const path of routes) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    for (const img of await page.locator("main img").all()) {
      await img.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          img.evaluate((element) => (element as HTMLImageElement).naturalWidth),
        )
        .toBeGreaterThan(0);
    }
  }
  expect(errors).toEqual([]);
});
test("navigation and availability search preserve booking intent", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "THE SPACE", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/the-space/);
  await page.goto("/");
  await page.getByLabel("Preferred date").fill("2027-12-12");
  await page.getByLabel("Number of guests").selectOption("8");
  await page.getByRole("button", { name: "FIND A SECTION" }).click();
  await expect(page).toHaveURL(/date=2027-12-12&guests=8/);
  await expect(page.getByText("Reservations are getting ready.")).toBeVisible();
});
test("unconfigured services fail closed and admin stays protected", async ({
  request,
  page,
}) => {
  const availability = await request.get("/api/availability");
  expect(await availability.json()).toMatchObject({
    configured: false,
    windows: [],
    sections: [],
  });
  expect((await request.get("/api/cron")).status()).toBe(401);
  expect(
    (await request.post("/api/stripe/webhook", { data: {} })).status(),
  ).toBe(503);
  const response = await request.post("/api/reservations", {
    headers: { origin: "https://evil.test" },
    data: {},
  });
  expect(response.status()).toBe(400);
  await page.goto("/admin/payments");
  await expect(page).toHaveURL(/admin\/login/);
  await expect(
    page.getByRole("heading", { name: "BEHIND THE SCENES." }),
  ).toBeVisible();
});
test("forms reject invalid input and show honest service errors", async ({
  page,
}) => {
  await page.goto("/private-events");
  await page.getByLabel("Your name", { exact: true }).fill("Test Guest");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("guest@example.test");
  await page.getByLabel("Phone number", { exact: true }).fill("3175550100");
  await page.getByLabel("Preferred date", { exact: true }).fill("2027-12-12");
  await page.getByLabel("Estimated guests", { exact: true }).fill("12");
  await page
    .getByLabel("Tell us what you have in mind", { exact: true })
    .fill("A test gathering inquiry.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "SEND YOUR INQUIRY" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    /temporarily unavailable|not open yet/,
  );
  await expect(
    page.getByText("Your inquiry has reached the team."),
  ).not.toBeVisible();
});
test("mobile navigation, keyboard dismissal, and layout work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of routes) {
    await page.goto(route);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      route,
    ).toBe(true);
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "MENU", exact: false })
    .click();
  await expect(page).toHaveURL(/menu/);
});
test("representative pages pass automated WCAG 2.2 AA checks", async ({
  page,
}) => {
  for (const path of [
    "/",
    "/reserve",
    "/private-events",
    "/events",
    "/menu",
    "/admin/login",
  ]) {
    await page.goto(path);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations, path).toEqual([]);
  }
});
test("payment redirects never claim confirmation", async ({ page }) => {
  await page.goto("/reservation/invalid?payment=processing");
  await expect(
    page.getByText("This secure link is invalid or has expired.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your section is confirmed." }),
  ).toHaveCount(0);
});

test("layouts fit small phones, tablets, and wide desktops", async ({
  page,
}) => {
  for (const width of [320, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/the-space",
      "/events",
      "/menu",
      "/moments",
      "/reserve",
      "/private-events",
      "/visit",
    ]) {
      await page.goto(route);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width}px ${route}`,
      ).toBe(true);
    }
  }
});
test("capture the local design for review", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.screenshot({ path: "docs/preview-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "docs/preview-mobile.png" });
  for (const route of [
    "the-space",
    "events",
    "menu",
    "moments",
    "private-events",
    "visit",
    "reserve",
  ]) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/" + route);
    await page.screenshot({
      path: "docs/redesign/" + route + "-desktop.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: "docs/redesign/" + route + "-mobile.png",
      fullPage: true,
    });
  }
});

test("redesign removes ornamental chapter codes and keeps booking accessible", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Stay for",
  );
  await expect(
    page.getByRole("link", { name: "BOOK A SECTION", exact: true }).first(),
  ).toBeVisible();
  const text = await page.locator("main").innerText();
  expect(text).not.toMatch(/[✳✴★☆]/);
  expect(text).not.toMatch(/0[1-9]\s*\//);
  expect(text).not.toContain("MEET YOU AT LOVE");
  expect(text).not.toContain("LOVE IS A FREQUENCY");
  await expect(
    page.locator(".night-entrance .image-window img"),
  ).not.toHaveAttribute("src", /atmosphere\.jpg/);
  const hero = await page
    .locator(".night-entrance")
    .evaluate((el) => getComputedStyle(el).display);
  expect(hero).toBe("flex");
  await expect(page.locator(".night-entrance figcaption")).toContainText(
    "A room made for good company.",
  );
});

test("venue content fills menus, directions and gallery, with Home in navigation", async ({
  page,
}) => {
  await page.goto("/menu");
  await expect(
    page.getByRole("heading", { name: "Craft Cocktails", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "LOVE Paloma", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "The LOVE Burger", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Street Tacos", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "HOME", exact: true })
    .click();
  await expect(page).toHaveURL("/");
  await expect(page.locator(".night-entrance img")).toHaveAttribute(
    "src",
    /venue%2Flounge-overview/,
  );
  await expect(page.locator("main")).not.toContainText(
    /illustrative|not photographed|conceptual/i,
  );
  await page.goto("/visit");
  await expect(
    page.getByRole("heading", {
      name: "1059 Virginia Avenue, Indianapolis, IN 46203",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Get directions", exact: true }),
  ).toHaveAttribute("href", /1059\+Virginia/);
  await page.goto("/moments");
  await page
    .getByRole("button", { name: "A little color at the bar.", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Media viewer" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "At the Table", exact: true }).click();
  await expect(page.locator(".gallery-item")).toHaveCount(1);
});
