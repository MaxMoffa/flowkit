import { describe, expect, it } from "vitest"
import { render, fireEvent } from "@testing-library/react"
import "../index"
import type { GroupStep, Step } from "@flowkit-io/core"
import { GroupStepView } from "./group"

const baseFlow = { id: "t", title: "t", locale: "it", steps: [], disableBack: false, timezone: "UTC" }

// GroupStep isn't part of the Step union (would close a type cycle, see DECISIONS.md),
// so GroupStepView's own `step` prop type is Step, cast internally — match that here.
function groupStep(overrides: Partial<GroupStep> = {}): Step {
  return {
    id: "g",
    type: "group",
    required: true,
    layout: "stack",
    steps: [
      { id: "notes-a", type: "notes", required: false },
      { id: "notes-b", type: "notes", required: false },
    ],
    ...overrides,
  } as unknown as Step
}

describe("GroupStepView", () => {
  it("renders every child step and forwards its own per-child value", () => {
    const { container } = render(
      <GroupStepView
        step={groupStep()}
        value={{ "notes-a": "hello", "notes-b": "world" }}
        onChange={() => {}}
        flow={baseFlow}
        answers={{}}
        meta={{}}
        onMetaChange={() => {}}
      />,
    )
    const textareas = container.querySelectorAll("textarea")
    expect(textareas).toHaveLength(2)
    expect((textareas[0] as HTMLTextAreaElement).value).toBe("hello")
    expect((textareas[1] as HTMLTextAreaElement).value).toBe("world")
  })

  it("composes a child's onChange into the aggregated {[childId]: value} object", () => {
    let lastValue: unknown = null
    const { container } = render(
      <GroupStepView
        step={groupStep()}
        value={{ "notes-a": "existing" }}
        onChange={(v) => {
          lastValue = v
        }}
        flow={baseFlow}
        answers={{}}
        meta={{}}
        onMetaChange={() => {}}
      />,
    )
    const textareas = container.querySelectorAll("textarea")
    fireEvent.change(textareas[1] as HTMLTextAreaElement, { target: { value: "new" } })
    expect(lastValue).toEqual({ "notes-a": "existing", "notes-b": "new" })
  })

  it("defaults to a stack layout with a single child regardless of layout:columns", () => {
    const { container } = render(
      <GroupStepView
        step={groupStep({ layout: "columns", steps: [{ id: "only", type: "notes", required: false } as never] })}
        value={null}
        onChange={() => {}}
        flow={baseFlow}
        answers={{}}
        meta={{}}
        onMetaChange={() => {}}
      />,
    )
    expect(container.querySelector(".fk-step-group")?.className).toContain("fk-group-stack")
  })

  it("uses a columns layout when layout:columns and at least 2 children", () => {
    const { container } = render(
      <GroupStepView
        step={groupStep({ layout: "columns" })}
        value={null}
        onChange={() => {}}
        flow={baseFlow}
        answers={{}}
        meta={{}}
        onMetaChange={() => {}}
      />,
    )
    expect(container.querySelector(".fk-step-group")?.className).toContain("fk-group-columns")
  })

  it("scopes a child's onMetaChange patch under meta.children.<childId>, preserving siblings", () => {
    const textChild = {
      id: "cf",
      type: "text",
      required: true,
      variant: "text",
      multiline: false,
      addons: [
        {
          type: "smartFill" as const,
          generator: "codiceFiscale",
          sourceFields: { nome: "nome", cognome: "cognome", dataNascita: "dob", luogoNascita: "place", sesso: "sesso" },
        },
      ],
    }
    const patches: Record<string, unknown>[] = []
    render(
      <GroupStepView
        step={groupStep({ steps: [{ id: "notes-a", type: "notes", required: false } as never, textChild as never] })}
        value={null}
        onChange={() => {}}
        flow={baseFlow}
        answers={{ nome: "Mario", cognome: "Rossi", dob: "1980-01-01", place: "H501", sesso: "M" }}
        meta={{ children: { "notes-a": { untouched: true } } }}
        onMetaChange={(patch) => patches.push(patch)}
      />,
    )
    // The "cf" text step's smartFill add-on auto-suggests on mount, which calls onMetaChange —
    // GroupStepView must scope that under children.cf and preserve the pre-existing
    // children["notes-a"] slice untouched.
    expect(patches).toHaveLength(1)
    expect(patches[0]).toEqual({
      children: {
        "notes-a": { untouched: true },
        cf: { smartFillLastSuggestion: "RSSMRA80A01H501U" },
      },
    })
  })
})
