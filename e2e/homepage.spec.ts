import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("homepage loads without browser console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "The protector has always protected us.",
  );
  expect(errors).toEqual([]);
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
  await page.getByRole("link", { name: "Explore the Stories" }).click();
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

test("homepage has no horizontal overflow at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));

  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
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
