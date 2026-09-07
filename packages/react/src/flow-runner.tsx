import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type {
  AddressValue,
  Answers,
  ContentText,
  CurrentStepInfo,
  Flow,
  FlowState,
  Locale,
  ResolvedErrorAction,
  ResolvedErrorScreen,
  StepChangeDirection,
} from "@flowkit-io/core"
import type { CatalogItem, CatalogValue, PaymentStripeStep } from "@flowkit-io/core"
import {
  answerKey,
  applyBranch,
  asCatalogValue,
  buildOrderSummary,
  canGoBack,
  canGoNext,
  catalogTotal,
  computeInitialFlowState,
  createFlowState,
  filterValidAnswers,
  flowHasPayment,
  formatMessage,
  formatMoney,
  getCurrentStep,
  getCurrentStepInfo,
  getProgressInfo,
  getStepMeta,
  getStepTypeDefinition,
  goToStep,
  isLastStep,
  isStepReachable,
  next as nextState,
  prev as prevState,
  resolveBranch,
  resolveContentText,
  resolveErrorScreen,
  resolveFlowPath,
  resolvePaymentAmount,
  resolveText,
  returnToStep,
  setAnswerAndInvalidateDownstream,
  setStepMeta,
} from "@flowkit-io/core"
import type { Theme, ThemeMode } from "@flowkit-io/themes"
import { ConfirmationFooter, StepFooter } from "./flow-footer"
import { ErrorScreenView } from "./error-screen"
import { getStepComponent } from "./registry"
import { ThemeProvider } from "./theme-provider"
import { useFlowRunnerLayout } from "./use-flow-runner-layout"
import { haptic } from "./haptics"
import type { FlowSubmitHandler, ShowErrorPayload } from "./types"
import { taxBehaviorNote } from "./steps/shared/tax-note"

/** Step with "intro" role: optional standard fields, always present on built-in intro/confirmation, optional on custom steps with the same role. */
type StepWithIntroFields = { cta?: string }
type StepWithReviewFields = { submitLabel?: string; mode?: "final" | "checkpoint" }
type StepWithConfirmationFields = {
  secondaryCta?: string
  primaryCta?: string
  showHomeButton?: boolean
  showRestartButton?: boolean
  homeUrl?: string
}

export interface FlowRunnerProps {
  flow: Flow
  theme?: Theme
  mode?: ThemeMode
  onSubmit?: FlowSubmitHandler
  onChange?: (answers: Answers) => void
  /** Called every time the visibly rendered step changes (see `CurrentStepInfo`,
   *  core/machine.ts) — mount, next/back, a review-row jump, and a branch-invalidating
   *  answer edit ("branch-change"). Never called for a "logic" (branch) step itself:
   *  those are resolved and skipped before this fires. */
  onStepChange?: (step: CurrentStepInfo) => void
  /** Step to start on instead of the first step, by id — e.g. to resume a flow after a
   *  page refresh. Read once, at mount: changing it on a later render has no effect.
   *  Falls back silently to the normal initial step if the id doesn't exist in `flow`,
   *  or isn't reachable given `initialAnswers` (e.g. a branch would route elsewhere) —
   *  never throws. */
  initialStep?: string
  /** Answers to preload before the flow ever renders — typically used together with
   *  `initialStep` to resume a flow after a page refresh. Read once, at mount. Each
   *  entry is validated against its step's own validation rule and dropped if invalid;
   *  keys that don't match any step's `key`/`id` are dropped too. Never throws. */
  initialAnswers?: Answers
  /** Host page's best-guess visitor address, typically just `{ country }` from a
   *  server-side IP lookup (a `cf-ipcountry`-style edge header, a MaxMind/ipapi
   *  lookup…) — the same technique storefronts like Amazon use to show tax-inclusive
   *  prices before checkout, without an account or a typed address. FlowKit never
   *  does this lookup itself (no server of its own); pass the result down here. Steps
   *  that call `calculateTax` (currently `catalog`) use it as a fallback address
   *  while the flow's own `address` step (if any) hasn't been answered yet, and label
   *  the result as an estimate. Not validated, not trusted for the actual charge. */
  estimatedAddress?: Partial<AddressValue>
  /** Fire a short device vibration on the navigation buttons (continue/back/submit,
   *  review-row jumps, confirmation restart) — and a distinct longer buzz when the
   *  primary button is pressed while the step is still invalid. Default `true`. Only has
   *  an effect where the browser supports the Vibration API (Android); a silent no-op
   *  elsewhere (iOS Safari, desktop). Set `false` to opt out entirely. */
  haptics?: boolean
  /** Overrides `flow.locale` for this render, without mutating the flow config itself —
   *  same "platform injects it at runtime" spirit as `estimatedAddress`. Useful when the
   *  same saved flow is served in several languages and the active one is decided
   *  outside the flow (e.g. the visitor's browser/account locale). Unset = `flow.locale`. */
  locale?: Locale
  /** Overrides `flow.content` for this render, without mutating the flow config itself —
   *  same spirit as `locale` above. Lets a host serve one flow definition in multiple
   *  languages by swapping only the content dictionary per request, instead of
   *  duplicating the whole flow. Unset = `flow.content`. */
  content?: Record<string, string>
}

