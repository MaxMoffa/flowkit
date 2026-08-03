import { test, expect, type Page } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

/**
 * `FlowRunner`'s `onStepChange` prop (v2.35+): the playground wires it to
 * `window.__flowkitCurrentStep` purely for e2e observability (see app.tsx) — not part
 * of the public API. React-level wiring (mount/next/prev/jump/logic-step transparency/
 * branch-change) is covered more exhaustively by
 * packages/react/src/flow-runner-step-change.test.tsx; this spec checks the same
 * behavior actually holds end-to-end in a real browser against the "branch-demo" preset.
 */
function readCurrentStep(page: Page) {
  return page.evaluate(() => (window as unknown as { __flowkitCurrentStep?: unknown }).__flowkitCurrentStep)
}

/** `page.evaluate` doesn't share Playwright locators' auto-waiting: the effect that
 *  sets `window.__flowkitCurrentStep` can commit a tick after the action that triggered
 *  it (a preset remount, a `check()`) resolves. `expect.poll` retries the read instead
 *  of racing it. */
async function expectCurrentStep(page: Page, match: Record<string, unknown>) {
  await expect.poll(() => readCurrentStep(page)).toMatchObject(match)
}

test.describe("FlowRunner onStepChange", () => {
  test("reports 'initial' on mount, then 'next' across the invisible branch step, previousStep skipping straight to the step before it", async ({
    page,
  }) => {
    await openPreset(page, { preset: "branch-demo", start: false })

    await expectCurrentStep(page, { id: "welcome", direction: "initial", previousStep: null })

    await page.getByRole("button", { name: "Prova" }).click() // welcome -> has-pet
    await expectCurrentStep(page, { id: "has-pet", direction: "next", previousStep: { id: "welcome" } })

    await page.getByRole("radio", { name: "No" }).check()
    await page.getByRole("button", { name: "Continua", exact: true }).click() // has-pet -> router -> review
    // previousStep is "has-pet", never "router" — the branch step is transparent.
    await expectCurrentStep(page, { id: "review", direction: "next", previousStep: { id: "has-pet" } })

    await page.locator(".fk-footer-back").click() // review -> has-pet
    await expectCurrentStep(page, { id: "has-pet", direction: "prev" })
  })

  test("fires 'branch-change' (same step, no navigation) when a Back-then-edited answer reroutes the branch", async ({
    page,
  }) => {
    await openPreset(page, { preset: "branch-demo" }) // stops on has-pet

    await page.getByRole("radio", { name: "No" }).check()
    await page.getByRole("button", { name: "Continua", exact: true }).click() // -> review
    await page.locator(".fk-footer-back").click() // -> has-pet

    await page.getByRole("radio", { name: "Sì" }).check() // no "Continua" click: still on has-pet
    await expectCurrentStep(page, { id: "has-pet", direction: "branch-change" })
  })
})
