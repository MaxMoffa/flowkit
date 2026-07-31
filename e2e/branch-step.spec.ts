import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

test.describe("branch step", () => {
  test("skips the irrelevant question and never shows the branch step itself", async ({ page }) => {
    await openPreset(page, { preset: "branch-demo" })

    await expect(page.getByRole("heading", { name: "Hai un animale domestico?" })).toBeVisible()
    await page.getByRole("radio", { name: "No" }).check()
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    // Jumps straight to the review, skipping "pet-name" and never rendering the
    // branch step's own chrome.
    await expect(page.getByRole("heading", { name: "Come si chiama?" })).toHaveCount(0)
    await expect(page.getByText("Rivedi le risposte")).toBeVisible()
    await expect(page.getByText("Come si chiama?")).toHaveCount(0)
  })

  test("takes the fallback (natural next) path when the rule doesn't match", async ({ page }) => {
    await openPreset(page, { preset: "branch-demo" })

    await page.getByRole("radio", { name: "Sì" }).check()
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    await expect(page.getByRole("heading", { name: "Come si chiama?" })).toBeVisible()
    await page.locator(".fk-input").fill("Fido")
    await page.getByRole("button", { name: "Continua", exact: true }).click()
    await expect(page.getByText("Rivedi le risposte")).toBeVisible()
    await expect(page.getByText("Fido")).toBeVisible()
  })

  test("Back from the review follows the actually-taken path, skipping the invisible branch", async ({ page }) => {
    await openPreset(page, { preset: "branch-demo" })

    await page.getByRole("radio", { name: "No" }).check()
    await page.getByRole("button", { name: "Continua", exact: true }).click()
    await expect(page.getByText("Rivedi le risposte")).toBeVisible()

    // Desktop viewport moves the back affordance from the header (hidden here) into
    // a text-only button in the footer, see playground-desktop.spec.ts.
    await page.locator(".fk-footer-back").click()
    await expect(page.getByRole("heading", { name: "Hai un animale domestico?" })).toBeVisible()
  })
})
