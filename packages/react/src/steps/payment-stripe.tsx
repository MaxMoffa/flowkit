import { useEffect, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import type { PaymentStripeStep, PaymentStripeValue } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { FlowMarkdown } from "../markdown"
import { StepTitle } from "./shared/step-title"

interface PaymentFormProps {
  step: PaymentStripeStep
  onChange: (value: PaymentStripeValue) => void
}

/** `value` is an untyped answer at this boundary, so accept it only if it carries the
 *  shape this step writes — a stale value must never read as a completed payment. */
function asPaymentStripeValue(value: unknown): PaymentStripeValue | null {
  if (value === null || typeof value !== "object") return null
  const current = value as PaymentStripeValue
  return typeof current.status === "string" ? current : null
}

function PaymentForm({ step, onChange }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    if (!stripe || !elements) return
    setSubmitting(true)
    setError(null)
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    })
    setSubmitting(false)
    if (confirmError) {
      setError(confirmError.message ?? "Pagamento non riuscito.")
      onChange({ status: "failed" })
      return
    }
    onChange({
      status: paymentIntent?.status === "succeeded" ? "succeeded" : "processing",
      paymentIntentId: paymentIntent?.id,
    })
  }

  return (
    <>
      <PaymentElement />
      {error && <p className="fk-gps-error">{error}</p>}
      <button
        type="button"
        className="fk-btn-neutral"
        onClick={() => void handlePay()}
        disabled={!stripe || !elements || submitting}
      >
        {submitting ? "Elaborazione…" : <FlowMarkdown text={step.buttonLabel} variant="inline" />}
      </button>
    </>
  )
}

export function PaymentStripeStepView({ step, value, onChange }: StepComponentProps<PaymentStripeStep>) {
  const [stripePromise] = useState(() =>
    loadStripe(step.publishableKey, step.stripeAccount ? { stripeAccount: step.stripeAccount } : undefined),
  )
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    step
      .createPaymentIntent({
        amount: step.amount,
        currency: step.currency,
        metadata: step.description ? { description: step.description } : undefined,
      })
      .then((result) => {
        if (!cancelled) setClientSecret(result.clientSecret)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Impossibile avviare il pagamento.")
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const succeeded = asPaymentStripeValue(value)?.status === "succeeded"

  return (
    <div className="fk-step fk-step-payment-stripe">
      <StepTitle image={step.image} title={step.title} />
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
      {step.description && <p className="fk-subtitle"><FlowMarkdown text={step.description} variant="block" /></p>}
      {succeeded ? (
        <div className="fk-loc-row">
          <div className="fk-loc-ic">✅</div>
          <div className="fk-loc-title">Pagamento completato</div>
        </div>
      ) : error ? (
        <p className="fk-gps-error">{error}</p>
      ) : clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm step={step} onChange={onChange} />
        </Elements>
      ) : (
        <p className="fk-map-search-loading">Preparo il pagamento…</p>
      )}
    </div>
  )
}
