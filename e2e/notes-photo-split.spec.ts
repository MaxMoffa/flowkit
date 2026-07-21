import { test, expect } from "@playwright/test"

const onePixelPng = {
  name: "test.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  ),
}

async function goToNotesMediaGroup(page: import("@playwright/test").Page) {
  await page.goto("/")
  // odori is selected by default
  await page.getByRole("button", { name: "Segnala un odore →" }).click()

  await page.getByRole("region", { name: "Map" }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click()
  await page.locator(".fk-card").first().click()
  await page.getByRole("button", { name: "Continua", exact: true }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click() // scale, auto-init
  await page.locator(".fk-chip").first().click()
  await page.getByRole("button", { name: "Continua", exact: true }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click() // faces, optional, skip

  await expect(page.getByRole("heading", { name: "Vuoi aggiungere altro?" })).toBeVisible()
}

test("notes+media group: both optional steps render independently and are skippable", async ({ page }) => {
  await goToNotesMediaGroup(page)
  const continueBtn = page.getByRole("button", { name: "Continua", exact: true })
  await expect(continueBtn).toBeEnabled() // both children optional -> skippable

  await page.getByPlaceholder("Es. l'odore aumenta quando tira vento da nord…").fill("Molto forte stamattina")
  await expect(page.getByText("Aggiungi una foto")).toBeVisible()
  await expect(continueBtn).toBeEnabled()

  // the gap between the notes textarea and the media control below it shouldn't
  // compound the group's own item gap with the textarea's standalone bottom margin
  const textareaBox = await page.locator(".fk-textarea").boundingBox()
  const mediaBox = await page.locator(".fk-group-item").nth(1).boundingBox()
  expect(mediaBox!.y - (textareaBox!.y + textareaBox!.height)).toBeLessThanOrEqual(20)

  await continueBtn.click()
  await expect(page.getByRole("heading", { name: "Tutto pronto?" })).toBeVisible()
})

test("media step: capture and library are two distinct file inputs", async ({ page }) => {
  await goToNotesMediaGroup(page)

  const actions = page.locator(".fk-media-actions")
  await expect(actions.locator("input[capture]")).toHaveCount(1)
  await expect(actions.locator("input:not([capture])")).toHaveCount(1)
  // library input accepts more than one file at a time
  await expect(actions.locator("input:not([capture])")).toHaveAttribute("multiple", "")
})

test("media step: add multiple photos, remove one, preview via lightbox", async ({ page }) => {
  await goToNotesMediaGroup(page)

  const libraryInput = page.locator(".fk-media-actions input:not([capture])")
  await libraryInput.setInputFiles([onePixelPng, { ...onePixelPng, name: "test2.png" }])

  const thumbs = page.locator(".fk-media-thumb")
  await expect(thumbs).toHaveCount(2)

  // remove the first one via its X button
  await thumbs.first().locator(".fk-media-remove").click()
  await expect(thumbs).toHaveCount(1)

  // clicking the thumbnail itself (not the X) opens a full-size lightbox
  await thumbs.first().click()
  const lightbox = page.locator(".fk-media-lightbox")
  await expect(lightbox).toBeVisible()
  await expect(lightbox.locator("img")).toBeVisible()

  // the lightbox has its own remove control
  await lightbox.locator(".fk-media-lightbox-remove").click()
  await expect(lightbox).toBeHidden()
  await expect(thumbs).toHaveCount(0)
})
