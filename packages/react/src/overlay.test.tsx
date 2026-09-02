import type { ComponentProps } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, fireEvent, screen, cleanup } from "@testing-library/react"
import { parseFlow } from "@flowkit-io/core"
import { FlowOverlay } from "./overlay"
import type { FlowRunnerHandle } from "./flow-runner"
import "./steps/builtins" // FlowRunner needs registered step components

// jsdom has no matchMedia — stub it. `matches` drives presentation="auto".
function stubMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

beforeEach(() => {
  stubMatchMedia(true) // default: wide viewport → dialog
  document.body.style.overflow = ""
})

afterEach(() => {
  cleanup()
})

function makeFlow() {
  return parseFlow({
    id: "overlay-test",
    title: "Overlay test flow",
    steps: [
      { id: "welcome", type: "intro", cta: "Inizia" },
      { id: "name", type: "text", key: "name", required: false, placeholder: "Nome" },
      { id: "summary", type: "review", title: "Riepilogo", submitLabel: "Invia" },
      { id: "end", type: "confirmation", title: "Fatto", showHomeButton: false },
    ],
  })
}

function renderOverlay(props: Partial<ComponentProps<typeof FlowOverlay>> = {}) {
  const onOpenChange = vi.fn()
  const utils = render(
    <FlowOverlay open flow={makeFlow()} onOpenChange={onOpenChange} {...props} />,
  )
  return { onOpenChange, ...utils }
}

