import { test, expect } from "@playwright/test"

test("map step: fullContainer (maplibre) renders map edge-to-edge with floating overlays", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByRole("button", { name: "Prova" }).click()
  for (let i = 0; i < 6; i++) {
    await page.getByRole("button", { name: "Continua", exact: true }).click()
  }

  await expect(page.getByRole("heading", { name: "Mappa a schermo intero (maplibre)" })).toBeVisible()

  const root = page.locator(".fk-step-location--full")
  await expect(root).toBeVisible()

  const top = root.locator(".fk-map-overlay-top")
  const bottom = root.locator(".fk-map-overlay-bottom")
  const map = root.locator(".fk-map-canvas--full")
  await expect(top).toBeVisible()
  await expect(bottom).toBeVisible()
  await expect(map).toBeVisible()
  await expect(top.getByPlaceholder("Cerca un indirizzo")).toBeVisible()
  await expect(bottom.getByRole("button", { name: /Usa la mia posizione/ })).toBeVisible()

  const rootBox = await root.boundingBox()
  const mapBox = await map.boundingBox()
  expect(rootBox).not.toBeNull()
  expect(mapBox).not.toBeNull()
  // edge-to-edge: the map covers (essentially) the full step width/height, not a small inset canvas
  expect(mapBox!.width).toBeGreaterThan(rootBox!.width - 2)
  expect(mapBox!.height).toBeGreaterThan(rootBox!.height - 2)
})

test("map step: fullContainer (leaflet) renders map edge-to-edge with floating overlays", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByRole("button", { name: "Prova" }).click()
  for (let i = 0; i < 8; i++) {
    await page.getByRole("button", { name: "Continua", exact: true }).click()
  }

  await expect(page.getByRole("heading", { name: "Mappa a schermo intero", exact: true })).toBeVisible()

  const root = page.locator(".fk-step-location--full")
  await expect(root).toBeVisible()

  const top = root.locator(".fk-map-overlay-top")
  const bottom = root.locator(".fk-map-overlay-bottom")
  const map = root.locator(".fk-map-canvas--full")
  await expect(top).toBeVisible()
  await expect(bottom).toBeVisible()
  await expect(map).toBeVisible()

  const rootBox = await root.boundingBox()
  const mapBox = await map.boundingBox()
  expect(rootBox).not.toBeNull()
  expect(mapBox).not.toBeNull()
  expect(mapBox!.width).toBeGreaterThan(rootBox!.width - 2)
  expect(mapBox!.height).toBeGreaterThan(rootBox!.height - 2)
})
