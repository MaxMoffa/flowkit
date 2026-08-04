import { test, expect, type Page } from "@playwright/test"

/**
 * `FlowRunner`'s `initialStep`/`initialAnswers` props and extended imperative ref
 * (`goToStep`/`getAnswers`/`setAnswers`/`reset`, v2.36) — resuming a flow after a page
 * refresh. `packages/react/src/flow-runner-resume.test.tsx` covers the same behavior
 * more exhaustively at the React level; this checks it end-to-end in a real browser.
 *
 * The playground reads `initialStep`/`initialAnswers` from the URL and exposes the ref
 * on `window.__flowkitRunner` purely for this spec (see app.tsx) — neither is part of
 * the public API.
 */

/** `window.__flowkitRunner` is a new object every time `FlowRunner`'s ref recomputes
 *  (see app.tsx's inline callback ref) — each of these re-reads it fresh from `window`
 *  inside the browser (rather than a JSHandle captured once on the Node side, which
 *  would go stale after the first state change and silently keep acting on the flow's
 *  state as it was at capture time). */
function goToStep(page: Page, stepId: string) {
  return page.evaluate(
    (id) => (window as unknown as { __flowkitRunner: { goToStep: (s: string) => boolean } }).__flowkitRunner.goToStep(id),
    stepId,
  )
}
function getAnswers(page: Page) {
  return page.evaluate(
    () => (window as unknown as { __flowkitRunner: { getAnswers: () => Record<string, unknown> } }).__flowkitRunner.getAnswers(),
  )
}
function setAnswers(page: Page, answers: Record<string, unknown>) {
  return page.evaluate(
    (a) => (window as unknown as { __flowkitRunner: { setAnswers: (a: Record<string, unknown>) => void } }).__flowkitRunner.setAnswers(a),
    answers,
  )
}
function resetRunner(page: Page) {
  return page.evaluate(() => (window as unknown as { __flowkitRunner: { reset: () => void } }).__flowkitRunner.reset())
}

async function selectPreset(page: Page, preset: string) {
  await page.getByLabel("Preset", { exact: true }).selectOption(preset)
}

test.describe("FlowRunner: initialStep / initialAnswers (resume)", () => {
  test("mounts directly on initialStep when it's reachable given initialAnswers", async ({ page }) => {
    const answers = encodeURIComponent(JSON.stringify({ has_pet: "yes" }))
    await page.goto(`/?initialStep=pet-name&initialAnswers=${answers}`)
    await selectPreset(page, "branch-demo")

    await expect(page.getByText("Come si chiama?")).toBeVisible()
  })

  test("falls back to the normal initial step when initialStep isn't reachable given initialAnswers", async ({
    page,
  }) => {
    // has_pet="no" routes straight to "review", skipping "pet-name" entirely.
    const answers = encodeURIComponent(JSON.stringify({ has_pet: "no" }))
    await page.goto(`/?initialStep=pet-name&initialAnswers=${answers}`)
    await selectPreset(page, "branch-demo")

    await expect(page.getByRole("button", { name: "Prova" })).toBeVisible()
  })

  test("falls back to the normal initial step for an unknown initialStep id, without crashing", async ({ page }) => {
    await page.goto("/?initialStep=does-not-exist")
    await selectPreset(page, "branch-demo")

    await expect(page.getByRole("button", { name: "Prova" })).toBeVisible()
  })
})

test.describe("FlowRunner: imperative ref — goToStep/getAnswers/setAnswers/reset", () => {
  test("drives the flow from outside via the ref handle", async ({ page }) => {
    await page.goto("/")
    await selectPreset(page, "branch-demo")
    await page.getByRole("button", { name: "Prova" }).click() // welcome -> has-pet

    await page.getByRole("radio", { name: "No" }).check()
    await page.getByRole("button", { name: "Continua", exact: true }).click() // has-pet -> router -> review
    await expect(page.locator(".fk-review-row")).toBeVisible()

    const wentBack = await goToStep(page, "has-pet")
    expect(wentBack).toBe(true)
    await expect(page.getByRole("radio", { name: "No" })).toBeChecked()

    const answers = await getAnswers(page)
    expect(answers).toMatchObject({ has_pet: "no" })

    await setAnswers(page, { has_pet: "yes" })
    const wentToPetName = await goToStep(page, "pet-name")
    expect(wentToPetName).toBe(true)
    await expect(page.getByText("Come si chiama?")).toBeVisible()

    await resetRunner(page)
    await expect(page.getByRole("button", { name: "Prova" })).toBeVisible()
    const answersAfterReset = await getAnswers(page)
    expect(answersAfterReset).toEqual({})
  })

  test("goToStep is a no-op returning false for an unreachable id", async ({ page }) => {
    await page.goto("/")
    await selectPreset(page, "branch-demo")
    await page.getByRole("button", { name: "Prova" }).click() // welcome -> has-pet

    const ok = await goToStep(page, "does-not-exist")
    expect(ok).toBe(false)
  })
})
