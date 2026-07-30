import { test, expect } from "@playwright/test"
import { openPreset, continueStep } from "./helpers/open-preset"

test.describe("booking-slot step", () => {
  test("shows dates then times, with per-slot availability, and selecting an available slot advances", async ({
    page,
  }) => {
    await openPreset(page, { preset: "booking-slot-demo", cta: "Inizia" })

    const firstDate = page.getByRole("tab", { name: "Lun 03/08" })
    await expect(firstDate).toBeVisible()
    await expect(firstDate).toHaveAttribute("aria-selected", "true")

    const slotFull = page.getByRole("button", { name: /09:00/ })
    await expect(slotFull).toHaveText(/Esaurito/)
    await expect(slotFull).toBeDisabled()

    const slotLimited = page.getByRole("button", { name: /09:30/ })
    await expect(slotLimited).toHaveText(/Pochi posti/)
    await expect(slotLimited).toBeEnabled()

    const slotAvailable = page.getByRole("button", { name: /10:30/ })
    await expect(slotAvailable).toHaveText(/Disponibile/)

    // Clicking the exhausted slot is a no-op (disabled), Continua stays blocked.
    await slotFull.click({ force: true })
    await expect(page.getByRole("button", { name: "Continua", exact: true })).toBeDisabled()

    await slotAvailable.click()
    await expect(slotAvailable).toHaveAttribute("aria-pressed", "true")
    await continueStep(page)

    await expect(page.getByRole("heading", { name: "Prenotazione confermata!" })).toBeVisible()
  })

  test("switching the selected date re-renders that date's own slots", async ({ page }) => {
    await openPreset(page, { preset: "booking-slot-demo", cta: "Inizia" })

    await expect(page.getByRole("button", { name: /09:00/ })).toHaveText(/Esaurito/)

    await page.getByRole("tab", { name: "Mar 04/08" }).click()

    // Tuesday has no remainingOverrides seeded: every slot should be fully available.
    await expect(page.getByRole("button", { name: /09:00/ })).toHaveText(/Disponibile/)
    await expect(page.getByRole("button", { name: /09:00/ })).toBeEnabled()
  })
})
