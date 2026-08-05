import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("homepage loads without browser console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Protect the protector.");
  expect(errors).toEqual([]);
});

test("homepage uses the light campaign canvas without a dark hero treatment", async ({ page }) => {
  await page.goto("/");

  const surfaces = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    const hero = document.querySelector<HTMLElement>(".campaign-hero");
    const tracker = document.querySelector<HTMLElement>(".promise-tracker");

    if (!header || !hero || !tracker) throw new Error("Required campaign surfaces are missing");

    return {
      body: getComputedStyle(document.body).backgroundColor,
      header: getComputedStyle(header).backgroundColor,
      hero: getComputedStyle(hero).backgroundColor,
      heroImage: getComputedStyle(hero).backgroundImage,
      trackerCenter: getComputedStyle(tracker, "::before").backgroundColor,
    };
  });

  expect(surfaces).toEqual({
    body: "rgb(248, 247, 243)",
    header: "rgb(255, 255, 255)",
    hero: "rgb(248, 247, 243)",
    heroImage: "none",
    trackerCenter: "rgb(255, 255, 255)",
  });
});

test("desktop navigation and homepage CTAs reach valid sections", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");

  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "How It Works" }).click();
  await expect(page).toHaveURL(/#how-it-works$/);
  await expect(page.locator("#how-it-works")).toBeInViewport();

  await page.goto("/");
  await page.locator(".campaign-hero").getByRole("link", { name: "Join the Movement" }).click();
  await expect(page).toHaveURL(/#how-it-works$/);

  await page.goto("/");
  await page.getByRole("link", { name: "See the Promises" }).click();
  await expect(page).toHaveURL(/#stories$/);
  await expect(page.locator("#stories")).toBeInViewport();
});

test("mobile menu opens, closes with Escape, and restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const menuButton = page.getByRole("button", { name: "Open navigation menu" });
  await menuButton.click();
  const dialog = page.getByRole("dialog", { name: "Site navigation" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link", { name: "The Movement", exact: true })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Site navigation" })).toBeHidden();
  await expect(menuButton).toBeFocused();
});

for (const width of [360, 390]) {
  test(`homepage has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 360 ? 800 : 844 });
    await page.goto("/");

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));

    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  });
}

test("mobile hero exposes its masthead, tracker, and primary action above the fold", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.locator(".hero-brand-masthead")).toBeInViewport();
  await expect(page.locator(".promise-tracker")).toBeInViewport();
  await expect(page.locator(".campaign-hero").getByRole("link", { name: "Join the Movement" })).toBeInViewport();
});

test("hero stays stacked on portrait tablet and becomes image-left on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");

  const tabletCopy = await page.locator(".campaign-hero__copy").boundingBox();
  const tabletMedia = await page.locator(".hero-media").boundingBox();
  expect(tabletCopy).not.toBeNull();
  expect(tabletMedia).not.toBeNull();
  expect(tabletMedia!.y).toBeGreaterThan(tabletCopy!.y + tabletCopy!.height);

  await page.setViewportSize({ width: 1024, height: 768 });
  const desktopCopy = await page.locator(".campaign-hero__copy").boundingBox();
  const desktopMedia = await page.locator(".hero-media").boundingBox();
  expect(desktopCopy).not.toBeNull();
  expect(desktopMedia).not.toBeNull();
  expect(desktopMedia!.x).toBeLessThan(desktopCopy!.x);
  expect(Math.abs(desktopMedia!.y - desktopCopy!.y)).toBeLessThan(desktopMedia!.height / 2);
});

test("Promise Ribbon scrolls internally without expanding the page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const ribbon = page.locator(".promise-ribbon__viewport");
  await ribbon.scrollIntoViewIfNeeded();
  const before = await ribbon.evaluate((element) => ({
    pageWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
    left: element.scrollLeft,
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
  expect(before.scrollWidth).toBeGreaterThan(before.clientWidth);

  await ribbon.evaluate((element) => element.scrollTo({ left: 220 }));
  const after = await ribbon.evaluate((element) => ({
    pageWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
    left: element.scrollLeft,
  }));
  expect(after.left).toBeGreaterThan(0);
  expect(after.pageWidth).toBeLessThanOrEqual(after.viewportWidth);
});

test("reduced motion leaves hero content visible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.locator(".hero-media__frame")).toBeVisible();
  await expect(page.locator(".promise-ribbon__card").first()).toBeVisible();
});

test("homepage has no serious or critical axe violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();

  const seriousOrCritical = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? ""),
  );

  expect(seriousOrCritical).toEqual([]);
});
