import { test, expect, type Page } from "@playwright/test"

/** The overlay demo isn't a normal intro-CTA preset mount (it renders an "Apri flow"
 *  button instead of the inline FlowRunner), so we drive it directly rather than via
 *  the `openPreset` helper. */
async function openOverlayDemo(
  page: Page,
  presentation?: "auto" | "drawer" | "dialog" | "fullscreen",
) {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("flow-overlay-demo")
  if (presentation) {
    await page.getByLabel("Presentazione overlay").selectOption(presentation)
  }
  await page.getByRole("button", { name: "Apri flow" }).click()
}

test("opens as a dialog on desktop, runs a step, closes on Escape", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("flow-overlay-demo")
  await expect(page.locator(".fk-overlay-sheet")).toHaveCount(0)

  await page.getByRole("button", { name: "Apri flow" }).click()
  await expect(page.locator(".fk-overlay-sheet")).toBeVisible()
  await expect(page.locator(".fk-overlay-sheet--dialog")).toBeVisible() // auto @ 1280px

  await page.getByRole("button", { name: "Inizia" }).click()
  await expect(page.getByText("Come ci hai trovato?")).toBeVisible()

  await page.keyboard.press("Escape")
  await expect(page.locator(".fk-overlay-sheet")).toHaveCount(0)
})

test("presentation toggle forces the drawer; the ✕ button closes it", async ({ page }) => {
  await openOverlayDemo(page, "drawer")
  await expect(page.locator(".fk-overlay-sheet--drawer")).toBeVisible()
  await expect(page.locator(".fk-overlay-grabber")).toBeVisible()

  await page.getByRole("button", { name: "Chiudi" }).click()
  await expect(page.locator(".fk-overlay-sheet")).toHaveCount(0)
})

test("fullscreen presentation fills the viewport and shows the flow name + close button", async ({
  page,
}) => {
  await openOverlayDemo(page, "fullscreen")
  const sheet = page.locator(".fk-overlay-sheet--fullscreen")
  await expect(sheet).toBeVisible()

  const box = (await sheet.boundingBox())!
  const vp = page.viewportSize()!
  expect(box.width).toBeGreaterThanOrEqual(vp.width - 1)
  expect(box.height).toBeGreaterThanOrEqual(vp.height - 1)

  await expect(page.locator(".fk-overlay-title")).toHaveText("Flow in overlay")
  await page.getByRole("button", { name: "Chiudi" }).click()
  await expect(page.locator(".fk-overlay-sheet")).toHaveCount(0)
})

test("fixedHeight (default on) gives the dialog a tall fixed height; off sizes to content", async ({
  page,
}) => {
  await openOverlayDemo(page, "dialog")
  const sheet = page.locator(".fk-overlay-sheet--dialog")
  await expect(sheet).toHaveClass(/fk-overlay-sheet--fixed/)
  const fixedH = (await sheet.boundingBox())!.height
  expect(fixedH).toBeGreaterThan(500) // min(88dvh, 780px) on a 720px-tall viewport ≈ 633
  await page.getByRole("button", { name: "Chiudi" }).click()

  await page.getByLabel("Altezza fissa (aspect ratio verticale)").uncheck()
  await page.getByRole("button", { name: "Apri flow" }).click()
  await expect(sheet).not.toHaveClass(/fk-overlay-sheet--fixed/)
  const contentH = (await sheet.boundingBox())!.height
  expect(contentH).toBeLessThan(fixedH)
})

test("backdrop click closes the overlay", async ({ page }) => {
  await openOverlayDemo(page)
  await expect(page.locator(".fk-overlay-sheet")).toBeVisible()

  await page.locator(".fk-overlay-backdrop").click({ position: { x: 5, y: 5 } })
  await expect(page.locator(".fk-overlay-sheet")).toHaveCount(0)
})

test("auto resolves to the drawer on a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 900 })
  await openOverlayDemo(page, "auto")
  await expect(page.locator(".fk-overlay-sheet--drawer")).toBeVisible()
})

test("dragging the grabber down dismisses the drawer", async ({ page }) => {
  await openOverlayDemo(page, "drawer")
  const sheet = page.locator(".fk-overlay-sheet--drawer")
  await expect(sheet).toBeVisible()
  await page.waitForTimeout(350) // let the slide-up animation settle

  const grabber = page.locator(".fk-overlay-grabber")
  const box = (await grabber.boundingBox())!
  const startX = box.x + box.width / 2
  const startY = box.y + box.height / 2

  await page.mouse.move(startX, startY)
  await page.mouse.down()
  for (let dy = 40; dy <= 500; dy += 40) {
    await page.mouse.move(startX, startY + dy)
  }
  await page.mouse.up()

  await expect(page.locator(".fk-overlay-sheet")).toHaveCount(0)
})
