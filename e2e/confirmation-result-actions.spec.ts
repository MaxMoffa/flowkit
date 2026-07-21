import { test, expect } from "@playwright/test"

test.describe("confirmation resultActions", () => {
  test("pdfExport: renders a hidden print recap and a download button", async ({ page }) => {
    await page.goto("/")
    await page.getByLabel("Preset", { exact: true }).selectOption("result-actions-demo")
    await page.getByRole("button", { name: "Prova" }).click()
    await page.locator(".fk-scale-pill", { hasText: "5" }).click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    await expect(page.getByRole("heading", { name: "Grazie!" })).toBeVisible()
    const printRecap = page.locator(".fk-print-recap")
    await expect(printRecap).toHaveCount(1)
    // the recap reuses the review step's styled row markup (icon + dt/dd), not plain text
    const row = printRecap.locator(".fk-review-row")
    await expect(row).toHaveCount(1)
    await expect(row.locator("dt")).toHaveText("Quanto sei soddisfatto?")
    await expect(row.locator("dd")).toHaveText("5")

    await expect(page.getByRole("button", { name: "Scarica PDF" })).toBeVisible()
  })

  test("nativeShare: button only renders when navigator.share is available", async ({ page }) => {
    await page.goto("/")
    await page.getByLabel("Preset", { exact: true }).selectOption("result-actions-demo")
    await page.getByRole("button", { name: "Prova" }).click()
    await page.locator(".fk-scale-pill", { hasText: "5" }).click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    // Headless Chromium has no navigator.share by default.
    await expect(page.getByRole("button", { name: "Condividi" })).toHaveCount(0)
  })

  test("nativeShare: button renders and is clickable when navigator.share is shimmed", async ({ page }) => {
    await page.addInitScript(() => {
      // @ts-expect-error test shim
      window.navigator.share = () => Promise.resolve()
    })
    await page.goto("/")
    await page.getByLabel("Preset", { exact: true }).selectOption("result-actions-demo")
    await page.getByRole("button", { name: "Prova" }).click()
    await page.locator(".fk-scale-pill", { hasText: "5" }).click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    const shareBtn = page.getByRole("button", { name: "Condividi" })
    await expect(shareBtn).toBeVisible()
    await shareBtn.click()
  })

  test("resultLink: generates a copyable link", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-write", "clipboard-read"])
    await page.goto("/")
    await page.getByLabel("Preset", { exact: true }).selectOption("result-actions-demo")
    await page.getByRole("button", { name: "Prova" }).click()
    await page.locator(".fk-scale-pill", { hasText: "5" }).click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    await page.getByRole("button", { name: "Genera link" }).click()
    const linkInput = page.locator(".fk-result-link input[type='text']")
    await expect(linkInput).toHaveValue(/result=/)

    await page.getByRole("button", { name: "Copia" }).click()
    await expect(page.getByText("Link copiato ✓")).toBeVisible()
  })

  test("emailApi: success and error states", async ({ page }) => {
    await page.goto("/")
    await page.getByLabel("Preset", { exact: true }).selectOption("result-actions-demo")
    await page.getByRole("button", { name: "Prova" }).click()
    await page.locator(".fk-scale-pill", { hasText: "5" }).click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    await page.route("**/api/flows/**/receipt-email", (route) => route.fulfill({ status: 200, body: "{}" }))
    await page.getByPlaceholder("tuo@email.it").fill("mario@example.com")
    await page.getByRole("button", { name: "Invia via email (server)" }).click()
    await expect(page.getByText("Email inviata ✓")).toBeVisible()
  })

  test("emailApi: shows an error message on failure", async ({ page }) => {
    await page.goto("/")
    await page.getByLabel("Preset", { exact: true }).selectOption("result-actions-demo")
    await page.getByRole("button", { name: "Prova" }).click()
    await page.locator(".fk-scale-pill", { hasText: "5" }).click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    await page.route("**/api/flows/**/receipt-email", (route) => route.fulfill({ status: 500, body: "error" }))
    await page.getByPlaceholder("tuo@email.it").fill("mario@example.com")
    await page.getByRole("button", { name: "Invia via email (server)" }).click()
    await expect(page.getByText("Invio fallito. Riprova.")).toBeVisible()
  })
})
