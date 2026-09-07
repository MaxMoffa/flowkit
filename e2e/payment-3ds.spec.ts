import { test, expect, type Page } from "@playwright/test"

/**
 * Deferred payment 3DS/SCA hook. The catalog demo's `onSubmit` runs
 * `simulateStripe3dsOutcome` (apps/playground/src/simulate-stripe-3ds.ts): the
 * collected method's `last4 === "3155"` (Stripe's "authentication required" test
 * card) makes the first submit throw `PaymentRequiresActionError`. FlowRunner
 * then calls the playground's mock next-action runner — a `window.confirm`
 * standing in for Stripe's challenge modal — and, on accept, re-invokes
 * `onSubmit`, which this time goes through.
 *
 * Driven to review via `window.__flowkitRunner` with a synthetic collected
 * method, same as error-screen.spec.ts — the real Stripe Payment Element is slow
 * and flaky in CI and unrelated to what this covers.
 */
function seedToReview(page: Page) {
  return page.evaluate(() => {
    const runner = (
      window as unknown as {
        __flowkitRunner: {
          setAnswers: (a: Record<string, unknown>) => void
          goToStep: (s: string) => boolean
        }
      }
    ).__flowkitRunner
    runner.setAnswers({
      cart: { items: [{ value: "tshirt", quantity: 1 }], total: 2500 },
      shipping: "standard",
      address: { country: "IT", line1: "Via Roma 1", postalCode: "20100", city: "Milano" },
      // last4 "3155" → simulate-stripe-3ds.ts throws PaymentRequiresActionError on the first submit.
      pay: {
        status: "collected",
        confirmationTokenId: "ct_3ds",
        summary: { type: "card", brand: "visa", last4: "3155" },
      },
    })
    return runner.goToStep("review")
  })
}

async function openReview(page: Page) {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("catalog-demo")
  await page.getByRole("button", { name: "Inizia" }).click()
  await expect(page.getByRole("heading", { name: "Scegli i prodotti" })).toBeVisible()
  expect(await seedToReview(page)).toBe(true)
  await expect(page.getByRole("heading", { name: "Controlla e paga" })).toBeVisible()
}

test("3DS challenge accepted: the flow runs the challenge, re-submits, and completes", async ({
  page,
}) => {
  await openReview(page)

  const dialogs: string[] = []
  page.on("dialog", (d) => {
    dialogs.push(d.message())
    void d.accept()
  })

  await page.getByRole("button", { name: /^Paga / }).click()

  await expect(page.getByRole("heading", { name: "Ordine ricevuto!" })).toBeVisible()
  expect(dialogs.join("\n")).toContain("3D Secure")
})

test("3DS challenge dismissed: stays on review with the cancelled-auth error screen", async ({
  page,
}) => {
  await openReview(page)

  page.on("dialog", (d) => void d.dismiss())

  await page.getByRole("button", { name: /^Paga / }).click()

  const alert = page.getByRole("alert")
  await expect(alert).toBeVisible()
  await expect(alert).toContainText("Autenticazione 3D Secure annullata.")
  await expect(alert.getByRole("button", { name: "Riprova" })).toBeVisible()
})
