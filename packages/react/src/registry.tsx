import type { ComponentType } from "react"
import type { Step } from "@flowkit-io/core"
import type { StepComponentProps, StripeNextActionRunner } from "./types"

/**
 * Registry of React components per step type. Replaces the closed Record:
 * new types (built-in or custom) are added by calling
 * registerStepComponent, without touching this file.
 */
const registry = new Map<string, ComponentType<StepComponentProps<Step>>>()

export function registerStepComponent<T extends Step = Step>(
  type: string,
  Component: ComponentType<StepComponentProps<T>>,
): void {
  registry.set(type, Component as unknown as ComponentType<StepComponentProps<Step>>)
}

export function getStepComponent(type: string): ComponentType<StepComponentProps<Step>> | undefined {
  return registry.get(type)
}

/**
 * Runner that completes a Stripe 3DS/SCA challenge in the browser, called by
 * FlowRunner when a deferred charge rejects with `PaymentRequiresActionError`.
 * The `@flowkit-io/react/payment-stripe` entry registers the real one (the only
 * module that loads Stripe.js) on import — so FlowRunner never touches Stripe.js
 * itself. Exposed for tests and for a host that wants to swap the executor (a
 * custom Stripe.js loader, a mock for a demo/QA build); register yours *after*
 * importing the payment entry so it wins. Lives here — the same cross-entry
 * singleton the step-component registry relies on.
 */
let stripeNextActionRunner: StripeNextActionRunner | null = null

/** Pass `null` to unregister. */
export function registerStripeNextActionRunner(runner: StripeNextActionRunner | null): void {
  stripeNextActionRunner = runner
}

export function getStripeNextActionRunner(): StripeNextActionRunner | null {
  return stripeNextActionRunner
}

/** @deprecated use getStepComponent(type); kept for backward compatibility of direct reads. */
export const stepRegistry = new Proxy(
  {},
  {
    get: (_target, prop: string) => registry.get(prop),
  },
) as Record<string, ComponentType<StepComponentProps<Step>> | undefined>
