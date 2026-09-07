import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { parseFlow } from "@flowkit-io/core"
import { FlowRunner } from "./flow-runner"
import "./steps/builtins"

/** `introStepSchema.ctaFootnote` — small print under the start button, e.g. a
 *  platform's standing disclaimer on flows its users author. */
describe("FlowRunner: intro ctaFootnote", () => {
  const flow = parseFlow({
    id: "f",
    title: "F",
    content: { "platform.note": "Creato da un utente. [Termini](https://example.com/terms)" },
    steps: [
      {
        id: "welcome",
        type: "intro",
        cta: "Inizia",
        ctaFootnote: { key: "platform.note" },
      },
      { id: "name", key: "name", type: "text", title: "Nome", required: false },
      { id: "review", type: "review" },
      { id: "end", type: "confirmation" },
    ],
  })

  it("renders the resolved footnote (with a working external link) under the CTA on the intro step", () => {
    render(<FlowRunner flow={flow} />)
    const note = screen.getByText(/Creato da un utente/)
    expect(note.closest(".fk-footer-note")).not.toBeNull()

    const link = screen.getByRole("link", { name: "Termini" })
    expect(link.getAttribute("href")).toBe("https://example.com/terms")
    expect(link.getAttribute("target")).toBe("_blank")
    expect(link.getAttribute("rel")).toContain("noopener")
  })

  it("is gone once the flow moves past the intro step", () => {
    render(<FlowRunner flow={flow} />)
    fireEvent.click(screen.getByRole("button", { name: "Inizia" }))
    expect(screen.queryByText(/Creato da un utente/)).toBeNull()
  })

  it("the review step has its own independent ctaFootnote", () => {
    const withReview = parseFlow({
      id: "f3",
      title: "F3",
      steps: [
        { id: "welcome", type: "intro", cta: "Inizia", ctaFootnote: "Nota intro" },
        {
          id: "review",
          type: "review",
          ctaFootnote: "Procedendo accetti i [termini](https://example.com/t)",
        },
        { id: "end", type: "confirmation" },
      ],
    })
    const { container } = render(<FlowRunner flow={withReview} initialStep="review" />)
    const note = container.querySelector(".fk-footer-note")
    expect(note?.textContent).toContain("Procedendo accetti i")
    expect(note?.textContent).not.toContain("Nota intro")
    expect(screen.getByRole("link", { name: "termini" }).getAttribute("href")).toBe(
      "https://example.com/t",
    )
  })

  it("no .fk-footer-note when the intro step has no ctaFootnote", () => {
    const bare = parseFlow({
      id: "f2",
      title: "F2",
      steps: [
        { id: "welcome", type: "intro", cta: "Inizia" },
        { id: "review", type: "review" },
        { id: "end", type: "confirmation" },
      ],
    })
    const { container } = render(<FlowRunner flow={bare} />)
    expect(container.querySelector(".fk-footer-note")).toBeNull()
  })
})
