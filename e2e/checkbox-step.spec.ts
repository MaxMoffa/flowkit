import { test, expect } from "@playwright/test"
import { openPreset, continueStep } from "./helpers/open-preset"

async function reachAnagraficaCheckboxStep(page: import("@playwright/test").Page): Promise<void> {
  await openPreset(page, { preset: "anagrafica", start: false })
  await page.getByRole("button", { name: "Inizia →" }).click()
  await page.getByPlaceholder("Es. Mario").fill("Mario")
  await continueStep(page)
  await page.getByPlaceholder("Es. Rossi").fill("Rossi")
  await continueStep(page)
  await page.locator("input[type='date']").fill("1990-05-20")
  await continueStep(page)
  await page.getByPlaceholder("Es. Milano (MI)").fill("Milano (MI)")
  await continueStep(page)
  await page.getByPlaceholder("Es. RSSMRA80A01F205X").fill("RSSMRA80A01H501U")
  await continueStep(page)
  await page.getByPlaceholder("Via, numero civico, città").fill("Via Roma 1, Milano")
  await continueStep(page)
  await page.getByPlaceholder("tuo@email.it").fill("mario.rossi@example.com")
  await continueStep(page)
  await page.getByPlaceholder("Es. 333 1234567").fill("333 1234567")
  await continueStep(page)
  await expect(page.getByRole("heading", { name: "Privacy" })).toBeVisible()
}

test.describe("checkbox step", () => {
  test("selection box matches the multi-select box size, row meets the 44x44 touch target, and disabled/checked states stay consistent with the list input", async ({
    page,
  }) => {
    // Reference size: the shared .fk-list-input box on a multi-select step.
    await openPreset(page, { preset: "feedback", start: false })
    await page.getByRole("button", { name: "Inizia" }).click()
    await continueStep(page) // faces (mood) -> nps
    await page.locator(".fk-nps-cell").nth(8).click()
    await continueStep(page) // nps -> multi-select

    const listInput = page.locator(".fk-step-multi-select .fk-list-input").first()
    await expect(listInput).toBeVisible()
    const listInputBox = await listInput.boundingBox()
    expect(listInputBox).not.toBeNull()

    const listInputDisabledOpacity = await listInput.evaluate((el: HTMLInputElement) => {
      el.disabled = true
      const opacity = getComputedStyle(el).opacity
      el.disabled = false
      return opacity
    })

    // Now the checkbox step, on a different preset/page.
    await reachAnagraficaCheckboxStep(page)

    const row = page.locator(".fk-checkbox-row")
    const checkboxInput = row.locator("input[type='checkbox']")

    // Size parity: same box dimensions as the multi-select's .fk-list-input (shared token).
    const checkboxInputBox = await checkboxInput.boundingBox()
    expect(checkboxInputBox).not.toBeNull()
    expect(checkboxInputBox!.width).toBeCloseTo(listInputBox!.width, 0)
    expect(checkboxInputBox!.height).toBeCloseTo(listInputBox!.height, 0)

    // Touch target: the whole clickable row is at least 44x44.
    const rowBox = await row.boundingBox()
    expect(rowBox).not.toBeNull()
    expect(rowBox!.height).toBeGreaterThanOrEqual(44)

    // Disabled state matches the list input's (same opacity/cursor treatment).
    const checkboxDisabledOpacity = await checkboxInput.evaluate((el: HTMLInputElement) => {
      el.disabled = true
      const opacity = getComputedStyle(el).opacity
      el.disabled = false
      return opacity
    })
    expect(checkboxDisabledOpacity).toBe(listInputDisabledOpacity)

    // Checked state toggles normally and unblocks Continua.
    const continueBtn = page.getByRole("button", { name: "Continua", exact: true })
    await expect(continueBtn).toBeDisabled()
    await checkboxInput.check()
    await expect(checkboxInput).toBeChecked()
    await expect(continueBtn).toBeEnabled()
  })
})
