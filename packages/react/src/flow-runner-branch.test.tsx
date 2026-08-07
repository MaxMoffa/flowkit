import { describe, expect, it, vi } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { parseFlow } from "@flowkit-io/core"
import { FlowRunner } from "./flow-runner"
import "./steps/builtins"

function makeFlow() {
  return parseFlow({
    id: "branch-ui-test",
    title: "Test",
    steps: [
      { id: "welcome", type: "intro", cta: "Inizia" },
      { id: "age", type: "text", required: false, placeholder: "Età" },
      {
        id: "router",
        type: "branch",
        // The "text" step's onChange always yields a string, so this compares strings
        // (not "gte" numeric comparison) — condition-op numeric behavior is already
        // covered by branch-step.test.ts; this test is about the FlowRunner wiring.
        rules: [{ when: { key: "age", op: "eq", value: "21" }, goTo: "adult-step" }],
        fallback: "minor-step",
      },
      { id: "adult-step", type: "text", title: "Contenuto adulti", required: false },
      { id: "minor-step", type: "text", title: "Contenuto minori", required: false },
      { id: "end", type: "confirmation" },
    ],
  })
}

describe("FlowRunner branching", () => {
  it("jumps straight to the matching branch target, never rendering the branch step or the untaken side", () => {
    render(<FlowRunner flow={makeFlow()} />)

    fireEvent.click(screen.getByText("Inizia")) // intro -> age
    fireEvent.change(screen.getByPlaceholderText("Età"), { target: { value: "21" } })
    fireEvent.click(screen.getByText("Continua")) // age -> router -> adult-step (auto-resolved)

    expect(screen.getByText("Contenuto adulti")).not.toBeNull()
    expect(screen.queryByText("Contenuto minori")).toBeNull()
  })

  it("takes the fallback path when no rule matches", () => {
    render(<FlowRunner flow={makeFlow()} />)

    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.change(screen.getByPlaceholderText("Età"), { target: { value: "10" } })
    fireEvent.click(screen.getByText("Continua"))

    expect(screen.getByText("Contenuto minori")).not.toBeNull()
    expect(screen.queryByText("Contenuto adulti")).toBeNull()
  })

  it("Back from the landed branch target returns to the step before the branch, not the branch step", () => {
    render(<FlowRunner flow={makeFlow()} />)

    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.change(screen.getByPlaceholderText("Età"), { target: { value: "21" } })
    fireEvent.click(screen.getByText("Continua"))
    expect(screen.getByText("Contenuto adulti")).not.toBeNull()

    fireEvent.click(screen.getByLabelText("Indietro"))
    expect(screen.getByPlaceholderText("Età")).not.toBeNull()
  })
})

/** intro -> pet -> (branch: "no" skips straight to the review) -> pet-name -> review. */
function makeReviewBranchFlow() {
  return parseFlow({
    id: "branch-review-test",
    title: "Test",
    steps: [
      { id: "welcome", type: "intro", cta: "Inizia" },
      {
        id: "pet",
        type: "radio",
        key: "pet",
        title: "Hai un animale?",
        options: [{ value: "yes", label: "Sì" }, { value: "no", label: "No" }],
      },
      {
        id: "router",
        type: "branch",
        rules: [{ when: { key: "pet", op: "eq", value: "no" }, goTo: "summary" }],
      },
      { id: "pet-name", type: "text", title: "Nome", required: false, placeholder: "Nome" },
      { id: "summary", type: "review", title: "Riepilogo" },
      { id: "end", type: "confirmation" },
    ],
  })
}

function walkToSummaryWithPet() {
  fireEvent.click(screen.getByText("Inizia"))
  fireEvent.click(screen.getByText("Sì"))
  fireEvent.click(screen.getByText("Continua")) // pet -> router -> pet-name
  fireEvent.change(screen.getByPlaceholderText("Nome"), { target: { value: "Fido" } })
  fireEvent.click(screen.getByText("Continua")) // pet-name -> summary
}

function reviewRowTitles() {
  return Array.from(document.querySelectorAll(".fk-review-row dt")).map((dt) => dt.textContent)
}

