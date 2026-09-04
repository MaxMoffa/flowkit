import { useLayoutEffect, useRef, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import type { Appearance, StripePaymentElementChangeEvent } from "@stripe/stripe-js"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import {
  resolvePaymentAmount,
  resolveText,
  type PaymentMethodSummary,
  type PaymentStripeStep,
  type PaymentStripeValue,
} from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { FlowMarkdown } from "../markdown"
import { Spinner } from "./shared/spinner"
import { StepTitle } from "./shared/step-title"

/** `value` is untyped at this boundary — accept it only if it carries the shape this
 *  step writes, so a stale/foreign value never reads as a collected method. */
function asPaymentStripeValue(value: unknown): PaymentStripeValue | null {
  if (value === null || typeof value !== "object") return null
  const current = value as PaymentStripeValue
  return current.status === "collected" && typeof current.confirmationTokenId === "string" ? current : null
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: "Carta",
  paypal: "PayPal",
  klarna: "Klarna",
  revolut_pay: "Revolut Pay",
  ideal: "iDEAL",
  bancontact: "Bancontact",
  sepa_debit: "Addebito SEPA",
  link: "Link",
}

function summaryLabel(summary: PaymentMethodSummary): string {
  if (summary.type === "card" && summary.last4) {
    const brand = summary.brand ? summary.brand.replace(/\b\w/g, (c) => c.toUpperCase()) : "Carta"
    return `${brand} •••• ${summary.last4}`
  }
  return (
    PAYMENT_METHOD_LABELS[summary.type] ??
    summary.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

/** Reads the resolved FlowKit theme tokens off the mounted DOM (the theme is only ever
 *  exposed as CSS custom properties, never as a prop/context) and maps them onto a
 *  Stripe Elements `appearance` so the Payment Element visually tracks the active flow
 *  theme — accent, text, surfaces, radius, font. Provider brand marks (Klarna, Revolut,
 *  …) and the internal row layout are fixed by Stripe and can't be themed. */
function buildAppearance(el: HTMLElement | null): Appearance {
  const dark = el?.closest("[data-fk-mode]")?.getAttribute("data-fk-mode") === "dark"
  const read = (name: string, fallback: string) => {
    if (!el) return fallback
    const v = getComputedStyle(el).getPropertyValue(name).trim()
    return v || fallback
  }
  const accent = read("--fk-accent", "#2783DE")
  const text = read("--fk-text", dark ? "#F5F5F4" : "#2C2C2B")
  const text2 = read("--fk-text2", "#7D7A75")
  const canvas = read("--fk-canvas", dark ? "#1C1C1B" : "#FFFFFF")
  const border = read("--fk-border", dark ? "#3A3A38" : "#E6E5E3")
  const danger = read("--fk-danger", "#E56458")
  const radius = read("--fk-radius-md", "12px")
  const fontFamily = read("--fk-font-body", "system-ui, -apple-system, Segoe UI, Roboto, sans-serif")

  return {
    theme: dark ? "night" : "flat",
    variables: {
      colorPrimary: accent,
      colorText: text,
      colorTextSecondary: text2,
      colorTextPlaceholder: text2,
      colorBackground: canvas,
      colorDanger: danger,
      borderRadius: radius,
      fontFamily,
      spacingUnit: "4px",
      fontSizeBase: "15px",
    },
    rules: {
      ".Tab, .Block, .Input": { border: `1px solid ${border}`, boxShadow: "none" },
      ".Tab:hover": { borderColor: accent },
      ".Tab--selected": { borderColor: accent, boxShadow: `0 0 0 1px ${accent}` },
      ".Input:focus": { borderColor: accent, boxShadow: `0 0 0 3px ${accent}22` },
      // The "flat" theme draws the accordion (method list) with no separators — in a
      // light theme the rows become invisible. Give each row a real border.
      ".AccordionItem": { border: `1px solid ${border}`, boxShadow: "none" },
      ".AccordionItem:hover": { borderColor: accent },
      ".AccordionItem--selected": { borderColor: accent, boxShadow: `0 0 0 1px ${accent}` },
      ".PickerItem": { border: `1px solid ${border}`, boxShadow: "none" },
      ".PickerItem--selected": { borderColor: accent, boxShadow: `0 0 0 1px ${accent}` },
    },
  }
}

interface PickerProps {
  step: PaymentStripeStep
  collected: PaymentStripeValue | null
  onChange: (value: PaymentStripeValue | null) => void
}

function PaymentMethodPicker({ step, collected, onChange }: PickerProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [ready, setReady] = useState(false)
  const [editing, setEditing] = useState(collected === null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const collectingRef = useRef(false)

  async function collect() {
    if (!stripe || !elements || collectingRef.current) return
    collectingRef.current = true
    setBusy(true)
    setError(null)
    try {
      const submitResult = await elements.submit()
      if (submitResult.error) {
        setError(submitResult.error.message ?? "Controlla i dati inseriti.")
        return
      }
      const { confirmationToken, error: tokenError } = await stripe.createConfirmationToken({ elements })
      if (tokenError || !confirmationToken) {
        setError(tokenError?.message ?? "Impossibile salvare il metodo di pagamento.")
        return
      }
      const preview = confirmationToken.payment_method_preview as
        | { type?: string; card?: { brand?: string; last4?: string } }
        | undefined
      onChange({
        status: "collected",
        confirmationTokenId: confirmationToken.id,
        summary: {
          type: preview?.type ?? "card",
          brand: preview?.card?.brand ?? undefined,
          last4: preview?.card?.last4 ?? undefined,
        },
      })
      setEditing(false)
    } finally {
      setBusy(false)
      collectingRef.current = false
    }
  }

  function handleElementChange(event: StripePaymentElementChangeEvent) {
    if (!event.complete) {
      // The form no longer matches the token we stored — drop it so the flow
      // can't advance (or submit) on a method the user is still editing.
      if (collected) onChange(null)
      return
    }
    void collect()
  }

  if (collected && !editing) {
    return (
      <div className="fk-payment-summary">
        <div className="fk-loc-row">
          <div className="fk-loc-ic">💳</div>
          <div className="fk-loc-title">{summaryLabel(collected.summary)}</div>
        </div>
        <button type="button" className="fk-payment-change fk-link" onClick={() => setEditing(true)}>
          <FlowMarkdown text={step.changeLabel} variant="inline" />
        </button>
      </div>
    )
  }

  return (
    <div className="fk-payment-picker">
      {!ready && <Spinner label="Carico i metodi di pagamento…" />}
      <div hidden={!ready}>
        <PaymentElement onReady={() => setReady(true)} onChange={handleElementChange} />
      </div>
      {busy && <Spinner label="Salvo il metodo…" compact />}
      {error && <p className="fk-gps-error">{error}</p>}
    </div>
  )
}

export function PaymentStripeStepView({
  step,
  value,
  onChange,
  flow,
  answers,
}: StepComponentProps<PaymentStripeStep>) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [stripePromise] = useState(() =>
    loadStripe(step.publishableKey, step.stripeAccount ? { stripeAccount: step.stripeAccount } : undefined),
  )
  const [appearance, setAppearance] = useState<Appearance | null>(null)

  useLayoutEffect(() => {
    setAppearance(buildAppearance(rootRef.current))
  }, [])

  const collected = asPaymentStripeValue(value)
  // "fixed" → the static amount; "cart" → the order total built earlier in the flow.
  const amount = resolvePaymentAmount(step, flow, answers)

  return (
    <div className="fk-step fk-step-payment-stripe" ref={rootRef}>
      <StepTitle image={step.image} title={step.title} />
      {step.subtitle && (
        <p className="fk-subtitle">
          <FlowMarkdown text={step.subtitle} variant="block" />
        </p>
      )}
      {step.description && (
        <p className="fk-subtitle">
          <FlowMarkdown text={step.description} variant="block" />
        </p>
      )}
      {/* No in-step total for "cart" mode: the FlowRunner footer shows the running
          order total on every step, so repeating it here would just duplicate it. */}
      {amount <= 0 ? (
        <p className="fk-subtitle">{resolveText(flow, "catalogEmpty")}</p>
      ) : appearance ? (
        <Elements
          stripe={stripePromise}
          options={{
            mode: "payment",
            amount,
            currency: step.currency.toLowerCase(),
            paymentMethodCreation: "manual",
            appearance,
          }}
        >
          <PaymentMethodPicker step={step} collected={collected} onChange={onChange} />
        </Elements>
      ) : (
        <Spinner label="Preparo il pagamento…" />
      )}
    </div>
  )
}
