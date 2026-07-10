import { test, expect } from "@playwright/test"

test.describe("custom-intro preset (role intro/confirmation)", () => {
  test("renders custom intro/confirmation bodies with the standard sticky CTA/footer", async ({ page }) => {
    await page.goto("/")
    await page.getByLabel("Preset", { exact: true }).selectOption("custom-intro")

    // custom intro body renders, header hidden, CTA label comes from the custom step's own field
    await expect(page.locator(".fk-step-intro-hero")).toBeVisible()
    await expect(page.locator(".fk-header")).toHaveCount(0)
    const cta = page.getByRole("button", { name: "Scopri di più" })
    await expect(cta).toBeVisible()
    await cta.click()

    // faces step in the middle
    await page.locator(".fk-face").first().click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    // custom confirmation body + standard two-button sticky footer
    await expect(page.locator(".fk-step-confirmation-hero")).toBeVisible()
    await expect(page.locator(".fk-header")).toHaveCount(0)
    await expect(page.getByRole("button", { name: "Torna alla home" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Rifai la demo" })).toBeVisible()
  })
})
