import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

test.describe("info step", () => {
  test("is insertable mid-flow and repeatable, adds no field to collected data", async ({ page }) => {
    await openPreset(page, { preset: "info-long-content-demo" })

    // First "info" step, right after intro — no required field, "Continua" just advances.
    await expect(page.getByRole("heading", { name: "Prima di iniziare" })).toBeVisible()
    const primary = page.getByRole("button", { name: "Continua", exact: true })
    await expect(primary).toBeEnabled()
    await primary.click()

    // A normal question in between.
    await expect(page.getByRole("heading", { name: "Come ti chiami?" })).toBeVisible()
    await page.locator(".fk-input").fill("Ada")
    await primary.click()

    // Scroll the long-content step to the end so "Continua" unlocks, then move past it.
    await page.locator(".fk-long-content-scroll").evaluate((el) => el.scrollTo(0, el.scrollHeight))
    await expect(primary).toBeEnabled()
    await primary.click()

    // A second, later "info" step — proves it isn't pinned to one position like intro.
    await expect(page.getByRole("heading", { name: "Fatto!" })).toBeVisible()
  })
})
