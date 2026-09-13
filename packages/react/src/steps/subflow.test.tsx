import { useState } from "react"
import { describe, expect, it } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import "../index"
import type { AnswerValue, SubflowStep, Step } from "@flowkit-io/core"
import { SubflowStepView } from "./subflow"

const baseFlow = { id: "t", title: "t", locale: "it", steps: [], disableBack: false, timezone: "UTC", schemaVersion: 1 }

function subflowStep(overrides: Partial<SubflowStep> = {}): Step {
  return {
    id: "sf",
    type: "subflow",
    required: true,
    steps: [
      { id: "a", type: "text", title: "Nome", required: true },
      { id: "b", type: "text", title: "Cognome", required: true },
    ],
    ...overrides,
  } as unknown as Step
}

/** Stateful harness — SubflowStepView's internal nav lives in `meta`, round-tripped via
 *  `onMetaChange`/`onChange`, so exercising "click next, see the next child" needs a real
 *  re-render loop, unlike `group`'s stateless composition. */
function Harness({ step }: { step: Step }) {
  const [value, setValue] = useState<AnswerValue>(null)
  const [meta, setMeta] = useState<Record<string, unknown>>({})
  return (
    <SubflowStepView
      step={step}
      value={value}
      onChange={setValue}
      flow={baseFlow}
      answers={{}}
      meta={meta}
      onMetaChange={(patch) => setMeta((m) => ({ ...m, ...patch }))}
    />
  )
}

describe("SubflowStepView", () => {
  it("renders only the first child, with a disabled internal Continua until it's filled", () => {
    render(<Harness step={subflowStep()} />)
    expect(screen.getByText("Nome")).not.toBeNull()
    expect(screen.queryByText("Cognome")).toBeNull()
    expect(screen.getByText("Continua")).toHaveProperty("disabled", true)
  })

  it("advances to the next child once the current one is filled, aggregating the answer", () => {
    const { container } = render(<Harness step={subflowStep()} />)
    fireEvent.input(container.querySelector("input")!, { target: { value: "Mario" } })
    fireEvent.click(screen.getByText("Continua"))
    expect(screen.getByText("Cognome")).not.toBeNull()
    expect(screen.queryByText("Nome")).toBeNull()
  })

  it("Indietro returns to the previous child, keeping its answer", () => {
    const { container } = render(<Harness step={subflowStep()} />)
    fireEvent.input(container.querySelector("input")!, { target: { value: "Mario" } })
    fireEvent.click(screen.getByText("Continua"))
    fireEvent.click(screen.getByText("Indietro"))
    expect(screen.getByText("Nome")).not.toBeNull()
    expect((container.querySelector("input") as HTMLInputElement).value).toBe("Mario")
  })

  it("shows a progress counter (1/2, then 2/2)", () => {
    const { container } = render(<Harness step={subflowStep()} />)
    expect(screen.getByText("1/2")).not.toBeNull()
    fireEvent.input(container.querySelector("input")!, { target: { value: "Mario" } })
    fireEvent.click(screen.getByText("Continua"))
    expect(screen.getByText("2/2")).not.toBeNull()
  })

  it("skips a nested branch child when navigating next", () => {
    const step = subflowStep({
      steps: [
        { id: "a", type: "text", title: "Nome", required: true },
        { id: "route", type: "branch", rules: [], fallback: "b" },
        { id: "b", type: "text", title: "Cognome", required: true },
      ],
    } as unknown as Partial<SubflowStep>)
    const { container } = render(<Harness step={step} />)
    fireEvent.input(container.querySelector("input")!, { target: { value: "Mario" } })
    fireEvent.click(screen.getByText("Continua"))
    expect(screen.getByText("Cognome")).not.toBeNull()
  })

  it("renders nothing left to fill (just a Back) once past the last child", () => {
    const { container } = render(<Harness step={subflowStep()} />)
    fireEvent.input(container.querySelector("input")!, { target: { value: "Mario" } })
    fireEvent.click(screen.getByText("Continua"))
    fireEvent.input(container.querySelector("input")!, { target: { value: "Rossi" } })
    fireEvent.click(screen.getByText("Continua"))
    expect(screen.queryByText("Nome")).toBeNull()
    expect(screen.queryByText("Cognome")).toBeNull()
    expect(screen.getByText("Indietro")).not.toBeNull()
  })
})
