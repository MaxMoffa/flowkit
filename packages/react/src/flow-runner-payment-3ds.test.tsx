import { afterEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { parseFlow, PaymentRequiresActionError } from "@flowkit-io/core"
import { FlowRunner } from "./flow-runner"
import { registerStripeNextActionRunner } from "./registry"
import "./steps/builtins"

/**
 * Deferred 3DS/SCA hook: `onSubmit` rejecting with `PaymentRequiresActionError`
 * makes FlowRunner run the registered Stripe next-action runner (normally
 * installed by the `@flowkit-io/react/payment-stripe` entry) and, on success,
 * re-invoke `onSubmit` once. See flow-runner.tsx `submitFlow`.
 */
function makeFlow(errorScreen?: unknown) {
  return parseFlow({
    id: "f",
    title: "F",
    ...(errorScreen === undefined ? {} : { errorScreen }),
    steps: [
      { id: "welcome", type: "intro", cta: "Inizia" },
      {
        id: "pay",
        key: "pay",
        type: "payment-stripe",
        publishableKey: "pk_test_123",
        amount: 1500,
        currency: "eur",
        stripeAccount: "acct_42",
      },
      { id: "review", type: "review", submitLabel: "Invia" },
      { id: "end", type: "confirmation" },
    ],
  })
}

const COLLECTED = {
  pay: {
    status: "collected" as const,
    confirmationTokenId: "ct_1",
    summary: { type: "card", brand: "visa", last4: "3155" },
  },
}

function renderAtReview(onSubmit: (a: unknown) => unknown, errorScreen?: unknown) {
  return render(
    <FlowRunner
      flow={makeFlow(errorScreen)}
      initialStep="review"
      initialAnswers={COLLECTED}
      onSubmit={onSubmit as never}
    />,
  )
}

afterEach(() => {
  registerStripeNextActionRunner(null)
  vi.restoreAllMocks()
})

describe("FlowRunner: deferred payment 3DS/SCA", () => {
  it("runs the next-action runner on a requires_action rejection, then re-submits and advances", async () => {
    const runner = vi.fn().mockResolvedValue({ ok: true })
    registerStripeNextActionRunner(runner)

    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(new PaymentRequiresActionError("pi_1_secret_xyz"))
      .mockResolvedValueOnce(undefined)

    renderAtReview(onSubmit)
    fireEvent.click(screen.getByRole("button", { name: "Invia" }))

    await waitFor(() => expect(runner).toHaveBeenCalledTimes(1))
    expect(runner).toHaveBeenCalledWith({
      publishableKey: "pk_test_123",
      stripeAccount: "acct_42",
      clientSecret: "pi_1_secret_xyz",
    })
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2))
    // Second submit resolved → flow advanced to confirmation.
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Grazie!"),
    )
  })

  it("keeps the user on review with the challenge error when the runner reports failure", async () => {
    registerStripeNextActionRunner(vi.fn().mockResolvedValue({ ok: false, error: "Autenticazione annullata." }))
    const onSubmit = vi.fn().mockRejectedValue(new PaymentRequiresActionError("pi_1_secret_xyz"))

    renderAtReview(onSubmit)
    fireEvent.click(screen.getByRole("button", { name: "Invia" }))

    await waitFor(() => expect(screen.getByText("Autenticazione annullata.")).not.toBeNull())
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("button", { name: "Invia" })).not.toBeNull()
  })

  it("surfaces a generic auth error (and logs) when no runner is registered", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {})
    const onSubmit = vi.fn().mockRejectedValue(new PaymentRequiresActionError("pi_1_secret_xyz"))

    renderAtReview(onSubmit)
    fireEvent.click(screen.getByRole("button", { name: "Invia" }))

    await waitFor(() =>
      expect(screen.getByText("Autenticazione della carta non riuscita, riprova.")).not.toBeNull(),
    )
    expect(err).toHaveBeenCalled()
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it("a plain declined charge is untouched by the 3DS path", async () => {
    const runner = vi.fn().mockResolvedValue({ ok: true })
    registerStripeNextActionRunner(runner)
    const onSubmit = vi.fn().mockRejectedValue(new Error("Carta rifiutata."))

    renderAtReview(onSubmit)
    fireEvent.click(screen.getByRole("button", { name: "Invia" }))

    await waitFor(() => expect(screen.getByText("Carta rifiutata.")).not.toBeNull())
    expect(runner).not.toHaveBeenCalled()
  })

  it("retry on the error screen also completes the challenge and advances", async () => {
    const runner = vi.fn().mockResolvedValue({ ok: true })
    registerStripeNextActionRunner(runner)
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(new Error("Errore temporaneo."))
      .mockRejectedValueOnce(new PaymentRequiresActionError("pi_1_secret_xyz"))
      .mockResolvedValueOnce(undefined)

    renderAtReview(onSubmit, {})
    fireEvent.click(screen.getByRole("button", { name: "Invia" }))
    await screen.findByRole("alert")

    fireEvent.click(screen.getByRole("button", { name: "Riprova" }))

    await waitFor(() => expect(runner).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(3))
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull())
  })
})
