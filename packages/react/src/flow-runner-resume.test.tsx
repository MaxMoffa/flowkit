import { describe, expect, it } from "vitest"
import { render, fireEvent, screen, act } from "@testing-library/react"
import { parseFlow } from "@flowkit-io/core"
import { FlowRunner, type FlowRunnerHandle } from "./flow-runner"
import "./steps/builtins"

function makeLinearFlow() {
  return parseFlow({
    id: "resume-linear",
    title: "Test",
    steps: [
      { id: "welcome", type: "intro", cta: "Inizia" },
      { id: "a", type: "text", required: false, placeholder: "Campo A" },
      { id: "b", type: "text", required: true, placeholder: "Campo B" },
      { id: "summary", type: "review", title: "Riepilogo" },
      { id: "end", type: "confirmation" },
    ],
  })
}

function makeBranchFlow() {
  return parseFlow({
    id: "resume-branch",
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

describe("FlowRunner: initialStep", () => {
  it("mounts directly on the given step when it's reachable", () => {
    render(<FlowRunner flow={makeLinearFlow()} initialStep="b" />)
    expect(screen.getByPlaceholderText("Campo B")).not.toBeNull()
  })

  it("falls back to the normal initial step for an unknown id, without throwing", () => {
    render(<FlowRunner flow={makeLinearFlow()} initialStep="nope" />)
    expect(screen.getByText("Inizia")).not.toBeNull()
  })

  it("falls back to the normal initial step when the target isn't reachable yet", () => {
    // "adult-step"/"minor-step" both require the branch to be resolved first, which
    // needs "age" answered — with no initialAnswers, neither is reachable at mount.
    render(<FlowRunner flow={makeBranchFlow()} initialStep="adult-step" />)
    expect(screen.getByText("Inizia")).not.toBeNull()
  })

  it("Back works immediately on a resumed step (history is backfilled)", () => {
    render(<FlowRunner flow={makeLinearFlow()} initialStep="b" />)
    expect(screen.getByLabelText("Indietro").hasAttribute("disabled")).toBe(false)
    fireEvent.click(screen.getByLabelText("Indietro"))
    expect(screen.getByPlaceholderText("Campo A")).not.toBeNull()
  })
})

describe("FlowRunner: initialAnswers", () => {
  it("preloads a valid answer", () => {
    render(<FlowRunner flow={makeLinearFlow()} initialStep="b" initialAnswers={{ a: "hello" }} />)
    expect(screen.queryByPlaceholderText("Campo A")).toBeNull() // still on "b"
    expect(screen.getByPlaceholderText("Campo B")).not.toBeNull()
  })

  it("combined with initialStep, unlocks a branch-gated step", () => {
    render(<FlowRunner flow={makeBranchFlow()} initialStep="adult-step" initialAnswers={{ age: "21" }} />)
    expect(screen.getByText("Contenuto adulti")).not.toBeNull()
  })

  it("drops unknown keys and invalid values silently, without throwing", () => {
    expect(() =>
      render(
        <FlowRunner
          flow={makeLinearFlow()}
          initialAnswers={{ mystery: "???", b: "" } as unknown as Record<string, string>}
        />,
      ),
    ).not.toThrow()
    expect(screen.getByText("Inizia")).not.toBeNull()
  })
})

describe("FlowRunner: imperative handle — goToStep/getAnswers/setAnswers/reset", () => {
  it("goToStep jumps to a reachable step and reports direction 'jump'", () => {
    const ref = { current: null as FlowRunnerHandle | null }
    render(<FlowRunner ref={ref} flow={makeLinearFlow()} />)

    let ok!: boolean
    act(() => {
      ok = ref.current!.goToStep("b")
    })
    expect(ok).toBe(true)
    expect(ref.current!.currentStep).toMatchObject({ id: "b", direction: "jump" })
    expect(screen.getByPlaceholderText("Campo B")).not.toBeNull()
  })

  it("goToStep is a no-op returning false for an unknown/unreachable id", () => {
    const ref = { current: null as FlowRunnerHandle | null }
    render(<FlowRunner ref={ref} flow={makeBranchFlow()} />)

    let ok!: boolean
    act(() => {
      ok = ref.current!.goToStep("adult-step") // branch not resolved yet
    })
    expect(ok).toBe(false)
    expect(ref.current!.currentStep.id).toBe("welcome")

    act(() => {
      ok = ref.current!.goToStep("does-not-exist")
    })
    expect(ok).toBe(false)
  })

  it("getAnswers/setAnswers round-trip, filtering unknown keys and invalid values", () => {
    const ref = { current: null as FlowRunnerHandle | null }
    render(<FlowRunner ref={ref} flow={makeLinearFlow()} />)

    expect(ref.current!.getAnswers()).toEqual({})

    act(() => {
      ref.current!.setAnswers({ a: "hi", mystery: "x", b: "" })
    })
    expect(ref.current!.getAnswers()).toEqual({ a: "hi" })
  })

  it("reset returns to the true blank state, ignoring initialStep/initialAnswers", () => {
    const ref = { current: null as FlowRunnerHandle | null }
    render(<FlowRunner ref={ref} flow={makeLinearFlow()} initialStep="b" initialAnswers={{ a: "hi" }} />)
    expect(ref.current!.currentStep.id).toBe("b")

    act(() => {
      ref.current!.reset()
    })
    expect(ref.current!.currentStep).toMatchObject({ id: "welcome", direction: "initial" })
    expect(ref.current!.getAnswers()).toEqual({})
  })
})
