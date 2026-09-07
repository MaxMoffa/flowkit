import { test, expect } from "@playwright/test"

/**
 * Generic error screen (`flow.errorScreen`): the catalog demo declares `errorScreen: {}`,
 * so a rejected review submit — here a Stripe *decline* test card, turned into a real
 * `onSubmit` rejection by apps/playground/src/simulate-stripe-decline.ts — shows the
 * recovery screen instead of the one-line footer message. Default actions for a flow
 * with a payment step: "Riprova" + "Cambia metodo di pagamento" (jumps to the payment
 * step, then returns to the review).
 */
test("error screen: a declined card shows the recovery screen; 'change payment method' jumps back to the payment step", async ({
  page,
}) => {
  test.slow() // Stripe Element load + fill

  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("catalog-demo")
  await page.getByRole("button", { name: "Inizia" }).click()

  // catalog → add an item
  await expect(page.getByRole("heading", { name: "Scegli i prodotti" })).toBeVisible()
  await page
    .locator(".fk-catalog-item", { hasText: "T-shirt FlowKit" })
    .getByRole("button", { name: "Aggiungi" })
    .click()
  await page.getByRole("button", { name: "Continua", exact: true }).click()

  // shipping
  await page.getByText("Standard (3-5 giorni)").click()
  await page.getByRole("button", { name: "Continua", exact: true }).click()

  // address
  await page.getByRole("textbox", { name: "Paese" }).fill("IT")
  await page.getByRole("textbox", { name: "Indirizzo", exact: true }).fill("Via Roma 1")
  await page.getByRole("textbox", { name: "CAP" }).fill("20100")
  await page.getByRole("textbox", { name: "Città" }).fill("Milano")
  await page.getByRole("button", { name: "Continua", exact: true }).click()

  // payment — fill the Stripe Payment Element with a decline test card (4000...0002)
  await expect(page.getByRole("heading", { name: "Completa il pagamento" })).toBeVisible()
  const stripe = page.frameLocator(".fk-step-payment-stripe iframe").first()
  await stripe.getByRole("textbox", { name: "Card number" }).fill("4000000000000002")
  await stripe.getByRole("textbox", { name: "Expiration date" }).fill("12 / 34")
  await stripe.getByRole("textbox", { name: "Security code" }).fill("123")
  await expect(page.getByText("Visa •••• 0002")).toBeVisible()
  await page.getByRole("button", { name: "Continua", exact: true }).click()

  // review → submit → decline → error screen
  await expect(page.getByRole("heading", { name: "Controlla e paga" })).toBeVisible()
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
