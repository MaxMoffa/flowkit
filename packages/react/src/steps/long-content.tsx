import { useEffect, useRef } from "react"
import type { LongContentStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { FlowMarkdown } from "../markdown"
import { StepTitle } from "./shared/step-title"

/** How close to the bottom counts as "scrolled to end" — exact equality is brittle
 *  across browsers/zoom levels (sub-pixel scrollHeight rounding). */
const SCROLL_END_EPSILON = 4

/** Long, independently-scrollable content (terms & conditions, privacy notice): full
 *  width, own scroll region, flow chrome (header/footer) stays fixed outside it. When
 *  `requireScrollToEnd` is set, scrolling to the bottom sets the step's meta flag that
 *  gates canGoNext (see long-content-step.ts's validate) — no answer is stored. */
export function LongContentStepView({ step, meta, onMetaChange }: StepComponentProps<LongContentStep>) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function checkScrolledToEnd(el: HTMLDivElement) {
    if (meta.scrolledToEnd === true) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_END_EPSILON) {
      onMetaChange({ scrolledToEnd: true })
    }
  }

  useEffect(
    () => {
      if (!step.requireScrollToEnd) return
      // Content short enough to not need scrolling at all: don't permanently block on
      // a scroll event that can never fire.
      const el = scrollRef.current
      if (el) checkScrolledToEnd(el)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- checkScrolledToEnd reads current meta/onMetaChange by closure, re-running per content/flag change is what we want
    [step.requireScrollToEnd, step.content],
  )

  return (
    <div className="fk-step fk-step-long-content">
      {(step.title || step.subtitle) && (
        <div className="fk-long-content-header">
          <StepTitle image={step.image} title={step.title} />
          {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
        </div>
      )}
      <div ref={scrollRef} className="fk-long-content-scroll" onScroll={(e) => checkScrolledToEnd(e.currentTarget)}>
        <FlowMarkdown text={step.content} variant="block" />
      </div>
    </div>
  )
}
