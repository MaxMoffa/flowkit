import { describe, expect, it, vi } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { parseFlow, type CurrentStepInfo } from "@flowkit-io/core"
import { FlowRunner, type FlowRunnerHandle } from "./flow-runner"
import "./steps/builtins"

function makeLinearFlow() {
  return parseFlow({
    id: "step-change-linear",
    title: "Test",
    steps: [
      { id: "welcome", type: "intro", cta: "Inizia" },
      { id: "a", type: "text", required: false, placeholder: "Campo A" },
      { id: "b", type: "text", required: false, placeholder: "Campo B" },
      { id: "summary", type: "review", title: "Riepilogo" },
      { id: "end", type: "confirmation" },
    ],
  })
}

function makeBranchFlow() {
  return parseFlow({
    id: "step-change-branch",
    title: "Test",
    steps: [
      { id: "welcome", type: "intro", cta: "Inizia" },
      { id: "age", type: "text", required: false, placeholder: "Età" },
      {
        id: "router",
        type: "branch",
        rules: [{ when: { key: "age", op: "eq", value: "21" }, goTo: "adult-step" }],
        fallback: "minor-step",
      },
      { id: "adult-step", type: "text", title: "Contenuto adulti", required: false },
      { id: "minor-step", type: "text", title: "Contenuto minori", required: false },
      { id: "end", type: "confirmation" },
    ],
  })
}

/** Like `makeBranchFlow`, but the two sides converge (the "skip" branch jumps the
 *  adult side straight to the end): both routes are exactly one step long, so a reroute
 *  leaves id/index/total untouched. */
function makeConvergingBranchFlow() {
  return parseFlow({
    id: "step-change-converging",
    title: "Test",
    steps: [
      { id: "welcome", type: "intro", cta: "Inizia" },
      { id: "age", type: "text", key: "age", required: false, placeholder: "Età" },
      {
        id: "router",
        type: "branch",
        rules: [{ when: { key: "age", op: "eq", value: "21" }, goTo: "adult-step" }],
        fallback: "minor-step",
      },
      { id: "adult-step", type: "text", key: "adult", title: "Contenuto adulti", required: false },
      { id: "skip", type: "branch", rules: [], fallback: "end" },
      { id: "minor-step", type: "text", key: "minor", title: "Contenuto minori", required: false },
      { id: "end", type: "confirmation" },
    ],
  })
}

describe("FlowRunner: onStepChange / currentStep — mount and linear navigation", () => {
  it("emits the initial step on mount, already aligned with the ref's currentStep", () => {
    const onStepChange = vi.fn()
    const ref = { current: null as FlowRunnerHandle | null }
    render(<FlowRunner ref={ref} flow={makeLinearFlow()} onStepChange={onStepChange} />)

    expect(onStepChange).toHaveBeenCalledTimes(1)
    const initial = onStepChange.mock.calls[0]![0] as CurrentStepInfo
    expect(initial).toMatchObject({ id: "welcome", type: "intro", direction: "initial", previousStep: null })
    expect(ref.current!.currentStep).toEqual(initial)
  })

  it("reports 'next' on Continua and 'prev' on Indietro, previousStep chained correctly", () => {
    const onStepChange = vi.fn()
    render(<FlowRunner flow={makeLinearFlow()} onStepChange={onStepChange} />)

    fireEvent.click(screen.getByText("Inizia")) // welcome -> a
    let last = onStepChange.mock.calls.at(-1)![0] as CurrentStepInfo
    expect(last).toMatchObject({ id: "a", direction: "next" })
    expect(last.previousStep!.id).toBe("welcome")

    fireEvent.click(screen.getByText("Continua")) // a -> b
    last = onStepChange.mock.calls.at(-1)![0] as CurrentStepInfo
    expect(last).toMatchObject({ id: "b", direction: "next" })
    expect(last.previousStep!.id).toBe("a")

    fireEvent.click(screen.getByLabelText("Indietro")) // b -> a
    last = onStepChange.mock.calls.at(-1)![0] as CurrentStepInfo
    expect(last).toMatchObject({ id: "a", direction: "prev" })
    expect(last.previousStep!.id).toBe("b")
  })

  it("reports 'jump' for a review-row shortcut and for the return-to-review continue", () => {
    const onStepChange = vi.fn()
    render(<FlowRunner flow={makeLinearFlow()} onStepChange={onStepChange} />)

    fireEvent.click(screen.getByText("Inizia")) // welcome -> a
    fireEvent.change(screen.getByPlaceholderText("Campo A"), { target: { value: "hi" } })
    fireEvent.click(screen.getByText("Continua")) // a -> b
    fireEvent.click(screen.getByText("Continua")) // b -> summary

    const row = document.querySelector(".fk-review-row")
    expect(row).not.toBeNull()
    fireEvent.click(row!)

    let last = onStepChange.mock.calls.at(-1)![0] as CurrentStepInfo
    expect(last).toMatchObject({ id: "a", direction: "jump" })
    expect(last.previousStep!.id).toBe("summary")

    fireEvent.click(screen.getByText("Torna al riepilogo"))
    last = onStepChange.mock.calls.at(-1)![0] as CurrentStepInfo
    expect(last).toMatchObject({ id: "summary", direction: "jump" })
    expect(last.previousStep!.id).toBe("a")
  })
})

