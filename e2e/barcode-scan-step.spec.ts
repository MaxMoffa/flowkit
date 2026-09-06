import { test, expect } from "@playwright/test"
import { openPreset, continueStep } from "./helpers/open-preset"

async function goToBarcodeStep(page: import("@playwright/test").Page) {
  await openPreset(page, { preset: "camera-demo", cta: "Inizia" })
  await continueStep(page) // photo step, optional, skip with no photo
  await expect(page.getByRole("heading", { name: "Scansiona il codice del prodotto" })).toBeVisible()
}

test.describe("barcode-scan step", () => {
  test("the manual entry field is always reachable, not hidden behind an error", async ({ page }) => {
    await goToBarcodeStep(page)
    await expect(page.locator(".fk-barcode-manual")).toBeVisible()
    await expect(page.getByPlaceholder("Codice")).toBeVisible()
  })

  test("announces a camera status for screen readers", async ({ page }) => {
    await goToBarcodeStep(page)
    await expect(page.locator("[role='status']").first()).toBeVisible()
  })

  test("typing a code directly enables Continue, with no separate confirm button", async ({ page }) => {
    await goToBarcodeStep(page)

    await expect(page.getByRole("button", { name: "Conferma" })).toHaveCount(0)

    const codeField = page.getByPlaceholder("Codice")
    await codeField.fill("0123456789012")
    await expect(codeField).toHaveValue("0123456789012")
    // Manual entry has no `format`, so it stays in the editable field — no
    // "found ✅ + rescan" swap that would otherwise hide it mid-typing.
    await expect(page.locator(".fk-barcode-result-code")).toHaveCount(0)

    await continueStep(page)
    await expect(page.getByRole("heading", { name: "Controlla" })).toBeVisible()
  })

  test("is optional: skippable with no scan, and the manually entered code shows up in the review", async ({ page }) => {
    await goToBarcodeStep(page)
    await page.getByPlaceholder("Codice").fill("ABC-999")
    await expect(page.getByPlaceholder("Codice")).toHaveValue("ABC-999")

    await continueStep(page)
    await expect(page.getByText("ABC-999")).toBeVisible()
  })
})
