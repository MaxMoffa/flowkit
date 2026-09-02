# `payment-stripe`

Collects a payment method through the Stripe Payment Element. **The step never
charges the card** — it only mints a single-use Stripe *ConfirmationToken*
client-side. The actual charge is **deferred to the flow's final submit** (the
review step's button), so a user can't pay and then abandon the flow before the
report is sent.

Answer value: `{ status: "collected", confirmationTokenId, summary }` — valid
once a method is picked. Component: `PaymentStripeStepView`.

Not registered by the main entry point — Stripe.js is only downloaded if you
import it:

```ts
import "@flowkit-io/react/payment-stripe"
```

<StepPreview type="payment-stripe" />

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `publishableKey` | `string` | — (required) | Stripe **publishable** key. Never a secret key |
| `amount` | `number` | — (required) | Amount in the currency's minor unit (cents for EUR/USD). Also shown as the total on the review step |
| `currency` | `string` | `"eur"` | 3-letter ISO code |
| `description` | `string` | — | Shown above the payment form |
| `stripeAccount` | `string` | — | Stripe Connect destination account |
| `changeLabel` | `string` | `"Cambia"` | Label of the "change method" button shown once a method is picked |

There is **no `createPaymentIntent` callback** and **no pay button** on this step
(both existed before v2.40). The Payment Element runs in Stripe's *deferred* mode:
no PaymentIntent is created on mount.

## Finalizing the charge in `onSubmit`

The charge is your responsibility, from inside the `FlowRunner`'s `onSubmit`
handler. Use `getPendingPayment(flow, answers)` to get the collected token, hand
it to your backend, and **throw** if the charge fails — the FlowRunner then keeps
the user on the review step and shows the error under the submit button.

```ts
import { getPendingPayment } from "@flowkit-io/core"

<FlowRunner
  flow={flow}
  onSubmit={async (answers) => {
    const pay = getPendingPayment(flow, answers)
    if (pay) {
      const res = await fetch("/api/confirm-payment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          confirmationTokenId: pay.confirmationTokenId,
          amount: pay.amount,
          currency: pay.currency,
        }),
      })
      if (!res.ok) throw new Error("Pagamento rifiutato. Controlla i dati della carta.")
      const { requiresAction, clientSecret } = await res.json()
      if (requiresAction) {
        const stripe = await loadStripe(publishableKey)
        const { error } = await stripe!.handleNextAction({ clientSecret })
        if (error) throw new Error(error.message ?? "Autenticazione non riuscita.")
      }
    }
    await saveReport(answers)
  }}
/>
```

Your backend (secret key) creates and confirms the PaymentIntent in one call:

```ts
const intent = await stripe.paymentIntents.create({
  amount, currency,
  confirmation_token: confirmationTokenId,
  confirm: true,
  return_url: "https://example.com/done",
})
// intent.status === "requires_action"  → return { requiresAction: true, clientSecret: intent.client_secret }
// intent.status === "succeeded"         → return { ok: true }
```

`getPendingPayment` returns `null` when the flow has no payment step or the user
didn't pick a method — assumes at most one `payment-stripe` step per flow.

## Review step integration

When a flow contains a `payment-stripe` step, the final `review` step:

- shows the amount as a highlighted **total** callout at the top (unless
  `paymentSummary: "hidden"` on the review step),
- switches its submit button to `submitWithPayment` ("Completa pagamento e invia"),
- lists the chosen method as a row (`💳 Visa •••• 4242`, `💳 PayPal`, …), clickable
  to jump back and change it.

## Theming

The Payment Element's `appearance` is derived from the active flow theme's tokens
(accent, text, surfaces, radius, font), so it tracks the theme automatically.
Provider brand marks (Klarna, Revolut, …) and the internal row layout are fixed
by Stripe and can't be restyled.

[← All steps](./index.md)
