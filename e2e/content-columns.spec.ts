import { test, expect } from "@playwright/test"

test.use({ viewport: { width: 1280, height: 900 } })

test.describe("location step: columns only with enough content", () => {
  test("pick-spot (layout:columns, wide container): controls and map split into two columns", async ({ page }) => {
    // The main playground page ("/") always renders the flow inside a fixed ~390px preview
    // frame regardless of the browser viewport (see map-desktop-columns.spec.ts's narrow-frame
    // assertion for that case) — columns are container-width-based (v2.25), so they can only
    // ever activate on a page whose actual container gets wide. Use the fullscreen preview
    // (no fixed frame) to exercise the "container genuinely wide enough" path end to end.
    await page.goto("/fullscreen.html?preset=features-demo&theme=notion-clean&mode=light")
    await page.getByRole("button", { name: "Prova" }).click()
    await page.getByRole("button", { name: "Continua", exact: true }).click() // skip oauth

    await expect(page.getByRole("heading", { name: "Scegli un punto sulla mappa" })).toBeVisible()
    await expect(page.locator(".fk-step-location--columns")).toHaveCount(1)

    const controls = page.locator(".fk-location-controls")
    const map = page.locator(".fk-map-canvas")
    const controlsBox = (await controls.boundingBox())!
    const mapBox = (await map.boundingBox())!
    expect(Math.abs(controlsBox.y - mapBox.y)).toBeLessThan(4) // same row, side by side
    expect(controlsBox.x).toBeLessThan(mapBox.x)
  })

  test("pick-spot (layout:columns, narrow frame at desktop viewport): stays single column", async ({ page }) => {
    // This is the exact bug the container-query fix (v2.25) targets: an embedder can render
    // the flow inside a narrow frame even on a wide desktop browser window — columns must not
    // activate just because the viewport is wide when the flow's own container isn't.
    await page.goto("/")
    await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
    await page.getByRole("button", { name: "Prova" }).click()
    await page.getByRole("button", { name: "Continua", exact: true }).click() // skip oauth

    await expect(page.getByRole("heading", { name: "Scegli un punto sulla mappa" })).toBeVisible()
    // The modifier class stays (it just reflects the opted-in config, step.layout === "columns"),
    // but the @container query gating the grid doesn't match at this container width, so it
    // must not actually render as a grid.
    const display = await page.locator(".fk-step-location--columns").evaluate((el) => getComputedStyle(el).display)
    expect(display).not.toBe("grid")

    const controls = page.locator(".fk-location-controls")
    const map = page.locator(".fk-map-canvas")
    const controlsBox = (await controls.boundingBox())!
    const mapBox = (await map.boundingBox())!
    expect(mapBox.y).toBeGreaterThan(controlsBox.y + controlsBox.height - 4) // stacked, map below controls
  })

  test("pick-title-only (no search, no gps): stays single column even on desktop", async ({ page }) => {
    await page.goto("/")
    await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
    await page.getByRole("button", { name: "Prova" }).click()
    for (let i = 0; i < 9; i++) {
      await page.getByRole("button", { name: "Continua", exact: true }).click()
    }
    // satisfy quick-group
    await page.locator(".fk-scale-pill", { hasText: "5" }).click()
    await page.getByRole("button", { name: "Velocità" }).click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()
    // satisfy pick-radio
    await page.locator(".fk-step-radio .fk-list-item").first().click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    await expect(page.getByRole("heading", { name: "Solo titolo, niente ricerca né GPS" })).toBeVisible()
    await expect(page.locator(".fk-step-location--columns")).toHaveCount(0)

    const controls = page.locator(".fk-location-controls")
    const map = page.locator(".fk-map-canvas")
    const controlsBox = (await controls.boundingBox())!
    const mapBox = (await map.boundingBox())!
    expect(mapBox.y).toBeGreaterThan(controlsBox.y + controlsBox.height - 4) // stacked, map below controls
  })
})

test.describe("group step: columns only with >=2 children", () => {
  test("quick-group (layout columns, 2 children): items split into columns", async ({ page }) => {
    await page.goto("/")
    await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
    await page.getByRole("button", { name: "Prova" }).click()
    for (let i = 0; i < 9; i++) {
      await page.getByRole("button", { name: "Continua", exact: true }).click()
    }
    await expect(page.getByRole("heading", { name: "Un paio di domande veloci" })).toBeVisible()
    await expect(page.locator(".fk-group-columns")).toHaveCount(1)
    await expect(page.locator(".fk-group-stack")).toHaveCount(0)
  })

  test("solo-group (layout columns, 1 child): falls back to stack", async ({ page }) => {
    await page.goto("/")
    await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
    await page.getByRole("button", { name: "Prova" }).click()
    for (let i = 0; i < 9; i++) {
      await page.getByRole("button", { name: "Continua", exact: true }).click()
    }
    await page.locator(".fk-scale-pill", { hasText: "5" }).click()
    await page.getByRole("button", { name: "Velocità" }).click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()
    await page.locator(".fk-step-radio .fk-list-item").first().click()
    await page.getByRole("button", { name: "Continua", exact: true }).click()
    await page.getByRole("button", { name: "Continua", exact: true }).click() // skip pick-title-only

    await expect(page.getByRole("heading", { name: "Un solo campo" })).toBeVisible()
    await expect(page.locator(".fk-group-stack")).toHaveCount(1)
    await expect(page.locator(".fk-group-columns")).toHaveCount(0)
  })
})
