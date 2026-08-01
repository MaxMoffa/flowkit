import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

test.describe("field validation messages: timing, focus and accessibility", () => {
  test("blur-then-live timing: silent while typing, message on blur, clears live once fixed, reappears live if broken again", async ({
    page,
  }) => {
    await openPreset(page, { preset: "anagrafica", start: false })
    await page.getByRole("button", { name: "Inizia →" }).click()

    const continueBtn = page.getByRole("button", { name: "Continua", exact: true })
    await page.getByPlaceholder("Es. Mario").fill("Mario")
    await continueBtn.click()
    await page.getByPlaceholder("Es. Rossi").fill("Rossi")
    await continueBtn.click()
    await page.locator("input[type='date']").fill("1990-05-20")
    await continueBtn.click()
    await page.getByPlaceholder("Es. Milano (MI)").fill("Milano (MI)")
    await continueBtn.click()
    await page.getByPlaceholder("Es. RSSMRA80A01F205X").fill("RSSMRA80A01H501U")
    await continueBtn.click()
    await page.getByPlaceholder("Via, numero civico, città").fill("Via Roma 1, Milano")
    await continueBtn.click()

    // Landed on the "email" step.
    const emailInput = page.getByPlaceholder("tuo@email.it")
    const error = page.locator("#email-error")
    await expect(page.getByRole("heading", { name: "Email" })).toBeVisible()

    // Typing an invalid value stays silent until the field is blurred (no premature error).
    await emailInput.fill("not-an-email")
    await expect(error).toHaveCount(0)
    await expect(emailInput).not.toHaveAttribute("aria-invalid", "true")

    // Blur: the explicit, field-anchored message appears, wired via aria-invalid/aria-describedby.
    await emailInput.press("Tab")
    await expect(error).toBeVisible()
    await expect(error).toContainText(/formato non valido/i)
    await expect(emailInput).toHaveAttribute("aria-invalid", "true")
    await expect(emailInput).toHaveAttribute("aria-describedby", "email-error")
    await expect(continueBtn).toBeDisabled()

    // Live mode kicked in after the first error: fixing it clears the error immediately,
    // without needing to blur again.
    await emailInput.fill("mario.rossi@example.com")
    await expect(error).toHaveCount(0)
    await expect(continueBtn).toBeEnabled()

    // Still live: breaking it again shows the error right away too.
    await emailInput.fill("broken again")
    await expect(error).toBeVisible()
    await expect(continueBtn).toBeDisabled()

    await emailInput.fill("mario.rossi@example.com")
    await expect(error).toHaveCount(0)
    await continueBtn.click()
    await expect(page.getByRole("heading", { name: "Telefono" })).toBeVisible()
  })

  test("required field shows the required message (not a format message) when left empty", async ({ page }) => {
    await openPreset(page, { preset: "anagrafica", start: false })
    await page.getByRole("button", { name: "Inizia →" }).click()

    const nomeInput = page.getByPlaceholder("Es. Mario")
    await nomeInput.click()
    await nomeInput.press("Tab")
    const error = page.locator("#nome-error")
    await expect(error).toBeVisible()
    await expect(error).toContainText(/obbligatorio/i)
  })
})

test.describe("group step: error summary and Enter-to-attempt focus", () => {
  async function openGroupAnd(page: import("@playwright/test").Page) {
    await openPreset(page, { preset: "features-demo" })
    for (let i = 0; i < 9; i++) {
      await page.getByRole("button", { name: "Continua", exact: true }).click()
    }
    await page.locator(".fk-scale-pill", { hasText: "5" }).click()
    await page.getByRole("button", { name: "Velocità" }).click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()
    await page.locator(".fk-step-radio .fk-list-item").first().click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()
    await expect(page.getByRole("heading", { name: "Entrambi i campi richiesti (AND)" })).toBeVisible()
  }

  test("Enter in an invalid field attempts to advance, surfaces both errors as a summary (2+), and focuses the first invalid field", async ({
    page,
  }) => {
    await openGroupAnd(page)

    const fieldA = page.getByPlaceholder("Campo A")
    const fieldB = page.getByPlaceholder("Campo B")
    const summary = page.locator(".fk-error-summary")

    await expect(summary).toHaveCount(0)

    // Focus B, press Enter there: the attempt can't advance (both required, both
    // empty), so it surfaces errors and moves focus to the first invalid field (A).
    await fieldB.click()
    await fieldB.press("Enter")

    await expect(summary).toBeVisible()
    await expect(summary.locator("li")).toHaveCount(2)
    await expect(fieldA).toHaveAttribute("aria-invalid", "true")
    await expect(fieldB).toHaveAttribute("aria-invalid", "true")
    await expect(fieldA).toBeFocused()

    // Fill only A: group ("all") still isn't satisfied, so exactly one field remains
    // invalid — the summary must drop to inline-only per field.
    await fieldA.fill("x")
    await fieldB.press("Enter")
    await expect(summary).toHaveCount(0)
    await expect(page.locator("#b-error")).toBeVisible()

    await fieldB.fill("y")
    await expect(page.locator("#b-error")).toHaveCount(0)
    await expect(page.getByRole("button", { name: "Continua", exact: true })).toBeEnabled()
  })
})
