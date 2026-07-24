import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

test.use({ viewport: { width: 1280, height: 900 } })

test("showcase theme (layout.contentAlign: center): step content sits away from the top", async ({ page }) => {
  await openPreset(page, { preset: "features-demo", theme: "showcase", skip: ["oauth", "pick-spot (has its own top override)"] })
  // pick-preset-point (search+map+gps) got taller now that columns are container-based rather
  // than viewport-forced (v2.25) — the 390px playground frame no longer squishes it into two
  // columns, so it can fill the frame's height with no room left to center. Use a short-content
  // step (search-only, no map/gps) instead: centering itself is what's under test here, not layout.
  await page.getByRole("button", { name: "Continua", exact: true }).click() // skip pick-preset-point

  await expect(page.getByRole("heading", { name: "Solo ricerca indirizzo" })).toBeVisible()

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
  await openPreset(page, { preset: "features-demo", theme: "showcase", skip: ["oauth"] })

  await expect(page.getByRole("heading", { name: "Scegli un punto sulla mappa" })).toBeVisible()

  const scroll = page.locator(".fk-scroll")
  const scope = page.locator(".fk-step-theme-scope")
  const scrollBox = (await scroll.boundingBox())!
  const scopeBox = (await scope.boundingBox())!
  expect(scopeBox.y - scrollBox.y).toBeLessThan(20) // pinned to the top, override applied
})

test("default theme (no contentAlign): step content stays top-aligned as before", async ({ page }) => {
  await openPreset(page, { preset: "features-demo", skip: ["oauth", "pick-spot"] })

  await expect(page.getByRole("heading", { name: "Oppure scegli tra i punti suggeriti" })).toBeVisible()

  const scroll = page.locator(".fk-scroll")
  const scope = page.locator(".fk-step-theme-scope")
  const scrollBox = (await scroll.boundingBox())!
  const scopeBox = (await scope.boundingBox())!
  expect(scopeBox.y - scrollBox.y).toBeLessThan(20)
})
