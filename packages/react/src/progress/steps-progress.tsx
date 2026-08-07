import type { ProgressComponentProps } from "../progress-registry"

const INDETERMINATE_DOT_COUNT = 3

/** Beyond this many steps on the resolved path the numbered circles stop fitting a
 *  phone-width container (~300px of usable header room once the back button and the
 *  n/m counter took their share), so the middle of the path collapses into a single
 *  "…" marker per contiguous run — first, last and the current step ±1 always stay. */
export const MAX_VISIBLE_STEPS = 7

/** Beyond this many steps the per-step inline titles are dropped from the DOM entirely:
 *  even on a wide container each one would render as a couple of truncated characters.
 *  The current step's title/description keeps its own full-width row below the circles,
 *  so nothing is actually lost. */
export const MAX_INLINE_LABEL_STEPS = 5

type StepState = "completed" | "active" | "upcoming"

export interface ProgressStepLabel {
  title?: string
  subtitle?: string
}

export type StepperItem =
  | { kind: "step"; index: number; state: StepState; title?: string; subtitle?: string }
  /** A collapsed run of `count` consecutive steps, rendered as an "…" marker. */
  | { kind: "gap"; state: StepState; from: number; to: number; count: number }

function stepState(index: number, currentIndex: number): StepState {
  if (index < currentIndex) return "completed"
  if (index === currentIndex) return "active"
  return "upcoming"
}

/**
 * Turns the resolved path into the items actually rendered as circles.
 *
 * Short paths (<= MAX_VISIBLE_STEPS) render one-to-one. Longer ones keep the anchors a
 * user reads position from — first, last, current and its immediate neighbours — and
 * collapse every other contiguous run into one "…". A run of a single step is kept
 * instead of collapsed: swapping one circle for one ellipsis saves no room and only
 * loses information. The result is never more than MAX_VISIBLE_STEPS items wide.
 */
export function buildStepperItems(steps: ProgressStepLabel[], currentIndex: number): StepperItem[] {
  const n = steps.length
  const asStep = (i: number): StepperItem => ({
    kind: "step",
    index: i,
    state: stepState(i, currentIndex),
    title: steps[i]?.title,
    subtitle: steps[i]?.subtitle,
  })

  if (n <= MAX_VISIBLE_STEPS) return steps.map((_, i) => asStep(i))

  const anchors = new Set(
    [0, n - 1, currentIndex - 1, currentIndex, currentIndex + 1].filter((i) => i >= 0 && i < n),
  )

  const items: StepperItem[] = []
  for (let i = 0; i < n; i++) {
    if (anchors.has(i)) {
      items.push(asStep(i))
      continue
    }
    let end = i
    while (end + 1 < n && !anchors.has(end + 1)) end++
    if (end === i) {
      items.push(asStep(i))
    } else {
      items.push({
        kind: "gap",
        state: end < currentIndex ? "completed" : "upcoming",
        from: i,
        to: end,
        count: end - i + 1,
      })
    }
    i = end
  }
  return items
}

/**
 * Numbered top stepper: one circle per step on the resolved path, connected by a line
 * that fills as the user progresses.
 *
 * Titles and descriptions adapt instead of being crammed in:
 * - the current step's title + description always get their own full-width row under the
 *   circles — that is the only place a description is ever shown, since a description of
 *   a step you are not on is noise;
 * - per-step inline titles are rendered only for short paths (<= MAX_INLINE_LABEL_STEPS)
 *   and CSS reveals them only once the stepper's own container is wide enough (a
 *   container query, not a viewport one: an embedder may render the flow in a narrow
 *   frame on a wide screen). When they are visible the current row drops its now
 *   redundant title and keeps just the description.
 *
 * Falls back to the same pulsing-dots indeterminate state as DotsProgress while the path
 * (or its step list) isn't known yet.
 */
export function StepsProgress({ currentIndex, total, steps }: ProgressComponentProps) {
  if (total === null || !steps) {
    return (
      <div className="fk-progress-dots fk-progress-indeterminate" role="progressbar">
        {Array.from({ length: INDETERMINATE_DOT_COUNT }, (_, i) => (
          <span key={i} className="fk-progress-dot fk-progress-dot-pulse" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    )
  }

  const items = buildStepperItems(steps, currentIndex)
  /** Many-step paths: circles only, no inline titles (see MAX_INLINE_LABEL_STEPS). */
  const dense = steps.length > MAX_INLINE_LABEL_STEPS
  const current = steps[currentIndex]

  return (
    <div
      className={`fk-progress-stepper${dense ? " fk-progress-stepper--dense" : ""}`}
      role="progressbar"
      aria-valuenow={currentIndex + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      /* Children of a progressbar are presentational for assistive tech, so the visible
         labels are never announced: name the current step here instead of leaving the
         bare number. No invented copy, so nothing to translate. */
      aria-valuetext={current?.title}
    >
      <ol className="fk-progress-steps">
        {items.map((item, i) => {
          const last = i === items.length - 1
          const line = last ? null : (
            <span
              className={`fk-progress-step-line${item.state === "completed" ? " fk-progress-step-line--filled" : ""}`}
            />
          )
          if (item.kind === "gap") {
            return (
              <li
                key={`gap-${item.from}`}
                className={`fk-progress-step fk-progress-step--gap fk-progress-step--${item.state}`}
              >
                <div className="fk-progress-step-track">
                  <span className="fk-progress-step-ellipsis" aria-hidden="true">
                    …
                  </span>
                  {line}
                </div>
              </li>
            )
          }
          return (
            <li
              key={item.index}
              className={`fk-progress-step fk-progress-step--${item.state}`}
              aria-current={item.state === "active" ? "step" : undefined}
            >
              <div className="fk-progress-step-track">
                <span className="fk-progress-step-circle" aria-hidden="true">
                  {item.state === "completed" ? "✓" : item.index + 1}
                </span>
                {line}
              </div>
              {!dense && item.title && (
                <div className="fk-progress-step-label">
                  <span className="fk-progress-step-title" title={item.title}>
                    {item.title}
                  </span>
                </div>
              )}
            </li>
          )
        })}
      </ol>
      {(current?.title || current?.subtitle) && (
        <div className="fk-progress-current">
          {current.title && (
            <span className="fk-progress-current-title" title={current.title}>
              {current.title}
            </span>
          )}
          {current.subtitle && (
            <span className="fk-progress-current-subtitle" title={current.subtitle}>
              {current.subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
