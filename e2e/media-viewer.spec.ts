import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

const onePixelPng = {
  name: "test.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  ),
}

async function openMediaViewerWithNPhotos(page: import("@playwright/test").Page, n: number) {
  await openPreset(page, { cta: "Segnala un odore →" })
  await page.getByRole("region", { name: "Map" }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click()
  await page.locator(".fk-card").first().click()
  await page.getByRole("button", { name: "Continua", exact: true }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click() // scale, auto-init
  await page.locator(".fk-chip").first().click()
  await page.getByRole("button", { name: "Continua", exact: true }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click() // faces, optional, skip

  const libraryInput = page.locator(".fk-media-actions input:not([capture])")
  await libraryInput.setInputFiles(
    Array.from({ length: n }, (_, i) => ({ ...onePixelPng, name: `test${i}.png` })),
  )
  await page.locator(".fk-media-thumb").first().click()
  await expect(page.locator(".fk-media-viewer")).toBeVisible()
}

test.describe("media viewer", () => {
  test("shows the '<n> di <total>' position indicator, updated by arrow navigation", async ({ page }) => {
    await openMediaViewerWithNPhotos(page, 3)

    await expect(page.locator(".fk-media-viewer-position")).toHaveText("1 di 3")
    await page.getByRole("button", { name: "Successiva" }).click()
    await expect(page.locator(".fk-media-viewer-position")).toHaveText("2 di 3")
    await page.getByRole("button", { name: "Precedente" }).click()
    await expect(page.locator(".fk-media-viewer-position")).toHaveText("1 di 3")
  })

  test("keyboard ArrowRight/ArrowLeft navigate, Escape closes", async ({ page }) => {
    await openMediaViewerWithNPhotos(page, 2)

    await page.keyboard.press("ArrowRight")
    await expect(page.locator(".fk-media-viewer-position")).toHaveText("2 di 2")
    await page.keyboard.press("ArrowLeft")
    await expect(page.locator(".fk-media-viewer-position")).toHaveText("1 di 2")
    await page.keyboard.press("Escape")
    await expect(page.locator(".fk-media-viewer")).toBeHidden()
  })

  test("clicking the image zooms in, clicking again zooms back out", async ({ page }) => {
    await openMediaViewerWithNPhotos(page, 1)

    const img = page.locator(".fk-media-viewer-stage img")
    await expect(img).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)")
    await img.click()
    await expect(img).toHaveCSS("transform", "matrix(2, 0, 0, 2, 0, 0)")
    await img.click()
    await expect(img).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)")
  })

  test("dragging horizontally past the threshold navigates to the next image", async ({ page }) => {
    await openMediaViewerWithNPhotos(page, 2)

    const stage = page.locator(".fk-media-viewer-stage")
    const box = (await stage.boundingBox())!
    const centerY = box.y + box.height / 2
    await page.mouse.move(box.x + box.width - 20, centerY)
    await page.mouse.down()
    await page.mouse.move(box.x + 20, centerY, { steps: 5 })
    await page.mouse.up()

    await expect(page.locator(".fk-media-viewer-position")).toHaveText("2 di 2")
  })

  test("delete requires confirmation; cancelling keeps the item, confirming removes it", async ({ page }) => {
    await openMediaViewerWithNPhotos(page, 2)

    await page.getByRole("button", { name: "Elimina", exact: true }).click()
    await expect(page.getByText(/non è reversibile/)).toBeVisible()

    await page.getByRole("button", { name: "Annulla" }).click()
    await expect(page.locator(".fk-media-viewer-position")).toHaveText("1 di 2")

    await page.getByRole("button", { name: "Elimina", exact: true }).click()
    await page.locator(".fk-media-viewer-confirm-delete").click()

    await expect(page.locator(".fk-media-viewer-position")).toHaveText("1 di 1")
    await expect(page.locator(".fk-media-thumb")).toHaveCount(1)
  })

  test("deleting the last remaining item closes the viewer", async ({ page }) => {
    await openMediaViewerWithNPhotos(page, 1)

    await page.getByRole("button", { name: "Elimina", exact: true }).click()
    await page.locator(".fk-media-viewer-confirm-delete").click()

    await expect(page.locator(".fk-media-viewer")).toBeHidden()
    await expect(page.locator(".fk-media-thumb")).toHaveCount(0)
  })

  test("thumbnail strip shows only at desktop widths", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await openMediaViewerWithNPhotos(page, 3)
    await expect(page.locator(".fk-media-viewer-thumbstrip")).toBeHidden()

    await page.setViewportSize({ width: 1280, height: 900 })
    await expect(page.locator(".fk-media-viewer-thumbstrip")).toBeVisible()
    await expect(page.locator(".fk-media-viewer-thumb")).toHaveCount(3)

    await page.locator(".fk-media-viewer-thumb").nth(2).click()
    await expect(page.locator(".fk-media-viewer-position")).toHaveText("3 di 3")
  })
})
