import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const pendingId = "e1000000-0000-4000-8000-000000000001";
const recommendedId = "e1000000-0000-4000-8000-000000000002";
const trashedId = "e1000000-0000-4000-8000-000000000003";

async function signInAs(page: Page, role: "reviewer" | "admin") {
  await page.context().addCookies([{ name:"vriksha-e2e-staff-role", value:role, url:"http://127.0.0.1:3000", sameSite:"Lax" }]);
}

test("Reviewer can use the queue, approve, and recommend without Admin access", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await signInAs(page, "reviewer");
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name:"Overview" })).toBeVisible();
  await expect(page.getByRole("link", { name:"Trash" })).toHaveCount(0);
  await expect(page.getByRole("link", { name:"Team" })).toHaveCount(0);
  await page.getByRole("link", { name:"Submissions" }).click();
  await expect(page.getByText("Asha Test")).toBeVisible();
  await expect(page.getByAltText("Private submission preview")).toBeVisible();

  await page.goto(`/admin/submissions/${pendingId}`);
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  await page.getByRole("button", { name:"Approve and publish" }).click();
  await expect(page.getByText(/Published successfully/i)).toBeVisible();

  await page.goto(`/admin/submissions/${pendingId}`);
  await page.getByLabel("Participant-facing recommendation comment").fill("Please submit a clearer generated tree photograph.");
  await page.getByRole("button", { name:"Recommend Rejection" }).click();
  await expect(page.getByText(/test moderation action completed: recommended/i)).toBeVisible();
  expect(errors).toEqual([]);
});

test("Reviewer is denied a direct Team route", async ({ page }) => {
  await signInAs(page, "reviewer");
  await page.goto("/admin/team");
  await expect(page.getByText("404", { exact:true })).toBeVisible();
});

test("Admin can confirm, approve instead, Trash, restore, delete, and manage controls", async ({ page }) => {
  await signInAs(page, "admin");
  await page.goto(`/admin/submissions/${recommendedId}`);
  await expect(page.getByText("participant@example.test")).toBeVisible();
  await page.getByRole("button", { name:"Confirm Rejection" }).click();
  await expect(page.getByText(/test moderation action completed: rejected/i)).toBeVisible();

  await page.goto(`/admin/submissions/${recommendedId}`);
  await page.getByRole("button", { name:"Approve and publish" }).click();
  await expect(page.getByText(/Published successfully/i)).toBeVisible();

  await page.goto(`/admin/submissions/${pendingId}`);
  await page.getByRole("checkbox", { name:/public visibility and count/i }).check();
  await page.getByRole("button", { name:"Move to Trash" }).click();
  await expect(page.getByText(/test moderation action completed: trashed/i)).toBeVisible();

  await page.goto(`/admin/submissions/${trashedId}`);
  await page.getByRole("button", { name:"Regenerate and restore publication" }).click();
  await expect(page.getByText(/test moderation action completed: restored/i)).toBeVisible();

  await page.goto(`/admin/submissions/${trashedId}`);
  await page.getByLabel("Permanent deletion reason").fill("Delete generated Playwright fixture only.");
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await page.getByRole("button", { name:"Permanently delete" }).click();
  await expect(page).toHaveURL(/status=trashed&testAction=deleted/);

  await page.getByRole("link", { name:"Team" }).click();
  await expect(page.getByRole("heading", { name:"Team" })).toBeVisible();
  await page.getByRole("link", { name:"Settings" }).click();
  await expect(page.getByRole("heading", { name:"Settings" })).toBeVisible();
});

test("Campaign Desk has no serious or critical accessibility violations", async ({ page }) => {
  await signInAs(page, "admin");
  await page.goto("/admin");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
});