/** Imperative handle exposed via `ref`: a `currentStep` that's always in sync with the
 *  most recent `onStepChange` call (including the initial one, already correct on first
 *  render) — lets an integrator read the current step without maintaining their own
 *  `onStepChange`-fed state. `goToStep`/`getAnswers`/`setAnswers`/`reset` let an
 *  integrator drive the flow from outside (e.g. resuming after a refresh alongside
 *  `initialStep`/`initialAnswers`, or a custom "jump to step" control). */
export interface FlowRunnerHandle {
  currentStep: CurrentStepInfo
  /** Jumps to `stepId` if it exists in the flow and is reachable given the current
   *  answers (the same rule `initialStep` uses at mount) — returns whether the jump
   *  happened. An unknown or unreachable id is a no-op that returns `false`; never
   *  throws. Reports through `onStepChange`/`currentStep` with `direction: "jump"`,
   *  same as a review-row shortcut. */
  goToStep: (stepId: string) => boolean
  /** Current answers snapshot (same shape `onChange` receives). */
  getAnswers: () => Answers
  /** Replaces the answers wholesale — same validation/unknown-key filtering as
   *  `initialAnswers`. Does not itself move the current step. */
  setAnswers: (answers: Answers) => void
  /** Resets the flow to its blank starting state — the same action the confirmation
   *  screen's restart button performs. Ignores `initialStep`/`initialAnswers` (those
   *  only ever apply at mount). */
  reset: () => void
  /** Shows the generic error screen (see `flow.errorScreen`) with this payload —
   *  for a failure raised outside the review submit (a custom step's own async call,
   *  an adapter error the host caught). No-op unless the flow declares `errorScreen`.
   *  Pass `actions` to override the default recovery buttons; a `retry` action re-runs
   *  `onRetry` if given. */
  showError: (payload: ShowErrorPayload) => void
}

