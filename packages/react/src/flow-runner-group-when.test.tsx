import { describe, expect, it } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { parseFlow } from "@flowkit-io/core"
import { FlowRunner } from "./flow-runner"
import "./steps/builtins"

/** intro -> has-company (radio) -> company-group (when: has_company="yes") -> after-group -> end. */
function makeFlow() {
  return parseFlow({
    id: "group-when-ui-test",
    title: "Test",
    steps: [
      { id: "welcome", type: "intro", cta: "Inizia" },
      {
        id: "has-company",
        type: "radio",
        key: "has_company",
        title: "Hai un'azienda?",
        options: [{ value: "yes", label: "Sì" }, { value: "no", label: "No" }],
      },
      {
        id: "company-group",
        type: "group",
        when: { key: "has_company", op: "eq", value: "yes" },
        steps: [{ id: "company-name", type: "text", title: "Nome azienda", placeholder: "Nome azienda" }],
      },
      { id: "after-group", type: "text", title: "Dopo il gruppo", required: false },
      { id: "end", type: "confirmation" },
    ],
  })
}

describe("FlowRunner: skip-if-false group (`when`)", () => {
  it("jumps straight past the group when `when` is false, never rendering it", () => {
    render(<FlowRunner flow={makeFlow()} />)
    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.click(screen.getByText("No"))
    fireEvent.click(screen.getByText("Continua")) // has-company -> company-group (skipped) -> after-group
    expect(screen.queryByText("Nome azienda")).toBeNull()
    expect(screen.getByText("Dopo il gruppo")).not.toBeNull()
  })

  it("shows the group normally when `when` is true", () => {
    render(<FlowRunner flow={makeFlow()} />)
    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.click(screen.getByText("Sì"))
    fireEvent.click(screen.getByText("Continua")) // has-company -> company-group
    expect(screen.getByText("Nome azienda")).not.toBeNull()
  })

  it("Back from past a skipped group returns to the step before it, not the group", () => {
    render(<FlowRunner flow={makeFlow()} />)
    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.click(screen.getByText("No"))
    fireEvent.click(screen.getByText("Continua")) // -> after-group (skipped straight past)
    expect(screen.getByText("Dopo il gruppo")).not.toBeNull()

    fireEvent.click(screen.getByLabelText("Indietro"))
    expect(screen.getByText("Hai un'azienda?")).not.toBeNull()
  })
})
