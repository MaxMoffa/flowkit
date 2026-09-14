import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

/**
 * `.fk-header`'s divider from the content below only shows once the step's own
 * content is actually scrolled — transparent at rest, `--fk-border` once scrolled,
 * back to transparent at the top again. Resets on every step change (the scroll
 * container isn't remounted between steps, so its `scrollTop` would otherwise carry
 * over from wherever the previous step was left).
 */
test("header divider appears while scrolled, disappears back at the top, resets on step change", async ({
  page,
}) => {
  await openPreset(page, { preset: "features-demo" })
  await page.getByRole("button", { name: "Continua", exact: true }).click()

  const header = page.locator(".fk-header")
  const scroll = page.locator(".fk-scroll")
  await expect(header).toBeVisible()

  const borderColor = () => header.evaluate((el) => getComputedStyle(el).borderBottomColor)
  const transparent = "rgba(0, 0, 0, 0)"

  await expect.poll(borderColor).toBe(transparent)

  await scroll.evaluate((el) => {
    el.scrollTop = 50
  })
  await expect.poll(borderColor).not.toBe(transparent)

  await scroll.evaluate((el) => {
    el.scrollTop = 0
  })
  await expect.poll(borderColor).toBe(transparent)

  // Scroll down again, then navigate — the next step must not inherit the divider.
  await scroll.evaluate((el) => {
    el.scrollTop = 50
  })
  await expect.poll(borderColor).not.toBe(transparent)
  await page.getByRole("button", { name: "Continua", exact: true }).click()
  await expect.poll(borderColor).toBe(transparent)
})