describe("FlowRunner: review shortcuts across a branch", () => {
  it("Back on the review after a row round trip goes to the previous step, not the review itself", () => {
    render(<FlowRunner flow={makeReviewBranchFlow()} />)
    walkToSummaryWithPet()

    fireEvent.click(document.querySelector(".fk-review-row")!) // edit "pet"
    expect(screen.getByText("Hai un animale?")).not.toBeNull()
    fireEvent.click(screen.getByText("Torna al riepilogo"))
    expect(screen.getByText("Riepilogo")).not.toBeNull()

    fireEvent.click(screen.getByLabelText("Indietro"))
    expect(screen.getByPlaceholderText("Nome")).not.toBeNull()
  })

  it("backing out of a row edit drops the shortcut, so the review's own submit button works first try", () => {
    const onSubmit = vi.fn()
    render(<FlowRunner flow={makeReviewBranchFlow()} onSubmit={onSubmit} />)
    walkToSummaryWithPet()

    fireEvent.click(document.querySelector(".fk-review-row")!) // edit "pet"
    fireEvent.click(screen.getByLabelText("Indietro")) // ...and back out of it
    expect(screen.getByText("Riepilogo")).not.toBeNull()

    const primary = document.querySelector(".fk-btn-primary")!
    expect(primary.textContent).not.toContain("riepilogo")
    fireEvent.click(primary)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it("editing a row into a different branch walks the new path instead of jumping back to the review", () => {
    render(<FlowRunner flow={makeReviewBranchFlow()} />)
    walkToSummaryWithPet()
    expect(reviewRowTitles()).toEqual(["Hai un animale?", "Nome"])

    fireEvent.click(document.querySelector(".fk-review-row")!) // edit "pet"
    fireEvent.click(screen.getByText("No")) // now the branch skips "pet-name"
    // The shortcut is gone: the steps ahead are no longer the ones already answered.
    expect(screen.queryByText("Torna al riepilogo")).toBeNull()

    fireEvent.click(screen.getByText("Continua"))
    expect(screen.getByText("Riepilogo")).not.toBeNull()
    // "Nome" was dropped from the flow: no empty leftover row, no stale answer.
    expect(reviewRowTitles()).toEqual(["Hai un animale?"])
  })

  it("re-answering back into the original branch asks the skipped step again", () => {
    render(<FlowRunner flow={makeReviewBranchFlow()} />)
    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.click(screen.getByText("No"))
    fireEvent.click(screen.getByText("Continua")) // pet -> router -> summary
    expect(screen.getByText("Riepilogo")).not.toBeNull()

    fireEvent.click(document.querySelector(".fk-review-row")!) // edit "pet"
    fireEvent.click(screen.getByText("Sì"))
    fireEvent.click(screen.getByText("Continua"))
    expect(screen.getByPlaceholderText("Nome")).not.toBeNull()
  })
})

describe("FlowRunner: malformed branch configs stay navigable", () => {
  it("a goTo naming a step that doesn't exist falls through instead of crashing", () => {
    const flow = parseFlow({
      id: "branch-bad-target",
      title: "Test",
      steps: [
        { id: "welcome", type: "intro", cta: "Inizia" },
        { id: "a", type: "text", required: false, placeholder: "Campo A" },
        { id: "router", type: "branch", rules: [{ when: { key: "a", op: "truthy" }, goTo: "typo-id" }] },
        { id: "b", type: "text", title: "Campo B", required: false },
        { id: "end", type: "confirmation" },
      ],
    })
    render(<FlowRunner flow={flow} />)
    fireEvent.click(screen.getByText("Inizia"))
    fireEvent.change(screen.getByPlaceholderText("Campo A"), { target: { value: "x" } })
    fireEvent.click(screen.getByText("Continua"))
    expect(screen.getByText("Campo B")).not.toBeNull()
  })

  it("branches pointing at each other resolve to a real step instead of looping forever", () => {
    const flow = parseFlow({
      id: "branch-cycle",
      title: "Test",
      steps: [
        { id: "welcome", type: "intro", cta: "Inizia" },
        { id: "r1", type: "branch", rules: [], fallback: "r2" },
        { id: "r2", type: "branch", rules: [], fallback: "r1" },
        { id: "b", type: "text", title: "Campo B", required: false },
        { id: "end", type: "confirmation" },
      ],
    })
    render(<FlowRunner flow={flow} />)
    fireEvent.click(screen.getByText("Inizia"))
    expect(screen.getByText("Campo B")).not.toBeNull()
  })
})
