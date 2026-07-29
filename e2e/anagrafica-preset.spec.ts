import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

test("anagrafica preset: completes the full flow end to end", async ({ page }) => {
  await openPreset(page, { preset: "anagrafica", start: false })
  await page.getByRole("button", { name: "Inizia →" }).click()

  const continueBtn = page.getByRole("button", { name: "Continua", exact: true })

  // nome
  await page.getByPlaceholder("Es. Mario").fill("Mario")
  await continueBtn.click()

  // cognome
  await page.getByPlaceholder("Es. Rossi").fill("Rossi")
  await continueBtn.click()

  // data di nascita
  await page.locator("input[type='date']").fill("1990-05-20")
  await continueBtn.click()

  // luogo di nascita
  await page.getByPlaceholder("Es. Milano (MI)").fill("Milano (MI)")
  await continueBtn.click()

  // codice fiscale: invalid format blocks Continua, valid format unblocks it
  const cfInput = page.getByPlaceholder("Es. RSSMRA80A01F205X")
  await cfInput.fill("not-a-fiscal-code")
  await expect(continueBtn).toBeDisabled()
  await cfInput.fill("RSSMRA80A01H501U")
  await expect(continueBtn).toBeEnabled()
  await continueBtn.click()

  // indirizzo
  await page.getByPlaceholder("Via, numero civico, città").fill("Via Roma 1, Milano")
  await continueBtn.click()

  // email
  await page.getByPlaceholder("tuo@email.it").fill("mario.rossi@example.com")
  await continueBtn.click()

  // telefono: invalid format blocks Continua, valid format unblocks it
  const phoneInput = page.getByPlaceholder("Es. 333 1234567")
  await phoneInput.fill("abc")
  await expect(continueBtn).toBeDisabled()
  await phoneInput.fill("333 1234567")
  await expect(continueBtn).toBeEnabled()
  await continueBtn.click()

  // consenso privacy: submitting is blocked until the checkbox is checked
  await expect(page.getByRole("heading", { name: "Privacy" })).toBeVisible()
  await expect(continueBtn).toBeDisabled()
  await page.getByLabel("Ho letto e accetto l'informativa sulla privacy").check()
  await expect(continueBtn).toBeEnabled()
  await continueBtn.click()

  // review -> submit
  await expect(page.getByRole("heading", { name: "Controlla i tuoi dati" })).toBeVisible()
  await expect(page.getByText("Mario", { exact: true })).toBeVisible()
  await expect(page.getByText("Rossi", { exact: true })).toBeVisible()
  await expect(page.getByText("✓ Accettato")).toBeVisible()
  await page.getByRole("button", { name: "Invia segnalazione ✓" }).click()

  await expect(page.locator(".fk-step-confirmation")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Dati inviati!" })).toBeVisible()
})
