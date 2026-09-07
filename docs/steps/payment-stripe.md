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
| `amountSource` | `"fixed" \| "cart"` | `"fixed"` | `"fixed"`: the static `amount` below is the whole charge. `"cart"`: the charge is the flow's order total (`computeOrderTotal` — every `catalog` step plus priced options on select-cards/multi-select/radio/chips) plus `amount` as an optional flat surcharge |
| `amount` | `number` | — | Amount in the currency's minor unit (cents for EUR/USD). **Required and positive** when `amountSource: "fixed"`; an optional flat surcharge (shipping, booking fee…) when `amountSource: "cart"` |
| `currency` | `string` | `"eur"` | 3-letter ISO code |
| `description` | `string` | — | Shown above the payment form |
| `stripeAccount` | `string` | — | Stripe Connect destination account |
| `changeLabel` | `string` | `"Cambia"` | Label of the "change method" button shown once a method is picked |
| `taxBehavior` | `"inclusive" \| "exclusive"` | `"exclusive"` | Whether item prices already include tax. Mirrors Stripe's `tax_behavior`; only meaningful when `calculateTax` is set |
| `calculateTax` | `(input) => Promise<TaxCalculation>` | — | Platform-injected function (never serialized — same pattern as `verifyToken`). See [Tax](#tax-calculatetax) below |

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

## Tax (`calculateTax`)

`calculateTax` is a function you (the platform) inject on the `payment-stripe`
step config — it's stripped before storage, the same way `verifyToken` is on the
`verification` step. FlowKit calls it, shows what comes back, and nothing more:
the actual charge is always re-derived server-side, never trusted from the
client.

```ts
import type { CalculateTax } from "@flowkit-io/core"

const calculateTax: CalculateTax = async (input) => {
  // input: { currency, lines, address, taxBehavior, addressSource }
  // Call Stripe's POST /v1/tax/calculations on the flow owner's connected
  // account, map the response into a TaxCalculation.
  return { taxAmount, totalWithTax, currency, breakdown }
}
```

`buildTaxInput(flow, answers, taxBehavior, estimatedAddress?)` (from
`@flowkit-io/core`) builds `calculateTax`'s input from the flow's priced
selections (`buildOrderSummary`) and an address — the flow's own `address` step
answer if one has been given yet, else the `estimatedAddress` fallback. Both the
`review` step and the `catalog` step already call this for you; reach for it
directly only if you're calling `calculateTax` from your own custom step.

### Estimating tax before an address is collected

The `review` step sits near the end of the flow, after `address`, so its tax
line is normally exact. The `catalog` step usually sits *before* `address` —
the visitor hasn't typed anything yet, the way most storefronts still show a
tax-aware price pre-checkout (Amazon and friends: a server-side IP lookup gives
a country, no account needed).

Pass that guess down through `FlowRunnerProps.estimatedAddress` — typically just
`{ country: "IT" }` from a server-side IP lookup (a `cf-ipcountry`-style edge
header, a MaxMind/ipapi lookup…). FlowKit has no server of its own and never
does this lookup itself:

```tsx
<FlowRunner flow={flow} estimatedAddress={{ country: visitorCountry }} />
```

The `catalog` step then calls `calculateTax` itself once the cart isn't empty,
using `estimatedAddress` as a fallback while the real `address` step hasn't been
answered yet, and shows the result labeled as an estimate (`· stima` /
`· estimate`). The result's `addressSource` tells you which one it used:
`"collected"` (the visitor's own `address` step answer — trust it) or
`"estimated"` (your fallback — caveat it, as both the built-in `catalog` and
`review` UI already do). Once the visitor reaches `address` for real, later
calls switch to `"collected"` on their own — no wiring needed.

## Review step integration

When a flow contains a `payment-stripe` step, the final `review` step:

- shows the amount as a highlighted **total** callout at the top (unless
  `paymentSummary: "hidden"` on the review step),
- switches its submit button to `submitWithPayment` ("Completa pagamento e invia"),
- lists the chosen method as a row (`💳` icon + `Visa •••• 4242`, `PayPal`, …),
  clickable to jump back and change it.

## Theming

The Payment Element's `appearance` is derived from the active flow theme's tokens
(accent, text, surfaces, radius, font), so it tracks the theme automatically.
Provider brand marks (Klarna, Revolut, …) and the internal row layout are fixed
by Stripe and can't be restyled.

[← All steps](./index.md)
