# `payment-stripe`

Payment collected through the Stripe Payment Element. Answer value:
`{ status: "succeeded" | "processing" | "failed", paymentIntentId? }` — valid only when
`status` is `"succeeded"`. Component: `PaymentStripeStepView`.

Not registered by the main entry point — Stripe.js is only downloaded if you import it:

```ts
import "@flowkit-io/react/payment-stripe"
```

The component never creates the PaymentIntent itself (would require a secret key in the
browser). `createPaymentIntent` is your callback: it must call **your** backend, which
holds the Stripe secret key, and return the client secret.

<StepPreview type="payment-stripe" />

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `publishableKey` | `string` | — (required) | Stripe **publishable** key. Never a secret key |
| `amount` | `number` | — (required) | Amount in the currency's minor unit (cents for EUR/USD) |
| `currency` | `string` | `"eur"` | 3-letter ISO code |
| `description` | `string` | — | Shown above the payment form |
| `stripeAccount` | `string` | — | Stripe Connect destination account |
| `buttonLabel` | `string` | `"Paga ora"` | Pay button text |
| `createPaymentIntent` | `(params) => Promise<{ clientSecret }>` | — (required) | Called on mount with `{ amount, currency, metadata? }` |

## Example

```ts
{ id: "payment", type: "payment-stripe", title: "Complete the payment",
  publishableKey: "pk_test_…", amount: 1500, currency: "eur",
  createPaymentIntent: ({ amount, currency }) =>
    fetch("/api/payment-intent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount, currency }),
    }).then((r) => r.json()) }
```

[← All steps](./index.md)