describe("FlowOverlay", () => {
  it("renders nothing when open={false}", () => {
    const { container } = render(
      <FlowOverlay open={false} flow={makeFlow()} onOpenChange={vi.fn()} />,
    )
    expect(container.querySelector(".fk-overlay")).toBeNull()
    expect(document.querySelector(".fk-overlay")).toBeNull()
    expect(document.body.style.overflow).toBe("")
  })

  it("portals into document.body, not the render container", () => {
    const { container } = renderOverlay()
    expect(container.querySelector(".fk-overlay")).toBeNull()
    expect(document.body.querySelector(".fk-overlay")).not.toBeNull()
    expect(screen.getByRole("dialog").getAttribute("aria-label")).toBe("Overlay test flow")
  })

  it("Escape, backdrop click and the ✕ button each call onOpenChange(false)", () => {
    const { onOpenChange } = renderOverlay()

    fireEvent.keyDown(window, { key: "Escape" })
    expect(onOpenChange).toHaveBeenLastCalledWith(false)

    fireEvent.click(document.querySelector(".fk-overlay-backdrop")!)
    expect(onOpenChange).toHaveBeenCalledTimes(2)

    fireEvent.click(screen.getByRole("button", { name: "Chiudi" }))
    expect(onOpenChange).toHaveBeenCalledTimes(3)
  })

  it("dismissible={false} disables Escape and backdrop but keeps a working ✕ button", () => {
    const { onOpenChange } = renderOverlay({ dismissible: false })

    fireEvent.keyDown(window, { key: "Escape" })
    fireEvent.click(document.querySelector(".fk-overlay-backdrop")!)
    expect(onOpenChange).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Chiudi" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("moves focus into the sheet on open and restores it on close", () => {
    const outside = document.createElement("button")
    document.body.appendChild(outside)
    outside.focus()
    expect(document.activeElement).toBe(outside)

    const { rerender } = render(
      <FlowOverlay open flow={makeFlow()} onOpenChange={vi.fn()} />,
    )
    expect(document.activeElement).toBe(screen.getByRole("dialog"))

    rerender(<FlowOverlay open={false} flow={makeFlow()} onOpenChange={vi.fn()} />)
    expect(document.activeElement).toBe(outside)
    outside.remove()
  })

  it("locks body scroll while open and restores the previous value", () => {
    document.body.style.overflow = "scroll"
    const { rerender } = render(
      <FlowOverlay open flow={makeFlow()} onOpenChange={vi.fn()} />,
    )
    expect(document.body.style.overflow).toBe("hidden")

    rerender(<FlowOverlay open={false} flow={makeFlow()} onOpenChange={vi.fn()} />)
    expect(document.body.style.overflow).toBe("scroll")
  })

  it("sets the presentation modifier class from an explicit prop", () => {
    renderOverlay({ presentation: "drawer" })
    expect(document.querySelector(".fk-overlay-sheet--drawer")).not.toBeNull()
    expect(document.querySelector(".fk-overlay-sheet--dialog")).toBeNull()
    cleanup()

    renderOverlay({ presentation: "dialog" })
    expect(document.querySelector(".fk-overlay-sheet--dialog")).not.toBeNull()
    expect(document.querySelector(".fk-overlay-sheet--drawer")).toBeNull()
  })

  it("presentation=\"auto\" resolves against matchMedia", () => {
    stubMatchMedia(true)
    renderOverlay({ presentation: "auto" })
    expect(document.querySelector(".fk-overlay-sheet--dialog")).not.toBeNull()
    cleanup()

    stubMatchMedia(false)
    renderOverlay({ presentation: "auto" })
    expect(document.querySelector(".fk-overlay-sheet--drawer")).not.toBeNull()
  })

  it("only renders the drawer grabber in drawer mode", () => {
    renderOverlay({ presentation: "dialog" })
    expect(document.querySelector(".fk-overlay-grabber")).toBeNull()
    cleanup()
    renderOverlay({ presentation: "drawer" })
    expect(document.querySelector(".fk-overlay-grabber")).not.toBeNull()
  })

  it("presentation=\"fullscreen\" sets the fullscreen modifier, no grabber, no fixed height", () => {
    renderOverlay({ presentation: "fullscreen" })
    expect(document.querySelector(".fk-overlay-sheet--fullscreen")).not.toBeNull()
    expect(document.querySelector(".fk-overlay-grabber")).toBeNull()
    expect(document.querySelector(".fk-overlay-sheet--fixed")).toBeNull()
  })

  it("fixedHeight: on by default, off with false, custom string sets the height var", () => {
    renderOverlay({ presentation: "dialog" })
    expect(document.querySelector(".fk-overlay-sheet--fixed")).not.toBeNull()
    cleanup()

    renderOverlay({ presentation: "dialog", fixedHeight: false })
    expect(document.querySelector(".fk-overlay-sheet--fixed")).toBeNull()
    cleanup()

    renderOverlay({ presentation: "drawer", fixedHeight: "600px" })
    const sheet = document.querySelector<HTMLElement>(".fk-overlay-sheet--fixed")!
    expect(sheet.style.getPropertyValue("--fk-overlay-height")).toBe("600px")
  })

  it("showCloseButton={false} removes the ✕ button", () => {
    const { onOpenChange } = renderOverlay({ showCloseButton: false })
    expect(document.querySelector(".fk-overlay-close")).toBeNull()
    // still closable from outside
    fireEvent.keyDown(window, { key: "Escape" })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("showTitle renders a header with the flow name (or ariaLabel)", () => {
    renderOverlay({ showTitle: true })
    const header = document.querySelector(".fk-overlay-header")
    expect(header).not.toBeNull()
    expect(document.querySelector(".fk-overlay-title")!.textContent).toBe("Overlay test flow")
    expect(header!.querySelector(".fk-overlay-close")).not.toBeNull()
    cleanup()

    renderOverlay({ showTitle: true, ariaLabel: "Feedback", showCloseButton: false })
    expect(document.querySelector(".fk-overlay-title")!.textContent).toBe("Feedback")
    expect(document.querySelector(".fk-overlay-close")).toBeNull()
  })

  it("a large downward drag on the grabber dismisses the drawer", () => {
    const { onOpenChange } = renderOverlay({ presentation: "drawer" })
    const grabber = document.querySelector(".fk-overlay-grabber")!

    fireEvent.pointerDown(grabber, { pointerId: 1, clientY: 0 })
    fireEvent.pointerMove(grabber, { pointerId: 1, clientY: 120 })
    fireEvent.pointerUp(grabber, { pointerId: 1, clientY: 220 })

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("forwards ref to a working FlowRunnerHandle", () => {
    const ref = { current: null as FlowRunnerHandle | null }
    render(<FlowOverlay open flow={makeFlow()} onOpenChange={vi.fn()} ref={ref} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current!.getAnswers()).toEqual({})

    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.change(screen.getByPlaceholderText("Nome"), { target: { value: "Ada" } })
    expect(ref.current!.getAnswers()).toMatchObject({ name: "Ada" })
  })

  it("renders the flow and advances through steps", () => {
    renderOverlay()
    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.change(screen.getByPlaceholderText("Nome"), { target: { value: "Ada" } })
    fireEvent.click(screen.getByText("Continua"))
    expect(screen.getByText("Riepilogo")).not.toBeNull()
  })

  it("closeOnSubmit closes after onSubmit resolves; default keeps the overlay open", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    const closing = renderOverlay({ onSubmit, closeOnSubmit: true })
    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.click(screen.getByText("Continua")) // name (optional) -> review
    fireEvent.click(screen.getByText("Invia"))
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled())
    await vi.waitFor(() => expect(closing.onOpenChange).toHaveBeenCalledWith(false))
    cleanup()

    const staying = renderOverlay({ onSubmit: vi.fn().mockResolvedValue(undefined) })
    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.click(screen.getByText("Continua"))
    fireEvent.click(screen.getByText("Invia"))
    await vi.waitFor(() => expect(screen.getByText("Fatto")).not.toBeNull())
    expect(staying.onOpenChange).not.toHaveBeenCalled()
  })

  it("uses ariaLabel over flow.title when given", () => {
    renderOverlay({ ariaLabel: "Feedback" })
    expect(screen.getByRole("dialog").getAttribute("aria-label")).toBe("Feedback")
  })

  it("honours a custom container", () => {
    const host = document.createElement("div")
    host.id = "overlay-host"
    document.body.appendChild(host)
    renderOverlay({ container: host })
    expect(host.querySelector(".fk-overlay")).not.toBeNull()
    host.remove()
  })
})
