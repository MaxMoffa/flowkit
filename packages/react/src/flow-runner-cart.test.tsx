import { describe, expect, it } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { parseFlow } from "@flowkit-io/core"
import { FlowRunner, type FlowRunnerHandle } from "./flow-runner"
import "./steps/builtins"

/** Two independent `catalog` steps in the same flow — the footer's cart panel
 *  aggregates rows from both (see `buildOrderSummary`), so its +/-/remove controls
 *  must write back to whichever step actually owns the clicked line, not always the
 *  step currently on screen (which `catalog.tsx`'s own in-step `setQuantity` can't
 *  get wrong, being mono-step by construction). */
function twoCatalogFlow() {
  return parseFlow({
    id: "shop",
    title: "Shop",
    steps: [
      { id: "welcome", type: "intro", cta: "Inizia" },
      {
        id: "cart1",
        key: "cart1",
        type: "catalog",
        title: "Maglie",
        currency: "eur",
        items: [{ value: "a", label: "Maglia A", price: 1000, maxQuantity: 5 }],
      },
      {
        id: "cart2",
        key: "cart2",
        type: "catalog",
        title: "Cappelli",
        currency: "eur",
        items: [{ value: "b", label: "Cappello B", price: 2000, maxQuantity: 5 }],
      },
      { id: "end", type: "confirmation" },
    ],
  })
}

describe("FlowRunner: footer cart panel writes to the correct source step", () => {
  it("bumps the line belonging to a DIFFERENT catalog step than the one on screen", () => {
    const ref = { current: null as FlowRunnerHandle | null }
    render(
      <FlowRunner
        ref={ref}
        flow={twoCatalogFlow()}
        initialStep="cart2"
        initialAnswers={{
          cart1: { items: [{ value: "a", quantity: 1 }], total: 1000 },
          cart2: { items: [{ value: "b", quantity: 1 }], total: 2000 },
        }}
      />,
    )
    // On "cart2" ("Cappelli") — the panel still aggregates both steps' lines.
    expect(screen.getByText("Cappelli")).not.toBeNull()

    fireEvent.click(screen.getAllByLabelText(/Carrello/)[0]!)
    const sheet = document.querySelector(".fk-cart-sheet")!
    expect(sheet.textContent).toContain("Maglia A")
    expect(sheet.textContent).toContain("Cappello B")

    // Bump the OTHER step's line ("Maglia A", owned by "cart1") while "cart2" is the
    // step actually on screen.
    const rows = Array.from(sheet.querySelectorAll(".fk-cart-summary-line"))
    const maglieRow = rows.find((row) => row.textContent?.includes("Maglia A"))!
    fireEvent.click(maglieRow.querySelector('[aria-label="Aumenta la quantità"]')!)

    expect(ref.current!.getAnswers()).toEqual({
      cart1: { items: [{ value: "a", quantity: 2 }], total: 2000 },
      cart2: { items: [{ value: "b", quantity: 1 }], total: 2000 },
    })
    // Writing to "cart1" from the panel didn't navigate away from "cart2".
    expect(ref.current!.currentStep.id).toBe("cart2")
  })

  it("removing a line from the panel drops it from the correct step's answer, leaving the other step untouched", () => {
    const ref = { current: null as FlowRunnerHandle | null }
    render(
      <FlowRunner
        ref={ref}
        flow={twoCatalogFlow()}
        initialStep="cart2"
        initialAnswers={{
          cart1: { items: [{ value: "a", quantity: 1 }], total: 1000 },
          cart2: { items: [{ value: "b", quantity: 1 }], total: 2000 },
        }}
      />,
    )
    fireEvent.click(screen.getAllByLabelText(/Carrello/)[0]!)
    const sheet = document.querySelector(".fk-cart-sheet")!
    const rows = Array.from(sheet.querySelectorAll(".fk-cart-summary-line"))
    const maglieRow = rows.find((row) => row.textContent?.includes("Maglia A"))!
    fireEvent.click(maglieRow.querySelector('[aria-label="Rimuovi"]')!)

    // `setAnswer` stores whatever value is written, including `null` for an emptied
    // catalog (same as clearing the last item from inside the step itself) — the key
    // stays present, just cleared, rather than being deleted from the answers map.
    expect(ref.current!.getAnswers()).toEqual({
      cart1: null,
      cart2: { items: [{ value: "b", quantity: 1 }], total: 2000 },
    })
  })
})
