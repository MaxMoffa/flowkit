import { test, expect, devices } from "@playwright/test"
import { openPreset, continueStep } from "./helpers/open-preset"

const onePixelPng = {
  name: "test.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  ),
}

// Headless Chromium here has no real camera and no `--use-fake-device-for-media-stream`
// flag, so `getUserMedia` always ends up denied/unavailable — the one path
// deterministically exercisable across browsers/devices without mocking a camera
// (barcode-scan's e2e suite reaches the same conclusion; see DECISIONS.md). That
// degrades photo.tsx to the previous `<input type="file" capture="environment">`
// mechanism, which is what every assertion below walks through.

test.describe("photo step: falls back to the file input when no camera is available — desktop", () => {
  test("announces a camera status, then shows exactly one capture input, never a gallery", async ({ page }) => {
    await openPreset(page, { preset: "camera-demo", cta: "Inizia" })

    await expect(page.locator("[role='status']").first()).toBeVisible()

    const actions = page.locator(".fk-media-actions")
    const inputs = actions.locator("input[type='file']")
    await expect(inputs).toHaveCount(1)
    await expect(actions.locator("input[capture]")).toHaveCount(1)
  })

  test("captures a photo, shows a thumbnail, and lets you continue without a gallery ever appearing", async ({ page }) => {
    await openPreset(page, { preset: "camera-demo", cta: "Inizia" })

    const captureInput = page.locator(".fk-media-actions input[capture]")
    await captureInput.setInputFiles([onePixelPng])

    await expect(page.locator(".fk-media-thumb")).toHaveCount(1)
    // maxPhotos: 2 in the demo — the capture input stays available for a second shot.
    await expect(page.locator(".fk-media-actions")).toBeVisible()

    await continueStep(page)
    await expect(page.getByRole("heading", { name: "Scansiona il codice del prodotto" })).toBeVisible()
  })

  test("removing the only photo brings the capture input back", async ({ page }) => {
    await openPreset(page, { preset: "camera-demo", cta: "Inizia" })
    const captureInput = page.locator(".fk-media-actions input[capture]")
    await captureInput.setInputFiles([onePixelPng])
    await expect(page.locator(".fk-media-thumb")).toHaveCount(1)

    await page.locator(".fk-media-remove").click()
    await expect(page.locator(".fk-media-thumb")).toHaveCount(0)
    await expect(page.locator(".fk-media-actions input[capture]")).toHaveCount(1)
  })

  test("is optional: skippable with no photo", async ({ page }) => {
    await openPreset(page, { preset: "camera-demo", cta: "Inizia" })
    await continueStep(page)
    await expect(page.getByRole("heading", { name: "Scansiona il codice del prodotto" })).toBeVisible()
  })
})

test.describe("photo step: capture input on mobile", () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { defaultBrowserType, ...iphoneContext } = devices["iPhone 13"]!
  test.use(iphoneContext)

  test("still falls back to exactly one camera-capture input, no separate gallery button", async ({ page }) => {
    await openPreset(page, { preset: "camera-demo", cta: "Inizia" })
    const actions = page.locator(".fk-media-actions")
    await expect(actions.locator("input[type='file']")).toHaveCount(1)
    await expect(actions.locator("input[capture]")).toHaveCount(1)
  })
})
