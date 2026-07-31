import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

test.describe("long-content step", () => {
  test("disables Continua until scrolled to the end, mobile viewport", async ({ page }) => {
    await openPreset(page, { preset: "info-long-content-demo", skip: ["before"] })

    // Land on "terms" (long-content): fill q1, advance.
    await page.locator(".fk-input").fill("Ada")
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    await expect(page.getByRole("heading", { name: "Termini e condizioni" })).toBeVisible()
    const primary = page.getByRole("button", { name: "Continua", exact: true })
    const scrollEl = page.locator(".fk-long-content-scroll")

    await expect(scrollEl).toBeVisible()
    await expect(primary).toBeDisabled()

    await scrollEl.evaluate((el) => el.scrollTo(0, el.scrollHeight))
    await expect(primary).toBeEnabled()
  })

  test("header/footer chrome stays fixed and visible below the independently-scrolling content", async ({
    page,
  }) => {
    await openPreset(page, { preset: "info-long-content-demo", skip: ["before"] })
    await page.locator(".fk-input").fill("Ada")
    await page.getByRole("button", { name: "Continua", exact: true }).click()

    const footer = page.locator(".fk-footer")
    const footerBoxBefore = (await footer.boundingBox())!

    await page.locator(".fk-long-content-scroll").evaluate((el) => {
      el.scrollTop = el.scrollHeight / 2
    })

    const footerBoxAfter = (await footer.boundingBox())!
    expect(footerBoxAfter.y).toBeCloseTo(footerBoxBefore.y, 0)
    await expect(footer.locator(".fk-btn-primary")).toBeVisible()
  })

  test("full-width independent scroll region on desktop too", async ({ page }) => {
    await page.goto("/fullscreen.html?preset=info-long-content-demo&theme=notion-clean&mode=light")
    await page.getByRole("button", { name: "Desktop (100%)" }).click()
    await page.getByRole("button", { name: "Prova" }).click()

    const frame = page.locator(".pg-fullscreen-frame")
    await frame.getByRole("button", { name: "Continua", exact: true }).click() // "before" (info)
    await frame.locator(".fk-input").fill("Ada")
    await frame.getByRole("button", { name: "Continua", exact: true }).click()

    const scrollEl = frame.locator(".fk-long-content-scroll")
    await expect(scrollEl).toBeVisible()

    const frameBox = (await frame.boundingBox())!
    const scrollBox = (await scrollEl.boundingBox())!
    // Full-bleed: the content region spans (close to) the whole frame width, not the
    // ~640px readable-column max-width other step types get.
    expect(scrollBox.width).toBeGreaterThan(frameBox.width * 0.9)

    await scrollEl.evaluate((el) => el.scrollTo(0, el.scrollHeight))
    await expect(frame.getByRole("button", { name: "Continua", exact: true })).toBeEnabled()

    const footer = frame.locator(".fk-footer")
    await expect(footer).toBeVisible()
  })
})
