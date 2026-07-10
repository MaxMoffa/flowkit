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

test("map step: GPS button renders below the map, styled neutral", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByRole("button", { name: "Prova" }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click() // skip oauth

  await expect(page.getByRole("heading", { name: "Scegli un punto sulla mappa" })).toBeVisible()
  const gpsBtn = page.locator(".fk-gps-btn")
  await expect(gpsBtn).toHaveClass(/fk-btn-neutral/)
  const mapBox = await page.locator(".fk-map-canvas").boundingBox()
  const btnBox = await gpsBtn.boundingBox()
  expect(btnBox!.y).toBeGreaterThan(mapBox!.y)
})

test("map step: showMap=false and enableGps=false renders search-only", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByRole("button", { name: "Prova" }).click()
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Continua", exact: true }).click()
  }
  await expect(page.getByRole("heading", { name: "Solo ricerca indirizzo" })).toBeVisible()
  await expect(page.locator(".fk-map-search")).toBeVisible()
  await expect(page.locator(".fk-map-canvas")).toHaveCount(0)
  await expect(page.locator(".fk-gps-btn")).toHaveCount(0)
})

test("map step: showSearch=false and enableGps=false renders map-only", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByRole("button", { name: "Prova" }).click()
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "Continua", exact: true }).click()
  }
  await expect(page.getByRole("heading", { name: "Solo mappa" })).toBeVisible()
  await expect(page.locator(".fk-map-search")).toHaveCount(0)
  await expect(page.locator(".fk-map-canvas")).toBeVisible()
  await expect(page.locator(".fk-gps-btn")).toHaveCount(0)
})

test("map step: showMap=false and showSearch=false renders gps-only", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByRole("button", { name: "Prova" }).click()
  for (let i = 0; i < 5; i++) {
    await page.getByRole("button", { name: "Continua", exact: true }).click()
  }
  await expect(page.getByRole("heading", { name: "Solo GPS" })).toBeVisible()
  await expect(page.locator(".fk-map-search")).toHaveCount(0)
  await expect(page.locator(".fk-map-canvas")).toHaveCount(0)
  await expect(page.locator(".fk-gps-btn")).toBeVisible()
})

test("map step: reverse geocoding populates a human label after a map click", async ({ page }) => {
  await page.route("https://nominatim.openstreetmap.org/reverse**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ display_name: "Via Roma, Battipaglia (SA)" }),
    }),
  )

  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByRole("button", { name: "Prova" }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click() // skip oauth

  await expect(page.getByRole("heading", { name: "Scegli un punto sulla mappa" })).toBeVisible()
  await page.getByRole("region", { name: "Map" }).click()

  await expect(page.locator(".fk-loc-row .fk-loc-title")).toHaveText("Via Roma, Battipaglia (SA)", {
    timeout: 3_000,
  })
})

test("map step: reverse geocoding failure falls back to raw coordinates", async ({ page }) => {
  await page.route("https://nominatim.openstreetmap.org/reverse**", (route) =>
    route.fulfill({ status: 500, contentType: "text/plain", body: "error" }),
  )

  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByRole("button", { name: "Prova" }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click() // skip oauth

  await expect(page.getByRole("heading", { name: "Scegli un punto sulla mappa" })).toBeVisible()
  await page.getByRole("region", { name: "Map" }).click()

  await expect(page.locator(".fk-loc-row .fk-loc-title")).toBeVisible()
  await page.waitForTimeout(700) // oltre il debounce di 500ms, per assicurarsi che non cambi
  const text = await page.locator(".fk-loc-row .fk-loc-title").textContent()
  expect(text).toMatch(/^-?\d+\.\d+, -?\d+\.\d+$/)
})
