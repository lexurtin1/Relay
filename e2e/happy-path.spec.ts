import { expect, test } from "@playwright/test";

test("guided tour takes a problem to a merged pull request", async ({ page }) => {
  await page.goto("/?speed=20", { waitUntil: "networkidle" });
  const coach = page.getByRole("complementary", { name: "Guided tour" });
  // Retry until hydrated: a click before React attaches handlers is lost.
  await expect(async () => {
    await page.getByRole("button", { name: "Take the tour" }).click();
    await expect(coach).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 20_000 });
  const next = coach.getByRole("button", { name: "Next" });

  const step = async (doLabel?: string) => {
    if (doLabel) {
      const doIt = coach.getByRole("button", { name: doLabel });
      await expect(doIt).toBeEnabled({ timeout: 30_000 });
      await doIt.click();
    }
    await expect(next).toBeEnabled({ timeout: 30_000 });
    await next.click();
  };

  await step(); // the relay
  await step("Create the workstream");
  await expect(page).toHaveURL(/\/workstreams\/ws-/);
  const wsUrl = page.url();
  await step(); // Scout finishes on its own
  await step("Generate plan");
  await step("Request review");
  await step("Add Aisha's comment");
  await step("Revise from comments");
  await step("Approve as Aisha");
  await step("Hand off");
  await step("Answer: smallest safe change");
  await step("Merge");

  await expect(page).toHaveURL(/\/metrics/);
  await step(); // metrics
  await expect(page).toHaveURL(/\/audit/);
  await coach.getByRole("button", { name: "Finish" }).click();

  await page.goto(wsUrl);
  await expect(page.getByRole("heading", { name: "Shipped" })).toBeVisible();

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
