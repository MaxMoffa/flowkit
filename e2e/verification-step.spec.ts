import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

const TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js"

test.describe("verification step", () => {
  test("blocks advancement until verifyToken resolves true", async ({ page }) => {
    await page.route(TURNSTILE_SCRIPT, (route) =>
      route.fulfill({ status: 200, contentType: "application/javascript", body: "" }),
    )
    await page.addInitScript(() => {
      // @ts-expect-error test shim, no real Turnstile SDK in this environment
      window.turnstile = {
        render: (container: HTMLElement, opts: { callback: (t: string) => void }) => {
          const btn = document.createElement("button")
          btn.textContent = "Simula verifica"
          btn.onclick = () => opts.callback("fake-token")
          container.appendChild(btn)
          return "widget-1"
        },
        reset: () => {},
      }
    })
    await page.route("**/api/verify-demo", (route) => route.fulfill({ json: { ok: true } }))

    await openPreset(page, { preset: "verification-demo" })

    await expect(page.getByRole("button", { name: "Continua", exact: true })).toBeDisabled()
    await page.getByRole("button", { name: "Simula verifica" }).click()
    await expect(page.getByText("Verifica completata")).toBeVisible()
    await expect(page.getByRole("button", { name: "Continua", exact: true })).toBeEnabled()

    await page.getByRole("button", { name: "Continua", exact: true }).click()
    await expect(page.locator(".fk-step-confirmation")).toBeVisible()
  })

  test("stays blocked and surfaces an error when verifyToken resolves false", async ({ page }) => {
    await page.route(TURNSTILE_SCRIPT, (route) =>
      route.fulfill({ status: 200, contentType: "application/javascript", body: "" }),
    )
    await page.addInitScript(() => {
      // @ts-expect-error test shim
      window.turnstile = {
        render: (container: HTMLElement, opts: { callback: (t: string) => void }) => {
          const btn = document.createElement("button")
          btn.textContent = "Simula verifica"
          btn.onclick = () => opts.callback("fake-token")
          container.appendChild(btn)
          return "widget-1"
        },
        reset: () => {},
      }
    })
    await page.route("**/api/verify-demo", (route) => route.fulfill({ json: { ok: false } }))

    await openPreset(page, { preset: "verification-demo" })

    await page.getByRole("button", { name: "Simula verifica" }).click()
    await expect(page.getByText("Verifica non riuscita, riprova.")).toBeVisible()
    await expect(page.getByRole("button", { name: "Continua", exact: true })).toBeDisabled()
  })
})