export const FlowRunner = forwardRef<FlowRunnerHandle, FlowRunnerProps>(function FlowRunner(
  {
    flow: flowProp,
    theme,
    mode,
    onSubmit,
    onChange,
    onStepChange,
    initialStep,
    initialAnswers,
    estimatedAddress,
    haptics = true,
    locale,
    content,
  },
  ref,
) {
  /** `locale`/`content` win over the flow's own values when passed — injected by the
   *  platform at runtime (e.g. the visitor's active language), same pattern as
   *  `estimatedAddress`, without mutating the saved flow config. */
  const flow = useMemo(
    () =>
      locale === undefined && content === undefined
        ? flowProp
        : { ...flowProp, locale: locale ?? flowProp.locale, content: content ?? flowProp.content },
    [flowProp, locale, content],
  )
  const [state, setState] = useState<FlowState>(() =>
    computeInitialFlowState(flow, { initialStepId: initialStep, initialAnswers }),
  )
  const [direction, setDirection] = useState<"next" | "prev">("next")
  /** Direction label for the *next* step-change event the emission effect below fires —
   *  set synchronously by whichever handler initiates a transition (handleNext/Prev/
   *  NavigateToStep/Restart/Change), read once the resulting state settles on a real
   *  (non-"logic") step. A chain of "logic" steps resolving in between doesn't touch
   *  it, so the whole chain still reports under the direction that started it. */
  const pendingDirectionRef = useRef<StepChangeDirection>("initial")
  /** Last `CurrentStepInfo` actually reported via `onStepChange`/the ref handle — `null`
   *  only before the very first emission. Doubles as the source for `previousStep`. */
  const emittedStepRef = useRef<CurrentStepInfo | null>(null)
  /** Set by `handleChange` when an answer rerouted the flow, cleared by the emission
   *  effect below: forces that one report through even when id/index/total all stay the
   *  same (two branches of equal length), because the *steps ahead* changed and the
   *  answers behind them were dropped — something a consumer tracking flow state has to
   *  hear about. */
  const branchChangeRef = useRef(false)
  const [currentStep, setCurrentStep] = useState<CurrentStepInfo>(() =>
    getCurrentStepInfo(flow, state, "initial", null),
  )
  /** Defined ahead of the other handlers (all declared further down, after the derived
   *  step values they close over) because useImperativeHandle's factory below needs a
   *  stable reference to it right away. */
  const handleRestart = useCallback(() => {
    pendingDirectionRef.current = "initial"
    setState(createFlowState())
  }, [])
  /** Builds and shows the resolved error screen. `onRetry` (when given) makes a
   *  "retry" action available and is what it re-runs. No-op unless the flow declares
   *  `errorScreen` — otherwise callers/consumers fall back to whatever local error
   *  handling they had before (the review footer message for the submit path). */
  const raiseError = useCallback(
    (payload: ShowErrorPayload) => {
      if (flow.errorScreen === undefined) return
      const { onRetry, ...rest } = payload
      setSubmitError(null)
      setErrorScreen({
        resolved: resolveErrorScreen(flow, { ...rest, canRetry: !!onRetry }),
        onRetry,
      })
    },
    [flow],
  )
  useImperativeHandle(
    ref,
    () => ({
      currentStep,
      goToStep: (stepId: string) => {
        if (!isStepReachable(flow, state, stepId)) return false
        pendingDirectionRef.current = "jump"
        setState((s) => goToStep(flow, s, stepId))
        return true
      },
      getAnswers: () => state.answers,
      setAnswers: (answers: Answers) => {
        setState((s) => ({ ...s, answers: filterValidAnswers(flow, answers) }))
      },
      reset: handleRestart,
      showError: raiseError,
    }),
    [currentStep, flow, state, handleRestart, raiseError],
  )
  /** Set while the user is editing an answer they reached by clicking a review row: the
   *  next "Continua" returns to `reviewStepId` instead of moving +1. Recorded together
   *  with the step the jump landed on (`editStepId`) and only honored while that step is
   *  still the current one — the detour is over the moment the user leaves it by any
   *  other route (Back, a branch re-route), and a leftover shortcut there would relabel
   *  and hijack the review step's own submit button. */
  const [returnTo, setReturnTo] = useState<{ reviewStepId: string; editStepId: string } | null>(null)
  /** Bumped each time the user tries to advance while the current step is still
   *  invalid (only reachable when the primary button isn't hard-disabled, e.g. a
   *  "group" step with requiredChildren: {mode: "any"|"none"} — see group.tsx). Reset
   *  on every step change. Forces every field's error to show (steps/shared/
   *  use-field-validation.ts) and moves focus to the first invalid field. */
  const [attempt, setAttempt] = useState(0)
  /** Message from a rejected `onSubmit` (e.g. a failed deferred payment charge):
   *  shown in the footer, keeps the user on the review step. Cleared on any step
   *  change and on the next submit attempt. */
  const [submitError, setSubmitError] = useState<string | null>(null)
  /** Non-null while the generic error screen (`flow.errorScreen`) is showing — holds
   *  the fully resolved screen plus the retry callback (if the failed operation was
   *  retryable). Rendered instead of the current step; cleared by any recovery action. */
  const [errorScreen, setErrorScreen] = useState<{
    resolved: ResolvedErrorScreen
    onRetry?: () => void | Promise<void>
  } | null>(null)
  const scopeRef = useRef<HTMLDivElement>(null)
  const step = getCurrentStep(flow, state)
  const StepView = getStepComponent(step.type)
  if (!StepView) {
    throw new Error(
      `Nessun componente registrato per lo step di tipo "${step.type}". Usa registerStepComponent() prima di montare FlowRunner.`,
    )
  }
  const valid = canGoNext(flow, state)
  const last = isLastStep(flow, state)
  /** The pending review round trip, but only while the user is still standing on the
   *  step the review row sent them to — see `returnTo`. */
  const activeReturnTo = returnTo?.editStepId === step.id ? returnTo : null
  /** Back is offered when there is somewhere to go back *to* (the real traversal
   *  history), not merely when the index is > 0: a branch jump or a resumed session can
   *  land on a high index with a short history, and vice versa. */
  const backDisabled = !canGoBack(flow, state)
  const progressInfo = useMemo(() => getProgressInfo(flow, state), [flow, state])
  const pct = progressInfo.pct !== null ? Math.round(progressInfo.pct * 100) : null
  const stepRole = getStepTypeDefinition(step.type)?.role
  const isIntro = stepRole === "intro"
  const isConfirmation = stepRole === "confirmation"
  const isLogic = stepRole === "logic"
  const showHeader = !isIntro && !isConfirmation && !isLogic
  const isReviewType = stepRole === "review"
  const isFinalReviewSubmit = isReviewType && (step as StepWithReviewFields).mode !== "checkpoint"

  /** Confirmation footer: `showRestartButton`/`showHomeButton` each default to true;
   *  when both are off the footer bar is dropped entirely (no empty border/padding). */
  const confShowRestart = (step as StepWithConfirmationFields).showRestartButton !== false
  const confShowHome = (step as StepWithConfirmationFields).showHomeButton !== false

  const layout = useFlowRunnerLayout(step, theme, mode, direction)
  /** Title/subtitle of the resolved path's steps, for progress variants (e.g. the
   *  numbered stepper) that render per-step labels — undefined while the path isn't
   *  fully determined yet, same as `total: null`. */
  const progressSteps = useMemo(() => {
    if (progressInfo.total === null) return undefined
    const stepsById = new Map(flow.steps.map((s) => [s.id, s]))
    return resolveFlowPath(flow, state).stepIds.map((id) => {
      const s = stepsById.get(id) as { title?: ContentText; subtitle?: ContentText } | undefined
      return {
        title: s?.title !== undefined ? resolveContentText(flow, s.title) : undefined,
        subtitle: s?.subtitle !== undefined ? resolveContentText(flow, s.subtitle) : undefined,
      }
    })
  }, [flow, state, progressInfo.total])
  const progressProps = {
    pct,
    currentIndex: progressInfo.currentIndex,
    total: progressInfo.total,
    steps: progressSteps,
  }
  const visitedStepIds = useMemo(() => new Set([...state.history, step.id]), [state.history, step.id])

  /** Running order total in the footer: shown on every step once the cart is non-empty,
   *  so the amount stays in view from item selection through payment. The final review
   *  step is the exception — it renders its own itemized recap with the (tax-inclusive)
   *  total, so a second figure in the footer would just be confusing. */
  /** Same `buildOrderSummary` call backs both the plain `orderTotal` line (every
   *  step's footer) and the fuller `cart` recap (the footer's cart button/panel,
   *  see flow-footer.tsx) — computed once here instead of twice. */
  const orderSummary = useMemo(() => {
    if (isReviewType) return null
    const summary = buildOrderSummary(flow, state.answers)
    return summary && summary.total > 0 ? summary : null
  }, [flow, state.answers, isReviewType])

  /** Same discreet "+ IVA" / "IVA inclusa" hint the `catalog`/`product` steps show
   *  next to each price (see `steps/shared/tax-note.ts`), reused here for the
   *  footer's running total and cart panel so the same flow reads consistently
   *  wherever a price appears. */
  const taxNote = useMemo(() => {
    const paymentStep = flow.steps.find((s) => s.type === "payment-stripe") as PaymentStripeStep | undefined
    return taxBehaviorNote(flow, paymentStep)
  }, [flow])

  const orderTotal = useMemo(() => {
    if (!orderSummary) return null
    return {
      label: resolveText(flow, "catalogTotal"),
      amount: formatMoney(orderSummary.total, orderSummary.currency, flow.locale),
      taxNote,
    }
  }, [flow, orderSummary, taxNote])

  /** Amount the review step's submit button will charge, formatted for the "Paga
   *  {amount}" label below — `null` when the flow has no payment step, or the
   *  resolved amount is 0 (e.g. `amountSource: "cart"` with an empty cart), in which
   *  case the label falls back to the plain (amount-less) `submitWithPayment` text. */
  const paymentDueAmount = useMemo(() => {
    const paymentStep = flow.steps.find((s) => s.type === "payment-stripe") as PaymentStripeStep | undefined
    if (!paymentStep) return null
    const amount = resolvePaymentAmount(paymentStep, flow, state.answers)
    return amount > 0 ? formatMoney(amount, paymentStep.currency, flow.locale) : null
  }, [flow, state.answers])

  /** Same +/-/remove logic as `catalog.tsx`/`product.tsx`'s own `setQuantity`, but
   *  targeting an arbitrary `stepId` (not the step currently on screen) — the cart
   *  panel can list rows from several `catalog`/`product` steps at once. Mirrors
   *  `handleChange` above (functional `setState` update, branch invalidation,
   *  `onChange` callback) instead of reusing it, since it writes to a different step
   *  than the one in scope. Quantity 0 removes the line, same as the in-step control. */
  const handleCartLineQuantityChange = useCallback(
    (stepId: string, itemValue: string, quantity: number) => {
      const cartStep = flow.steps.find((s) => s.id === stepId)
      if (!cartStep || (cartStep.type !== "catalog" && cartStep.type !== "product")) return
      // Structural cast: both `catalog` and `product` steps share this exact
      // `items`/`maxPerItem` pricing shape (see `PricedItemsStep` in catalog-step.ts).
      const priced = cartStep as unknown as { items: CatalogItem[]; maxPerItem: number }
      const current = asCatalogValue(state.answers[answerKey(cartStep)])
      const item = priced.items.find((entry) => entry.value === itemValue)
      if (!item) return
      const cap = item.maxQuantity ?? priced.maxPerItem
      const cappedQuantity = quantity > 0 ? Math.min(quantity, cap) : 0
      const others = (current?.items ?? []).filter((line) => line.value !== itemValue)
      const items = cappedQuantity > 0 ? [...others, { value: itemValue, quantity: cappedQuantity }] : others
      // Keep line order stable (config order), same as the in-step control.
      const ordered = priced.items
        .map((entry) => items.find((line) => line.value === entry.value))
        .filter((line): line is { value: string; quantity: number } => line !== undefined)
      const next: CatalogValue = { items: ordered, total: 0 }
      next.total = catalogTotal(priced, next)
      const value = ordered.length > 0 ? next : null
      const result = setAnswerAndInvalidateDownstream(flow, state, cartStep, value)
      if (result.invalidated) {
        pendingDirectionRef.current = "branch-change"
        branchChangeRef.current = true
        setReturnTo(null)
      }
      setState((s) => setAnswerAndInvalidateDownstream(flow, s, cartStep, value).state)
      onChange?.(result.state.answers)
    },
    [flow, state, onChange],
  )

  const cart = useMemo(() => {
    if (!orderSummary) return null
    const count = orderSummary.lines
      .filter((line) => line.kind === "item")
      .reduce((sum, line) => sum + line.quantity, 0)
    // Per-line quantity cap, so the panel can disable "+" at the same ceiling the
    // source step itself enforces — keyed by `stepId::value` since the same item
    // `value` could theoretically repeat across two different catalog/product steps.
    const lineCaps = new Map<string, number>()
    for (const s of flow.steps) {
      if (s.type !== "catalog" && s.type !== "product") continue
      const priced = s as unknown as { items: CatalogItem[]; maxPerItem: number }
      for (const item of priced.items) {
        lineCaps.set(`${s.id}::${item.value}`, item.maxQuantity ?? priced.maxPerItem)
      }
    }
    return {
      summary: orderSummary,
      count,
      locale: flow.locale,
      totalLabel: resolveText(flow, "catalogTotal"),
      openLabel: resolveText(flow, "cartOpen"),
      closeLabel: resolveText(flow, "catalogClose"),
      decreaseLabel: resolveText(flow, "catalogDecrease"),
      increaseLabel: resolveText(flow, "catalogIncrease"),
      removeLabel: resolveText(flow, "catalogRemove"),
      lineCaps,
      onLineQuantityChange: handleCartLineQuantityChange,
      taxNote,
    }
  }, [flow, orderSummary, handleCartLineQuantityChange, taxNote])

  useEffect(() => {
    setAttempt(0)
    setSubmitError(null)
  }, [step.id])

  /** After a failed advance attempt, move focus to the first field the attempt itself
   *  surfaced as invalid (see use-field-validation.ts's aria-invalid wiring) — runs
   *  after paint so the aria-invalid attributes from this render are already in the DOM. */
  useEffect(() => {
    if (attempt === 0) return
    const target = scopeRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    target?.focus()
  }, [attempt])

  /** Forward-only flows must also survive the browser's own back button: push a
   *  sentinel history entry and re-push it on every popstate, so the back button
   *  never actually navigates away from the current step. */
  useEffect(() => {
    if (!flow.disableBack) return
    window.history.pushState(null, "", window.location.href)
    function handlePopState() {
      window.history.pushState(null, "", window.location.href)
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [flow.disableBack])

  /** A "branch" (role: "logic") step is never shown: resolve its target and jump
   *  synchronously, before the browser paints, so it never actually renders on screen
   *  (its component itself also just renders null, belt-and-suspenders). Runs on mount
   *  and on every index change; the `stepRole !== "logic"` guard makes it a no-op once
   *  the jump has landed on a real step, so it can't loop. */
  useLayoutEffect(() => {
    if (stepRole !== "logic") return
    const target = resolveBranch(flow, state)
    setState((s) => applyBranch(flow, s, target))
  }, [flow, state, stepRole])

  /** Reports the settled current step: skipped while still on a "logic" step (the
   *  branch-resolution effect above hasn't landed yet — runs first, same commit) so a
   *  branch is never itself reported, only the visible step it resolves to. Fires once
   *  per actually-changed id/index/total, so re-renders that don't move anything (or an
   *  intermediate commit mid a chained-branch resolution) are silent. `currentStep`
   *  (state, for the ref handle) and the `onStepChange` call are set together here, so
   *  the two can never observe different values. */
  useLayoutEffect(() => {
    if (stepRole === "logic") return
    const forced = branchChangeRef.current
    branchChangeRef.current = false
    const prevInfo = emittedStepRef.current
    const info = getCurrentStepInfo(flow, state, pendingDirectionRef.current, prevInfo)
    if (
      !forced &&
      prevInfo &&
      prevInfo.id === info.id &&
      prevInfo.index === info.index &&
      prevInfo.total === info.total
    ) {
      return
    }
    emittedStepRef.current = info
    setCurrentStep(info)
    onStepChange?.(info)
    // onStepChange deliberately omitted: it's an integrator-supplied callback, often a
    // fresh function identity every render; depending on it would re-fire this effect
    // (and re-diff/emit) on every unrelated parent render instead of only on real step
    // changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow, state, stepRole])

  const handleChange = useCallback(
    (value: Parameters<typeof setAnswerAndInvalidateDownstream>[3]) => {
      const result = setAnswerAndInvalidateDownstream(flow, state, step, value)
      if (result.invalidated) {
        // A branch-driving answer just rerouted the flow: the next settled-step report
        // should say why the total/answers shifted even though the visible step itself
        // didn't change.
        pendingDirectionRef.current = "branch-change"
        branchChangeRef.current = true
        // The steps ahead are no longer the ones the user already walked, so a pending
        // "back to the review" shortcut has to go: continuing must walk the *new* path
        // (whose steps have never been answered), not teleport past it to the review.
        setReturnTo(null)
      }
      // Functional update: a step (e.g. the "smartFill" add-on) may also call
      // onMetaChange in the same event, which queues its own functional update. Using a
      // plain (non-functional) setState here would replace the whole state with one
      // computed from a stale closure, silently discarding that sibling update. Pure —
      // `result` above is only the same computation on this render's state, used for the
      // side effects (which must not live inside an updater).
      setState((s) => setAnswerAndInvalidateDownstream(flow, s, step, value).state)
      // Post-invalidation answers, not just "previous + this one": an edit that reroutes
      // a branch also drops the answers of the steps it just made unreachable, and a
      // consumer persisting this payload (e.g. into the URL, to resume later) must not
      // keep resurrecting them.
      onChange?.(result.state.answers)
    },
    [flow, step, state, onChange],
  )

  const handleMetaChange = useCallback(
    (patch: Record<string, unknown>) => {
      setState((s) => setStepMeta(s, step.id, patch))
    },
    [step.id],
  )

  const handleNext = useCallback(async () => {
    if (!canGoNext(flow, state)) {
      haptic("blocked", haptics)
      setAttempt((a) => a + 1)
      return
    }
    haptic(isFinalReviewSubmit ? "submit" : "advance", haptics)
    if (isFinalReviewSubmit) {
      setSubmitError(null)
      try {
        await onSubmit?.(state.answers)
      } catch (err) {
        // A rejected onSubmit (typically a failed deferred payment charge) must
        // not advance the flow: keep the user on the review step and show why.
        haptic("blocked", haptics)
        const message = err instanceof Error && err.message ? err.message : resolveText(flow, "paymentFailed")
        if (flow.errorScreen !== undefined) {
          // Opt-in: a full recovery screen (retry / change payment method / …)
          // instead of the one-line footer message.
          raiseError({ message, onRetry: () => onSubmit?.(state.answers) })
        } else {
          setSubmitError(message)
        }
        return
      }
    }
    setDirection("next")
    if (activeReturnTo) {
      setReturnTo(null)
      pendingDirectionRef.current = "jump"
      setState((s) => returnToStep(flow, s, activeReturnTo.reviewStepId))
      return
    }
    pendingDirectionRef.current = "next"
    setState((s) => nextState(flow, s))
  }, [flow, state, isFinalReviewSubmit, onSubmit, activeReturnTo, haptics, raiseError])

  const handlePrev = useCallback(() => {
    if (flow.disableBack) return
    haptic("back", haptics)
    setDirection("prev")
    pendingDirectionRef.current = "prev"
    setState((s) => prevState(flow, s))
  }, [flow, haptics])

  const handleNavigateToStep = useCallback(
    (stepId: string) => {
      haptic("jump", haptics)
      setReturnTo({ reviewStepId: step.id, editStepId: stepId })
      setDirection("next")
      pendingDirectionRef.current = "jump"
      setState((s) => goToStep(flow, s, stepId))
    },
    [flow, step.id, haptics],
  )

  /** Carries out a recovery action picked on the generic error screen. `retry` re-runs
   *  the stored `onRetry` (re-showing the screen if it fails again, advancing the flow
   *  if it succeeds); the rest reuse the existing navigation handlers. Every branch
   *  first clears the error screen. */
  const handleErrorAction = useCallback(
    (item: ResolvedErrorAction) => {
      const action = item.action
      const retry = errorScreen?.onRetry
      setErrorScreen(null)
      switch (action.kind) {
        case "retry":
          if (retry) {
            void (async () => {
              try {
                await retry()
                setDirection("next")
                pendingDirectionRef.current = "next"
                setState((s) => nextState(flow, s))
              } catch (err) {
                haptic("blocked", haptics)
                const message =
                  err instanceof Error && err.message ? err.message : resolveText(flow, "paymentFailed")
                raiseError({ message, onRetry: retry })
              }
            })()
          } else {
            void handleNext()
          }
          break
        case "goToStep":
          handleNavigateToStep(action.stepId)
          break
        case "back":
          handlePrev()
          break
        case "restart":
          handleRestart()
          break
        case "home":
          window.location.href = action.url
          break
        case "dismiss":
          break
      }
    },
    [errorScreen, flow, haptics, raiseError, handleNext, handleNavigateToStep, handlePrev, handleRestart],
  )

  /** Enter in a single-line text-like input (text/email/number/date/…) attempts to
   *  advance, same as clicking the primary button — the button itself already handles
   *  Enter/click when enabled, so this only matters while the step is invalid: it's the
   *  one real way a user can trigger `attempt` (surfacing errors + focusing the first
   *  invalid field) without the button ever needing to not be `disabled`. Deliberately
   *  scoped to `<input>` (not textarea/checkbox/radio/file/buttons), which either have
   *  their own Enter semantics or none worth intercepting. */
  const handleScopeKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "Enter") return
      const target = e.target as HTMLElement
      if (target.tagName !== "INPUT") return
      const inputType = (target as HTMLInputElement).type
      if (inputType === "checkbox" || inputType === "radio" || inputType === "file" || inputType === "range") return
      e.preventDefault()
      void handleNext()
    },
    [handleNext],
  )

  /** Confirmation "start over" button — a plain `handleRestart()` (which also backs
   *  `ref.reset()`) plus the haptic tick that a user-pressed button gets. */
  const handleConfirmationRestart = useCallback(() => {
    haptic("restart", haptics)
    handleRestart()
  }, [handleRestart, haptics])

  const handleGoHome = useCallback(() => {
    haptic("restart", haptics)
    const homeUrl = (step as StepWithConfirmationFields).homeUrl
    if (homeUrl) {
      window.location.href = homeUrl
      return
    }
    handleRestart()
  }, [step, handleRestart, haptics])

  const primaryLabel =
    activeReturnTo
      ? resolveText(flow, "returnToReview")
      : isFinalReviewSubmit
        ? ((step as StepWithReviewFields).submitLabel ??
          (paymentDueAmount !== null
            ? formatMessage(resolveText(flow, "submitWithPaymentAmount"), { amount: paymentDueAmount })
            : resolveText(flow, flowHasPayment(flow) ? "submitWithPayment" : "submit")))
        : isIntro
          ? ((step as StepWithIntroFields).cta ?? resolveText(flow, "continue"))
          : resolveText(flow, "continue")

  const isMapStep = step.type === "location" || step.type === "location-leaflet"

  return (
    <ThemeProvider theme={theme} mode={mode}>
      <div className="fk-root" style={layout.rootStyle}>
        {errorScreen && (
          <ErrorScreenView resolved={errorScreen.resolved} onAction={handleErrorAction} />
        )}
        {showHeader && (
          <div className="fk-header" style={{ order: layout.headerOrder }}>
            <div className="fk-header-inner">
              {!flow.disableBack && (
                <button
                  type="button"
                  className="fk-back"
                  onClick={handlePrev}
                  disabled={backDisabled}
                  aria-label={resolveText(flow, "backAriaLabel")}
                >
                  ←
                </button>
              )}
              {layout.ProgressComponent && layout.progressPosition === "header" && (
                <layout.ProgressComponent {...progressProps} />
              )}
              {progressInfo.total !== null && (
                <span className="fk-stepno">
                  {progressInfo.currentIndex + 1}/{progressInfo.total}
                </span>
              )}
            </div>
          </div>
        )}
        <div className="fk-body" style={{ order: 2 }}>
          <div
            className={`fk-scroll${showHeader ? "" : " fk-scroll-noheader"}${isMapStep ? " fk-scroll-location" : ""}`}
          >
            <div className="fk-scroll-inner" style={layout.scrollInnerStyle}>
              <div
                key={step.id}
                ref={scopeRef}
                className={`fk-step-theme-scope${layout.animationClass}`}
                style={layout.scopeStyle}
                onKeyDown={handleScopeKeyDown}
              >
                <StepView
                  step={step}
                  value={state.answers[answerKey(step)] ?? null}
                  onChange={handleChange}
                  flow={flow}
                  answers={state.answers}
                  estimatedAddress={estimatedAddress}
                  onNavigateToStep={isReviewType && !flow.disableBack ? handleNavigateToStep : undefined}
                  meta={getStepMeta(state, step.id)}
                  onMetaChange={handleMetaChange}
                  visitedStepIds={visitedStepIds}
                  validationAttempt={attempt}
                  onError={raiseError}
                />
              </div>
            </div>
          </div>
        </div>
        {!last && !isLogic && (
          <StepFooter
            order={layout.footerOrder}
            showBack={showHeader && !flow.disableBack}
            backDisabled={backDisabled}
            onBack={handlePrev}
            backLabel={resolveText(flow, "back")}
            primaryLabel={primaryLabel}
            primaryDisabled={!valid}
            isSubmit={isFinalReviewSubmit}
            onPrimary={handleNext}
            error={submitError}
            orderTotal={orderTotal}
            cart={cart}
            progress={{
              Component: layout.ProgressComponent,
              show: layout.progressPosition === "footer",
              ...progressProps,
            }}
          />
        )}
        {last && isConfirmation && (confShowRestart || confShowHome) && (
          <ConfirmationFooter
            order={layout.footerOrder}
            secondaryLabel={(step as StepWithConfirmationFields).secondaryCta ?? resolveText(flow, "confirmationRestart")}
            showSecondary={confShowRestart}
            onSecondary={handleConfirmationRestart}
            primaryLabel={(step as StepWithConfirmationFields).primaryCta ?? resolveText(flow, "confirmationHome")}
            showPrimary={confShowHome}
            onPrimary={handleGoHome}
          />
        )}
      </div>
    </ThemeProvider>
  )
})