describe("FlowRunner: onStepChange — logic steps stay transparent", () => {
  it("never reports the branch step itself; previousStep skips straight to the step before it", () => {
    const onStepChange = vi.fn()
    render(<FlowRunner flow={makeBranchFlow()} onStepChange={onStepChange} />)

    fireEvent.click(screen.getByText("Inizia")) // welcome -> age
    fireEvent.change(screen.getByPlaceholderText("Età"), { target: { value: "21" } })
    fireEvent.click(screen.getByText("Continua")) // age -> router -> adult-step (auto-resolved)

    expect(screen.getByText("Contenuto adulti")).not.toBeNull()

    const ids = onStepChange.mock.calls.map((call) => (call[0] as CurrentStepInfo).id)
    expect(ids).not.toContain("router")

    const last = onStepChange.mock.calls.at(-1)![0] as CurrentStepInfo
    expect(last).toMatchObject({ id: "adult-step", direction: "next" })
    expect(last.previousStep!.id).toBe("age")
  })
})

describe("FlowRunner: onStepChange — branch-change invalidation", () => {
  it("fires a 'branch-change' event (same step, recomputed total) when a Back-then-edited answer reroutes the branch", () => {
    const onStepChange = vi.fn()
    render(<FlowRunner flow={makeBranchFlow()} onStepChange={onStepChange} />)

    fireEvent.click(screen.getByText("Inizia")) // welcome -> age
    fireEvent.change(screen.getByPlaceholderText("Età"), { target: { value: "21" } })
    fireEvent.click(screen.getByText("Continua")) // age -> router -> adult-step
    expect(screen.getByText("Contenuto adulti")).not.toBeNull()
    const onAdult = onStepChange.mock.calls.at(-1)![0] as CurrentStepInfo

    fireEvent.click(screen.getByLabelText("Indietro")) // adult-step -> age
    const backOnAge = onStepChange.mock.calls.at(-1)![0] as CurrentStepInfo
    expect(backOnAge).toMatchObject({ id: "age", direction: "prev" })

    onStepChange.mockClear()
    fireEvent.change(screen.getByPlaceholderText("Età"), { target: { value: "5" } }) // now routes to minor-step

    expect(onStepChange).toHaveBeenCalledTimes(1)
    const branchChange = onStepChange.mock.calls[0]![0] as CurrentStepInfo
    expect(branchChange).toMatchObject({ id: "age", direction: "branch-change" })
    expect(branchChange.total).not.toBe(onAdult.total)
  })

  it("still fires when the two branches are the same length (id/index/total all unchanged)", () => {
    const onStepChange = vi.fn()
    render(<FlowRunner flow={makeConvergingBranchFlow()} onStepChange={onStepChange} />)

    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.change(screen.getByPlaceholderText("Età"), { target: { value: "21" } })
    fireEvent.click(screen.getByText("Continua")) // -> adult-step
    fireEvent.click(screen.getByLabelText("Indietro")) // -> age
    const before = onStepChange.mock.calls.at(-1)![0] as CurrentStepInfo

    onStepChange.mockClear()
    fireEvent.change(screen.getByPlaceholderText("Età"), { target: { value: "5" } })

    // Both routes are one step long: nothing about the *current* step changed, but the
    // route ahead did — a consumer tracking flow state has to hear about it.
    expect(onStepChange).toHaveBeenCalledTimes(1)
    const branchChange = onStepChange.mock.calls[0]![0] as CurrentStepInfo
    expect(branchChange).toMatchObject({ id: "age", direction: "branch-change", total: before.total })

    // ...and only once: further edits that don't reroute anything stay silent.
    onStepChange.mockClear()
    fireEvent.change(screen.getByPlaceholderText("Età"), { target: { value: "6" } })
    expect(onStepChange).not.toHaveBeenCalled()
  })

  it("onChange reports the answers minus the ones the reroute dropped", () => {
    const onChange = vi.fn()
    render(<FlowRunner flow={makeConvergingBranchFlow()} onChange={onChange} />)

    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.change(screen.getByPlaceholderText("Età"), { target: { value: "21" } })
    fireEvent.click(screen.getByText("Continua")) // -> adult-step
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "solo adulti" } })
    expect(onChange.mock.calls.at(-1)![0]).toEqual({ age: "21", adult: "solo adulti" })

    fireEvent.click(screen.getByLabelText("Indietro")) // -> age
    fireEvent.change(screen.getByPlaceholderText("Età"), { target: { value: "5" } })

    // "adult-step" is off the path now: a consumer persisting this payload (to resume
    // later, say) must not carry its answer around anymore.
    expect(onChange.mock.calls.at(-1)![0]).toEqual({ age: "5" })
  })
})
