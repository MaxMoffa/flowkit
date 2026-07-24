import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

test("location-leaflet step: renders map and sets a value on click", async ({ page }) => {
  await openPreset(page, { preset: "features-demo" })
  for (let i = 0; i < 7; i++) {
    await page.getByRole("button", { name: "Continua", exact: true }).click()
  }

  await expect(page.getByRole("heading", { name: "Scegli un punto sulla mappa (Leaflet)" })).toBeVisible()
  const mapCanvas = page.locator(".fk-map-canvas")
  await expect(mapCanvas).toBeVisible()
  await mapCanvas.click()

  await expect(page.locator(".fk-loc-row .fk-loc-title")).toBeVisible()
})
