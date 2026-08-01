import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

/**
 * Regression coverage for the progress bar/counter: it must reflect the path the
 * current answers actually put the user on (skipping branch-skipped steps), not
 * flow.steps.length — see core's resolveFlowPath/getProgressInfo.
 */
test.describe("branch-aware progress bar", () => {
  test("counter shows the optimistic (fallback) total before answering, then updates live on choice, then reflects the shortened path after the branch skips a step", async ({
    page,
  }) => {
    await openPreset(page, { preset: "branch-demo" })

    const stepno = page.locator(".fk-stepno")
    const continueBtn = page.getByRole("button", { name: "Continua", exact: true })

    // "has-pet" -> "pet-name" -> "review": 3 middle steps is the fallback/optimistic
    // guess before the branching question is answered.
    await expect(stepno).toHaveText("1/3")

    // Picking "No" resolves the branch live, before even clicking Continua: the total
    // drops to 2 (pet-name gets skipped) without any navigation happening yet.
    await page.getByRole("radio", { name: "No" }).check()
    await expect(stepno).toHaveText("1/2")

    await continueBtn.click()
    // Jumped straight to "review", skipping "pet-name" and the invisible branch step.
    await expect(page.getByText("Rivedi le risposte")).toBeVisible()
    await expect(stepno).toHaveText("2/2")
  })

  test("counter stays at the full 3-step total when the answer takes the fallback (non-skipping) path", async ({
    page,
  }) => {
    await openPreset(page, { preset: "branch-demo" })

    const stepno = page.locator(".fk-stepno")
    const continueBtn = page.getByRole("button", { name: "Continua", exact: true })

    await page.getByRole("radio", { name: "Sì" }).check()
    await expect(stepno).toHaveText("1/3")
    await continueBtn.click()

    await expect(page.getByRole("heading", { name: "Come si chiama?" })).toBeVisible()
    await expect(stepno).toHaveText("2/3")

    await page.locator(".fk-input").fill("Fido")
    await continueBtn.click()
    await expect(page.getByText("Rivedi le risposte")).toBeVisible()
    await expect(stepno).toHaveText("3/3")
  })
})
