import { expect, test, type Page } from "@playwright/test";

/** Switch the acting user from the header menu. */
async function actAs(page: Page, name: string) {
  await page.getByRole("button", { name: /Switch user/ }).click();
  await page.getByRole("menuitem", { name: new RegExp(name) }).click();
  await expect(page.getByRole("button", { name: new RegExp(`Signed in as ${name}`) })).toBeVisible();
}

/** Click the first enabled button with this name, waiting for agents to finish. */
async function press(page: Page, name: string, timeout = 30_000) {
  const button = page.getByRole("button", { name, exact: true }).first();
  await expect(button).toBeEnabled({ timeout });
  await button.click();
}

test("a problem goes from creation to a merged pull request", async ({ page }) => {
  await page.goto("/?speed=20", { waitUntil: "networkidle" });

  // Create from the Overview composer. Retry until hydrated: an early click is lost.
  const input = page.getByLabel("Describe what you need");
  await expect(async () => {
    await input.fill("E2E: faster exception triage");
    await page.getByRole("button", { name: "Start research", exact: true }).click();
    await expect(page).toHaveURL(/\/workstreams\/ws-/, { timeout: 2_000 });
  }).toPass({ timeout: 20_000 });

  // Scout finishes on its own, then the owner generates and sends the plan.
  await press(page, "Generate plan");
  await press(page, "Request review");

  // Architect comments; approval stays blocked while the comment is open.
  await actAs(page, "Aisha Rahman");
  const review = page.getByRole("region", { name: "Review comments" });
  await review.getByLabel("New comment").fill("Name the flag service and who owns it.");
  await review.getByRole("button", { name: "Comment", exact: true }).click();
  await expect(review.getByText("Name the flag service and who owns it.")).toBeVisible();

  // Owner revises from the comment into version 2.
  await actAs(page, "Alex Curtin");
  await press(page, "Revise from comments");
  await expect(page.getByRole("heading", { name: "Plan v2" })).toBeVisible({ timeout: 30_000 });

  await actAs(page, "Aisha Rahman");
  await press(page, "Approve plan");

  await actAs(page, "Alex Curtin");
  await press(page, "Hand off to Runner");
  await page.getByRole("dialog").getByRole("button", { name: "Hand off", exact: true }).click();

  // The Runner pauses with a question, then opens a PR once answered.
  await press(page, "Smallest safe change");
  await press(page, "Merge pull request");
  await expect(page.getByRole("complementary", { name: "Merged" }).getByRole("heading", { name: "Merged" })).toBeVisible();

  await page.goto("/audit");
  const log = page.getByRole("region", { name: "Audit log" });
  await expect(log.getByText(/Merged pull request #/).first()).toBeVisible();
  await expect(log.getByText("Approved plan v2").first()).toBeVisible();
  await expect(log.getByText(/Answered the Runner/).first()).toBeVisible();
});

test("every primary view renders without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  for (const path of ["/", "/workstreams", "/workstreams/demo-ws-context", "/workstreams/new", "/ideas", "/knowledge", "/metrics", "/audit"]) {
    await page.goto(path);
    await expect(page.locator("main h1").first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});
