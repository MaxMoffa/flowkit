import { test, expect, type Page } from "@playwright/test"

/**
 * Generic error screen (`flow.errorScreen`): the catalog demo declares `errorScreen: {}`,
 * so a rejected review submit — here a Stripe *decline* test card, turned into a real
 * `onSubmit` rejection by apps/playground/src/simulate-stripe-decline.ts (keyed off the
 * collected method's `last4`) — shows the recovery screen instead of the one-line
 * footer message. Default actions for a flow with a payment step: "Riprova" + "Cambia
 * metodo di pagamento" (jumps to the payment step, then returns to the review).
 *
 * The flow is driven to the review step via the playground's `window.__flowkitRunner`
 * debug handle (same technique as `flow-runner-resume.spec.ts`) with a synthetic
 * collected payment method, rather than actually filling the third-party Stripe Payment
 * Element — that's slow and flaky in CI, and unrelated to what this spec covers.
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
      // last4 "0002" → simulate-stripe-decline.ts throws "Carta rifiutata dalla banca."
      pay: {
        status: "collected",
        confirmationTokenId: "ct_test",
        summary: { type: "card", brand: "visa", last4: "0002" },
      },
    })
    return runner.goToStep("review")
  })
}

test("error screen: a declined card shows the recovery screen; 'change payment method' jumps back to the payment step", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("catalog-demo")
  await page.getByRole("button", { name: "Inizia" }).click()
  await expect(page.getByRole("heading", { name: "Scegli i prodotti" })).toBeVisible()

  expect(await seedToReview(page)).toBe(true)
  await expect(page.getByRole("heading", { name: "Controlla e paga" })).toBeVisible()

  // submit → decline → error screen
  await page.getByRole("button", { name: /^Paga / }).click()
  const alert = page.getByRole("alert")
  await expect(alert).toBeVisible()
  await expect(alert).toContainText("Qualcosa è andato storto")
  await expect(alert).toContainText("Carta rifiutata dalla banca.")
  await expect(alert.getByRole("button", { name: "Riprova" })).toBeVisible()

  // "Cambia metodo di pagamento" → back on the payment step, with the review round-trip armed
  await alert.getByRole("button", { name: "Cambia metodo di pagamento" }).click()
  await expect(page.getByRole("heading", { name: "Completa il pagamento" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Torna al riepilogo" })).toBeVisible()
})
