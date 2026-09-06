import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

/**
 * Guards the container-query fix (see DECISIONS.md "container query anchor:
 * .fk-root, not .fk-theme" and the `@container fk-shell (...)` blocks in
 * packages/react/src/style.css): FlowKit's internal layout breakpoints must react to
 * the width of the box it's mounted in, not the browser window's viewport.
 *
 * Both specs below run the flow inside a narrow (~390px) container sitting inside a
 * wide (1280px) browser window — exactly the embedding the bug report described
 * (index.html's `.pg-phone` is always 390px; fullscreen.html can pin `.pg-fullscreen-
 * frame` to 390px via the "Mobile 390px" toggle while the window itself stays wide).
 * Before the fix, the old `@media (min-width: 1024px)` rules matched the *window*
 * width regardless of the container, moving the back button into the footer row
 * (`flex-direction: row` + `flex: 1` + 32px padding) and squeezing the primary
 * button's label into a near-zero-width column — wrapping it one letter per line.
 */
test.describe("component layout follows its own container width, not the browser viewport", () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test("index.html: the 390px phone frame stays in mobile layout at a wide desktop viewport", async ({
    page,
  }) => {
    await openPreset(page, { preset: "features-demo" })
    await expect(page.getByRole("heading", { name: "Accedi per continuare" })).toBeVisible()

    const frame = page.locator(".pg-frame")
    await expect(frame).toHaveCSS("width", "390px") // sanity: the container really is narrow

    // Mobile pattern: back stays in the header; the desktop-only footer back button
    // (which only appears via the `fk-shell` >=1024px container query) stays hidden.
    await expect(frame.locator(".fk-header .fk-back")).toBeVisible()
    await expect(frame.locator(".fk-footer-back")).toBeHidden()

    // The footer row stacks (column) — it must never become a row squeezed into
    // 390px, which is the bug this test guards against.
    await expect(frame.locator(".fk-footer-row")).toHaveCSS("flex-direction", "column")

    // A single readable line (+ padding) is well under 60px tall. The reported bug
    // wrapped every letter of "Continua" onto its own line, ballooning this past
    // 150-200px.
    const cta = frame.locator(".fk-footer .fk-btn-primary")
    await expect(cta).toBeVisible()
    await expect(cta).toContainText("Continua")
    const ctaBox = (await cta.boundingBox())!
    expect(ctaBox.height).toBeLessThan(60)
    // ...and it spans most of the 390px frame instead of being squeezed to a sliver
    // by a `flex: 1` sibling that shouldn't be there at this width.
    expect(ctaBox.width).toBeGreaterThan(300)
  })

  test("fullscreen.html: a container pinned to 390px inside a 1280px window stays mobile", async ({
    page,
  }) => {
    await page.goto("/fullscreen.html?preset=features-demo&theme=warm-paper&mode=light")
    await page.getByRole("button", { name: "Mobile 390px" }).click()
    await page.getByRole("button", { name: "Prova" }).click()
    await expect(page.getByRole("heading", { name: "Accedi per continuare" })).toBeVisible()

    const frame = page.locator(".pg-fullscreen-frame")
    await expect(frame).toHaveCSS("width", "390px")
    // The window really is desktop-wide — proves the following assertions can only
    // pass if the layout is reading the container's width, not `window.innerWidth`.
    expect(page.viewportSize()!.width).toBe(1280)

    await expect(frame.locator(".fk-header .fk-back")).toBeVisible()
    await expect(frame.locator(".fk-footer-back")).toBeHidden()
    await expect(frame.locator(".fk-footer-row")).toHaveCSS("flex-direction", "column")

    const cta = frame.locator(".fk-footer .fk-btn-primary")
    const ctaBox = (await cta.boundingBox())!
    expect(ctaBox.height).toBeLessThan(60)
    expect(ctaBox.width).toBeGreaterThan(300)
  })

  test("fullscreen.html: switching the container back to desktop width restores the desktop footer, same wide window", async ({
    page,
  }) => {
    // Companion check: the container (not a stale viewport read) really drives the
    // breakpoint both ways — widening just the container should turn the desktop
    // layout back on, with no viewport change at all.
    await page.goto("/fullscreen.html?preset=features-demo&theme=warm-paper&mode=light")
    await page.getByRole("button", { name: "Desktop (100%)" }).click()
    await page.getByRole("button", { name: "Prova" }).click()
    await expect(page.getByRole("heading", { name: "Accedi per continuare" })).toBeVisible()

    const frame = page.locator(".pg-fullscreen-frame")
    await expect(frame.locator(".fk-header .fk-back")).toBeHidden()
    await expect(frame.locator(".fk-footer-back")).toBeVisible()
    await expect(frame.locator(".fk-footer-row")).toHaveCSS("flex-direction", "row")
  })
})
