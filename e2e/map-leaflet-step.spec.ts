import { test, expect } from "@playwright/test"

test("location-leaflet step: renders map and sets a value on click", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByRole("button", { name: "Prova" }).click()
  for (let i = 0; i < 7; i++) {
    await page.getByRole("button", { name: "Continua", exact: true }).click()
  }

  await expect(page.getByRole("heading", { name: "Scegli un punto sulla mappa (Leaflet)" })).toBeVisible()
  const mapCanvas = page.locator(".fk-map-canvas")
  await expect(mapCanvas).toBeVisible()
  await mapCanvas.click()

  await expect(page.locator(".fk-loc-row .fk-loc-title")).toBeVisible()
})
