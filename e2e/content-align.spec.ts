import { test, expect } from "@playwright/test"

test.use({ viewport: { width: 1280, height: 900 } })

test("showcase theme (layout.contentAlign: center): step content sits away from the top", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByLabel("Tema", { exact: true }).selectOption("showcase")
  await page.getByRole("button", { name: "Prova" }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click() // skip oauth
  await page.getByRole("button", { name: "Continua", exact: true }).click() // skip pick-spot (has its own "top" override)

  await expect(page.getByRole("heading", { name: "Oppure scegli tra i punti suggeriti" })).toBeVisible()

  const scroll = page.locator(".fk-scroll")
  const scope = page.locator(".fk-step-theme-scope")
  const scrollBox = (await scroll.boundingBox())!
  const scopeBox = (await scope.boundingBox())!
  const gapAbove = scopeBox.y - scrollBox.y
  const gapBelow = scrollBox.y + scrollBox.height - (scopeBox.y + scopeBox.height)
  expect(gapAbove).toBeGreaterThan(20) // not pinned to the top
  expect(Math.abs(gapAbove - gapBelow)).toBeLessThan(gapAbove) // roughly centered, not just pushed down
})

test("per-step contentAlign: 'top' overrides the theme's 'center' default", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByLabel("Tema", { exact: true }).selectOption("showcase")
  await page.getByRole("button", { name: "Prova" }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click() // skip oauth

  await expect(page.getByRole("heading", { name: "Scegli un punto sulla mappa" })).toBeVisible()

  const scroll = page.locator(".fk-scroll")
  const scope = page.locator(".fk-step-theme-scope")
  const scrollBox = (await scroll.boundingBox())!
  const scopeBox = (await scope.boundingBox())!
  expect(scopeBox.y - scrollBox.y).toBeLessThan(20) // pinned to the top, override applied
})

test("default theme (no contentAlign): step content stays top-aligned as before", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByRole("button", { name: "Prova" }).click()
  await page.getByRole("button", { name: "Continua", exact: true }).click() // skip oauth
  await page.getByRole("button", { name: "Continua", exact: true }).click() // skip pick-spot

  await expect(page.getByRole("heading", { name: "Oppure scegli tra i punti suggeriti" })).toBeVisible()

  const scroll = page.locator(".fk-scroll")
  const scope = page.locator(".fk-step-theme-scope")
  const scrollBox = (await scroll.boundingBox())!
  const scopeBox = (await scope.boundingBox())!
  expect(scopeBox.y - scrollBox.y).toBeLessThan(20)
})
