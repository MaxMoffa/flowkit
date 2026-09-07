import type { ErrorAction, ErrorScreenConfig, Flow, StepImage } from "./schema"
import { resolveText } from "./i18n"

/**
 * Runtime error payload — what a caller hands FlowRunner (`ref.showError()` /
 * `props.onError()`), or what FlowRunner builds itself for a rejected review submit.
 * Every field is optional: unset ones fall back to `flow.errorScreen`, then the
 * shipped i18n defaults. `canRetry` is set by FlowRunner (not a public caller) when
 * the failed operation can be re-run, and only then does the default action set
 * include a "retry" button.
 */
export interface ErrorPayloadInput {
  /** Machine-readable code — informational, for the consumer's own logging/branching. */
  code?: string
  title?: string
  message?: string
  actions?: ErrorAction[]
  canRetry?: boolean
}

export interface ResolvedErrorAction {
  action: ErrorAction
  label: string
}

export interface ResolvedErrorScreen {
  image: StepImage
  title: string
  message: string
  actions: ResolvedErrorAction[]
}

/** Default badge: an inline SVG warning triangle rather than the ⚠️ emoji — it inherits
 *  `currentColor` (danger) and sits perfectly centred in the circle, matching the
 *  confirmation step's SVG checkmark. Authors can still set `errorScreen.image` to an
 *  emoji/icon/image of their own. Sanitised on render by `@flowkit-io/react`. */
const DEFAULT_IMAGE: StepImage = {
  kind: "icon",
  value:
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M12 4 2 20h20L12 4Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M12 10v4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    '<circle cx="12" cy="17.6" r="1.15" fill="currentColor"/></svg>',
}

/** Id of the flow's `payment-stripe` step, if any — the target of the default
 *  "change payment method" recovery action. */
export function paymentStepId(flow: Flow): string | undefined {
  return flow.steps.find((s) => s.type === "payment-stripe")?.id
}

function defaultLabel(flow: Flow, action: ErrorAction): string {
  switch (action.kind) {
    case "retry":
      return resolveText(flow, "errorRetry")
    case "goToStep":
      return resolveText(flow, "errorEditStep")
    case "back":
      return resolveText(flow, "back")
    case "restart":
      return resolveText(flow, "errorRestart")
    case "home":
      return resolveText(flow, "confirmationHome")
    case "dismiss":
      return resolveText(flow, "catalogClose")
  }
}

/** Action set used when neither the payload nor `flow.errorScreen` specifies one:
 *  retry (when retryable) plus a way out — "change payment method" if the flow has a
 *  payment step, otherwise plain "back". */
function defaultActions(flow: Flow, input: ErrorPayloadInput): ErrorAction[] {
  const actions: ErrorAction[] = []
  if (input.canRetry) actions.push({ kind: "retry" })
  const payId = paymentStepId(flow)
  if (payId) {
    actions.push({ kind: "goToStep", stepId: payId, label: resolveText(flow, "errorChangePayment") })
  } else {
    actions.push({ kind: "back" })
  }
  return actions
}

/**
 * Merges a runtime error payload with the flow's `errorScreen` defaults and the
 * shipped i18n text into a fully resolved screen the renderer can display verbatim.
 * Precedence per field: payload → `flow.errorScreen` → default.
 */
export function resolveErrorScreen(flow: Flow, input: ErrorPayloadInput = {}): ResolvedErrorScreen {
  const config: ErrorScreenConfig = flow.errorScreen ?? {}
  const actions = input.actions ?? config.actions ?? defaultActions(flow, input)
  return {
    image: config.image ?? DEFAULT_IMAGE,
    title: input.title ?? config.title ?? resolveText(flow, "errorTitle"),
    message: input.message ?? config.message ?? resolveText(flow, "errorGenericMessage"),
    actions: actions.map((action) => ({
      action,
      label: action.label ?? defaultLabel(flow, action),
    })),
  }
}
