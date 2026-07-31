import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

test.describe("flow.texts override", () => {
  test("overrides the intro CTA, footer back label, and confirmation buttons", async ({ page }) => {
    // intro's own `cta` field still wins (step-authored default), not flow.texts.continue —
    // check that before openPreset's default flow clicks straight past the intro screen.
    await openPreset(page, { preset: "i18n-texts-demo", start: false })
    await expect(page.getByRole("button", { name: "Prova", exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Prova", exact: true }).click()

    await page.locator(".fk-input").fill("Risposta")
    await page.getByRole("button", { name: "Vai avanti", exact: true }).click()
    await expect(page.locator(".fk-step-confirmation")).toBeVisible()

    await expect(page.getByRole("button", { name: "Ricomincia da capo", exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "Chiudi", exact: true })).toBeVisible()
  })

  test("overrides the footer back label", async ({ page }) => {
    await openPreset(page, { preset: "i18n-texts-demo" })
    await page.locator(".fk-input").fill("x")
    // Not clicking continue: stay on q1, whose footer/header already show the override.
    await expect(page.locator(".fk-footer-back")).toHaveText(/Torna indietro/)
  })
})
