import { test, expect } from "@playwright/test"

test("map step: point selection via click", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByRole("button", { name: "Prova" }).click()
  // skip oauth (optional)
  await page.getByRole("button", { name: "Continua", exact: true }).click()

  await expect(page.getByRole("heading", { name: "Scegli un punto sulla mappa" })).toBeVisible()
  await page.getByRole("region", { name: "Map" }).click()

  await expect(page.locator(".fk-loc-row .fk-loc-title")).toBeVisible()
  await expect(page.getByRole("button", { name: "Continua", exact: true })).toBeEnabled()
})

test("map step: preset-points selection via marker click", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByRole("button", { name: "Prova" }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click() // skip oauth
  await page.getByRole("button", { name: "Continua", exact: true }).click() // skip point map

  await expect(page.getByRole("heading", { name: "Oppure scegli tra i punti suggeriti" })).toBeVisible()
  await page.getByRole("button", { name: "Map marker" }).first().click()

  await expect(page.locator(".fk-loc-row .fk-loc-title")).toHaveText("45.46420, 9.19000")
})

test("map step: address search returns real geocoding results", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByRole("button", { name: "Prova" }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click() // skip oauth

  await page.getByPlaceholder("Cerca un indirizzo").fill("Milano")
  await expect(page.locator(".fk-map-search-results li button").first()).toBeVisible({
    timeout: 10_000,
  })
})
