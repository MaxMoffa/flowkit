import { describe, expect, it, vi } from "vitest"
import { render, fireEvent } from "@testing-library/react"
import type { UploadedItem } from "@flowkit-io/core"
import { MediaViewer } from "./media-viewer"

// jsdom has no PointerEvent constructor, so @testing-library/dom's fireEvent.pointerX
// silently falls back to a bare Event (dropping clientX/clientY/pointerId) without this.
if (!("PointerEvent" in window)) {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params)
      this.pointerId = params.pointerId ?? 0
    }
  }
  // @ts-expect-error -- jsdom test-environment polyfill only
  window.PointerEvent = PointerEventPolyfill
}

function makeItems(count: number): UploadedItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    name: `item-${i}.png`,
    mimeType: "image/png",
    size: 100,
    dataUrl: `data:image/png;base64,item${i}`,
    kind: "image" as const,
  }))
}

function getImage(container: HTMLElement): HTMLImageElement {
  return container.querySelector(".fk-media-viewer-stage img") as HTMLImageElement
}

function scaleOf(img: HTMLImageElement): number {
  const match = /scale\(([\d.]+)\)/.exec(img.style.transform)
  return match ? Number(match[1]) : 1
}

describe("MediaViewer", () => {
  it("shows the '<n> di <total>' position indicator", () => {
    const { getByText } = render(
      <MediaViewer items={makeItems(5)} index={2} onIndexChange={() => {}} onClose={() => {}} onRemove={() => {}} />,
    )
    expect(getByText("3 di 5")).toBeTruthy()
  })

  it("click on the image toggles zoom 1x <-> 2x", () => {
    const { container } = render(
      <MediaViewer items={makeItems(1)} index={0} onIndexChange={() => {}} onClose={() => {}} onRemove={() => {}} />,
    )
    const img = getImage(container)
    expect(scaleOf(img)).toBe(1)
    fireEvent.click(img)
    expect(scaleOf(img)).toBe(2)
    fireEvent.click(img)
    expect(scaleOf(img)).toBe(1)
  })

  it("resets zoom when navigating to a different index", () => {
    const { container, rerender } = render(
      <MediaViewer items={makeItems(2)} index={0} onIndexChange={() => {}} onClose={() => {}} onRemove={() => {}} />,
    )
    fireEvent.click(getImage(container))
    expect(scaleOf(getImage(container))).toBe(2)

    rerender(
      <MediaViewer items={makeItems(2)} index={1} onIndexChange={() => {}} onClose={() => {}} onRemove={() => {}} />,
    )
    expect(scaleOf(getImage(container))).toBe(1)
  })

  it("pinch (two pointers) scales the image proportionally to the finger distance", () => {
    const { container } = render(
      <MediaViewer items={makeItems(1)} index={0} onIndexChange={() => {}} onClose={() => {}} onRemove={() => {}} />,
    )
    const stage = container.querySelector(".fk-media-viewer-stage") as HTMLElement

    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerDown(stage, { pointerId: 2, clientX: 200, clientY: 100 }) // initial distance 100
    fireEvent.pointerMove(stage, { pointerId: 2, clientX: 300, clientY: 100 }) // distance 200: 2x

    expect(scaleOf(getImage(container))).toBeCloseTo(2, 1)
  })

  it("pinch scale is clamped to the max", () => {
    const { container } = render(
      <MediaViewer items={makeItems(1)} index={0} onIndexChange={() => {}} onClose={() => {}} onRemove={() => {}} />,
    )
    const stage = container.querySelector(".fk-media-viewer-stage") as HTMLElement

    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerDown(stage, { pointerId: 2, clientX: 110, clientY: 100 }) // distance 10
    fireEvent.pointerMove(stage, { pointerId: 2, clientX: 1000, clientY: 100 }) // huge distance

    expect(scaleOf(getImage(container))).toBeLessThanOrEqual(3)
  })

  it("a single-finger swipe past the threshold navigates to the next/previous item", () => {
    const onIndexChange = vi.fn()
    const { container } = render(
      <MediaViewer items={makeItems(3)} index={1} onIndexChange={onIndexChange} onClose={() => {}} onRemove={() => {}} />,
    )
    const stage = container.querySelector(".fk-media-viewer-stage") as HTMLElement

    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 300, clientY: 100 })
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 200, clientY: 100 })
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 150, clientY: 100 }) // dx = -150: swipe left -> next

    expect(onIndexChange).toHaveBeenCalledWith(2)
  })

  it("a short drag under the swipe threshold doesn't navigate", () => {
    const onIndexChange = vi.fn()
    const { container } = render(
      <MediaViewer items={makeItems(3)} index={1} onIndexChange={onIndexChange} onClose={() => {}} onRemove={() => {}} />,
    )
    const stage = container.querySelector(".fk-media-viewer-stage") as HTMLElement

    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 300, clientY: 100 })
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 285, clientY: 100 }) // dx = -15: below threshold

    expect(onIndexChange).not.toHaveBeenCalled()
  })

  it("keyboard ArrowLeft/ArrowRight navigate, Escape closes", () => {
    const onIndexChange = vi.fn()
    const onClose = vi.fn()
    render(<MediaViewer items={makeItems(3)} index={1} onIndexChange={onIndexChange} onClose={onClose} onRemove={() => {}} />)

    fireEvent.keyDown(window, { key: "ArrowRight" })
    expect(onIndexChange).toHaveBeenCalledWith(2)
    fireEvent.keyDown(window, { key: "ArrowLeft" })
    expect(onIndexChange).toHaveBeenCalledWith(0)
    fireEvent.keyDown(window, { key: "Escape" })
    expect(onClose).toHaveBeenCalled()
  })

  it("delete requires confirmation before calling onRemove", () => {
    const onRemove = vi.fn()
    const { getByLabelText, getByText, queryByText } = render(
      <MediaViewer items={makeItems(2)} index={0} onIndexChange={() => {}} onClose={() => {}} onRemove={onRemove} />,
    )

    fireEvent.click(getByLabelText("Elimina"))
    expect(onRemove).not.toHaveBeenCalled()
    expect(queryByText(/non è reversibile/)).toBeTruthy()

    fireEvent.click(getByText("Elimina", { selector: "button.fk-media-viewer-confirm-delete" }))
    expect(onRemove).toHaveBeenCalledWith("item-0")
  })

  it("cancelling the confirm dialog keeps the item", () => {
    const onRemove = vi.fn()
    const { getByLabelText, getByText, queryByText } = render(
      <MediaViewer items={makeItems(2)} index={0} onIndexChange={() => {}} onClose={() => {}} onRemove={onRemove} />,
    )

    fireEvent.click(getByLabelText("Elimina"))
    fireEvent.click(getByText("Annulla"))
    expect(onRemove).not.toHaveBeenCalled()
    expect(queryByText(/non è reversibile/)).toBeNull()
  })

  it("hides prev/next arrows and the thumbstrip for a single item", () => {
    const { container, queryByLabelText } = render(
      <MediaViewer items={makeItems(1)} index={0} onIndexChange={() => {}} onClose={() => {}} onRemove={() => {}} />,
    )
    expect(queryByLabelText("Precedente")).toBeNull()
    expect(queryByLabelText("Successiva")).toBeNull()
    expect(container.querySelector(".fk-media-viewer-thumbstrip")).toBeNull()
  })
})
