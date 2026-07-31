import { describe, expect, it, vi } from "vitest"
import { render, fireEvent } from "@testing-library/react"
import type { LongContentStep } from "@flowkit-io/core"
import { LongContentStepView } from "./long-content"

const baseFlow = { id: "t", title: "t", locale: "it", steps: [], disableBack: false, timezone: "UTC" }

function makeProps(step: Partial<LongContentStep>, onMetaChange = vi.fn(), meta: Record<string, unknown> = {}) {
  return {
    step: { id: "terms", type: "long-content", required: true, content: "Lorem ipsum", ...step } as LongContentStep,
    value: null,
    onChange: () => {},
    flow: baseFlow,
    answers: {},
    meta,
    onMetaChange,
  } as const
}

/** jsdom reports 0 for scroll metrics by default; stub them on the rendered element. */
function mockScrollBox(el: HTMLElement, { scrollTop, clientHeight, scrollHeight }: Record<string, number>) {
  Object.defineProperty(el, "scrollTop", { value: scrollTop, configurable: true })
  Object.defineProperty(el, "clientHeight", { value: clientHeight, configurable: true })
  Object.defineProperty(el, "scrollHeight", { value: scrollHeight, configurable: true })
}

describe("LongContentStepView", () => {
  it("renders content markdown full-width in its own scroll region", () => {
    const { container } = render(<LongContentStepView {...makeProps({ content: "**Bold** terms" })} />)
    expect(container.querySelector(".fk-long-content-scroll")).not.toBeNull()
    expect(container.querySelector(".fk-long-content-scroll strong")?.textContent).toBe("Bold")
  })

  it("does not call onMetaChange when requireScrollToEnd is unset", () => {
    const onMetaChange = vi.fn()
    render(<LongContentStepView {...makeProps({ requireScrollToEnd: false }, onMetaChange)} />)
    expect(onMetaChange).not.toHaveBeenCalled()
  })

  it("marks scrolledToEnd on mount when content is short enough to need no scrolling", () => {
    const onMetaChange = vi.fn()
    const { container } = render(
      <LongContentStepView {...makeProps({ requireScrollToEnd: true }, onMetaChange)} />,
    )
    const scrollEl = container.querySelector(".fk-long-content-scroll") as HTMLElement
    mockScrollBox(scrollEl, { scrollTop: 0, clientHeight: 400, scrollHeight: 400 })
    fireEvent.scroll(scrollEl)
    expect(onMetaChange).toHaveBeenCalledWith({ scrolledToEnd: true })
  })

  it("does not mark scrolledToEnd until the user actually scrolls to the bottom", () => {
    const onMetaChange = vi.fn()
    const { container } = render(
      <LongContentStepView {...makeProps({ requireScrollToEnd: true }, onMetaChange)} />,
    )
    const scrollEl = container.querySelector(".fk-long-content-scroll") as HTMLElement
    // jsdom doesn't lay elements out (clientHeight/scrollHeight default to 0), so the
    // mount-time "content short enough to need no scroll" check fires once against
    // that zeroed box — irrelevant to what this test checks, so clear it and start
    // fresh once the box actually has the tall-content dimensions being tested.
    mockScrollBox(scrollEl, { scrollTop: 0, clientHeight: 300, scrollHeight: 1000 })
    onMetaChange.mockClear()

    fireEvent.scroll(scrollEl)
    expect(onMetaChange).not.toHaveBeenCalled()

    mockScrollBox(scrollEl, { scrollTop: 700, clientHeight: 300, scrollHeight: 1000 })
    fireEvent.scroll(scrollEl)
    expect(onMetaChange).toHaveBeenCalledWith({ scrolledToEnd: true })
  })

  it("does not re-fire onMetaChange once already marked scrolledToEnd", () => {
    const onMetaChange = vi.fn()
    const { container } = render(
      <LongContentStepView {...makeProps({ requireScrollToEnd: true }, onMetaChange, { scrolledToEnd: true })} />,
    )
    const scrollEl = container.querySelector(".fk-long-content-scroll") as HTMLElement
    mockScrollBox(scrollEl, { scrollTop: 0, clientHeight: 300, scrollHeight: 1000 })
    fireEvent.scroll(scrollEl)
    expect(onMetaChange).not.toHaveBeenCalled()
  })
})
