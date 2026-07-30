import { test, expect, devices } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

const onePixelPng = {
  name: "test.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  ),
}

async function goToNotesMediaGroup(page: import("@playwright/test").Page) {
  await openPreset(page, { cta: "Segnala un odore →" })

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

test.describe("media step: capture button (mobile only)", () => {
  // Only the UA/viewport/touch bits, not `defaultBrowserType` (iPhone 13 forces webkit,
  // which can't be set inside a describe-scoped `.use()` — the suite runs on Chromium).
  const { defaultBrowserType: _defaultBrowserType, ...iphoneContext } = devices["iPhone 13"]!
  test.use(iphoneContext)

  test("mobile with a camera: capture and library are two distinct file inputs", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "mediaDevices", {
        value: { enumerateDevices: async () => [{ kind: "videoinput" }] },
        configurable: true,
      })
    })
    await goToNotesMediaGroup(page)

    const actions = page.locator(".fk-media-actions")
    await expect(actions.locator("input[capture]")).toHaveCount(1)
    await expect(actions.locator("input:not([capture])")).toHaveCount(1)
    // library input accepts more than one file at a time
    await expect(actions.locator("input:not([capture])")).toHaveAttribute("multiple", "")
  })

  test("mobile confirmed with no camera: falls back to the upload-only button", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "mediaDevices", {
        value: { enumerateDevices: async () => [{ kind: "audioinput" }] },
        configurable: true,
      })
    })
    await goToNotesMediaGroup(page)

    const actions = page.locator(".fk-media-actions")
    await expect(actions.locator("input[capture]")).toHaveCount(0)
    await expect(actions.locator("input:not([capture])")).toHaveCount(1)
  })
})

test("media step: desktop shows only the upload button (no camera capture)", async ({ page }) => {
  await goToNotesMediaGroup(page)

  const actions = page.locator(".fk-media-actions")
  await expect(actions.locator("input[capture]")).toHaveCount(0)
  await expect(actions.locator("input:not([capture])")).toHaveCount(1)
  await expect(actions.locator("input:not([capture])")).toHaveAttribute("multiple", "")
})

test("media step: add multiple photos, remove one via the grid's X button", async ({ page }) => {
  await goToNotesMediaGroup(page)

  const libraryInput = page.locator(".fk-media-actions input:not([capture])")
  await libraryInput.setInputFiles([onePixelPng, { ...onePixelPng, name: "test2.png" }])

  const thumbs = page.locator(".fk-media-thumb")
  await expect(thumbs).toHaveCount(2)

  await thumbs.first().locator(".fk-media-remove").click()
  await expect(thumbs).toHaveCount(1)
})

test("media step: clicking a thumbnail opens the full viewer", async ({ page }) => {
  await goToNotesMediaGroup(page)

  const libraryInput = page.locator(".fk-media-actions input:not([capture])")
  await libraryInput.setInputFiles([onePixelPng])
  await page.locator(".fk-media-thumb").first().click()

  await expect(page.locator(".fk-media-viewer")).toBeVisible()
  await expect(page.locator(".fk-media-viewer img")).toBeVisible()
})
