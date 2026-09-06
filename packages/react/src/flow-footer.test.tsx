import { useState, type ComponentProps } from "react"
import { describe, expect, it, vi } from "vitest"
import { render, fireEvent } from "@testing-library/react"
import type { OrderSummary } from "@flowkit-io/core"
import { ConfirmationFooter, StepFooter, type FooterCartInfo } from "./flow-footer"

function renderFooter(props: Partial<ComponentProps<typeof ConfirmationFooter>> = {}) {
  return render(
    <ConfirmationFooter
      order={4}
      secondaryLabel="Nuova segnalazione"
      showSecondary
      onSecondary={vi.fn()}
      primaryLabel="Torna alla home"
      showPrimary
      onPrimary={vi.fn()}
      {...props}
    />,
  )
}

describe("ConfirmationFooter", () => {
  it("renders both buttons by default", () => {
    const { container } = renderFooter()
    expect(container.querySelector(".fk-btn-secondary")).not.toBeNull()
    expect(container.querySelector(".fk-btn-primary")).not.toBeNull()
  })

  it("hides the restart button when showSecondary is false", () => {
    const { container } = renderFooter({ showSecondary: false })
    expect(container.querySelector(".fk-btn-secondary")).toBeNull()
    expect(container.querySelector(".fk-btn-primary")).not.toBeNull()
  })

  it("uses the given secondary label", () => {
    const { getByText } = renderFooter({ secondaryLabel: "Compila un altro modulo" })
    expect(getByText("Compila un altro modulo")).not.toBeNull()
  })
})

const orderSummary: OrderSummary = {
  currency: "eur",
  total: 5000,
  lines: [
    { stepId: "hero", value: "tshirt", label: "T-shirt", quantity: 2, unitAmount: 2500, amount: 5000, kind: "item" },
  ],
}

const cart: FooterCartInfo = {
  summary: orderSummary,
  count: 2,
  locale: "it",
  totalLabel: "Totale ordine",
  openLabel: "Carrello",
  closeLabel: "Chiudi",
  decreaseLabel: "Riduci la quantità",
  increaseLabel: "Aumenta la quantità",
  removeLabel: "Rimuovi",
  lineCaps: new Map([["hero::tshirt", 5]]),
  onLineQuantityChange: vi.fn(),
}

function renderStepFooter(props: Partial<ComponentProps<typeof StepFooter>> = {}) {
  return render(
    <StepFooter
      order={1}
      showBack={false}
      backDisabled={false}
      onBack={vi.fn()}
      backLabel="Indietro"
      primaryLabel="Continua"
      primaryDisabled={false}
      isSubmit={false}
      onPrimary={vi.fn()}
      progress={{ Component: null, show: false, pct: 0, currentIndex: 0, total: null }}
      {...props}
    />,
  )
}

describe("StepFooter: cart panel", () => {
  it("renders no cart trigger when cart is not provided", () => {
    const { container } = renderStepFooter()
    expect(container.querySelector(".fk-footer-cart")).toBeNull()
  })

  it("shows a cart trigger with the item-count badge exactly when orderTotal/cart are set", () => {
    const { container } = renderStepFooter({
      orderTotal: { label: "Totale ordine", amount: "50,00 €" },
      cart,
    })
    const triggers = container.querySelectorAll(".fk-footer-cart")
    // Two render sites (mobile row + desktop total block); CSS decides which shows.
    expect(triggers).toHaveLength(2)
    triggers.forEach((trigger) => {
      expect(trigger.querySelector(".fk-footer-cart-badge")?.textContent).toBe("2")
    })
  })

  it("opens the cart panel from the trigger and shows the itemized recap, then closes it", () => {
    const { container } = renderStepFooter({
      orderTotal: { label: "Totale ordine", amount: "50,00 €" },
      cart,
    })
    expect(container.ownerDocument.querySelector(".fk-cart-sheet")).toBeNull()

    fireEvent.click(container.querySelector(".fk-footer-cart")!)
    const sheet = container.ownerDocument.querySelector(".fk-cart-sheet")
    expect(sheet).not.toBeNull()
    expect(sheet!.textContent).toContain("T-shirt")
    expect(sheet!.textContent).toContain("2×")
    expect(sheet!.textContent).toContain("50,00")

    fireEvent.click(container.ownerDocument.querySelector(".fk-cart-sheet-close")!)
    expect(container.ownerDocument.querySelector(".fk-cart-sheet")).toBeNull()
  })

  it("shows the tax-behavior note next to the running total and the cart panel's total when set", () => {
    const { container } = renderStepFooter({
      orderTotal: { label: "Totale ordine", amount: "50,00 €", taxNote: "+ IVA" },
      cart: { ...cart, taxNote: "+ IVA" },
    })
    expect(container.querySelector(".fk-footer-order-total-tax-note")?.textContent).toBe("+ IVA")

    fireEvent.click(container.querySelector(".fk-footer-cart")!)
    const sheet = container.ownerDocument.querySelector(".fk-cart-sheet")!
    expect(sheet.querySelector(".fk-cart-summary-total-tax-note")?.textContent).toBe("+ IVA")
  })

  it("shows no tax-behavior note when the flow has no real tax integration (taxNote unset)", () => {
    const { container } = renderStepFooter({
      orderTotal: { label: "Totale ordine", amount: "50,00 €" },
      cart,
    })
    expect(container.querySelector(".fk-footer-order-total-tax-note")).toBeNull()

    fireEvent.click(container.querySelector(".fk-footer-cart")!)
    const sheet = container.ownerDocument.querySelector(".fk-cart-sheet")!
    expect(sheet.querySelector(".fk-cart-summary-total-tax-note")).toBeNull()
  })
})

/** Drives `cart.summary`/`cart.count` from local state via `onLineQuantityChange`,
 *  the same way `flow-runner.tsx` derives them from `state.answers` — proves the
 *  panel's +/-/remove controls actually round-trip through the callback, not just
 *  that they render. */
function StatefulCartPanel() {
  const [quantity, setQuantity] = useState(2)
  const summary: OrderSummary = {
    currency: "eur",
    total: 2500 * quantity,
    lines:
      quantity > 0
        ? [
            {
              stepId: "hero",
              value: "tshirt",
              label: "T-shirt",
              quantity,
              unitAmount: 2500,
              amount: 2500 * quantity,
              kind: "item",
            },
          ]
        : [],
  }
  const cartInfo: FooterCartInfo = {
    summary,
    count: quantity,
    locale: "it",
    totalLabel: "Totale ordine",
    openLabel: "Carrello",
    closeLabel: "Chiudi",
    decreaseLabel: "Riduci la quantità",
    increaseLabel: "Aumenta la quantità",
    removeLabel: "Rimuovi",
    lineCaps: new Map([["hero::tshirt", 5]]),
    onLineQuantityChange: (_stepId, _itemValue, next) => setQuantity(next),
  }
  return (
    <StepFooter
      order={1}
      showBack={false}
      backDisabled={false}
      onBack={vi.fn()}
      backLabel="Indietro"
      primaryLabel="Continua"
      primaryDisabled={false}
      isSubmit={false}
      onPrimary={vi.fn()}
      progress={{ Component: null, show: false, pct: 0, currentIndex: 0, total: null }}
      orderTotal={{ label: "Totale ordine", amount: `${(2500 * quantity) / 100},00 €` }}
      cart={cartInfo}
    />
  )
}

describe("StepFooter: cart panel +/-/remove controls", () => {
  it("increases and decreases the line quantity, updating the panel's recap", () => {
    const { container } = render(<StatefulCartPanel />)
    fireEvent.click(container.querySelector(".fk-footer-cart")!)
    const sheet = container.ownerDocument.querySelector(".fk-cart-sheet")!

    expect(sheet.querySelector(".fk-cart-summary-qty-value")?.textContent).toBe("2")
    fireEvent.click(sheet.querySelector('[aria-label="Aumenta la quantità"]')!)
    expect(sheet.querySelector(".fk-cart-summary-qty-value")?.textContent).toBe("3")

    fireEvent.click(sheet.querySelector('[aria-label="Riduci la quantità"]')!)
    expect(sheet.querySelector(".fk-cart-summary-qty-value")?.textContent).toBe("2")
  })

  it("removes the line and clears the recap when decreased to zero", () => {
    const { container } = render(<StatefulCartPanel />)
    fireEvent.click(container.querySelector(".fk-footer-cart")!)
    const sheet = container.ownerDocument.querySelector(".fk-cart-sheet")!

    fireEvent.click(sheet.querySelector('[aria-label="Riduci la quantità"]')!)
    fireEvent.click(sheet.querySelector('[aria-label="Riduci la quantità"]')!)
    expect(sheet.textContent).not.toContain("T-shirt")
    expect(sheet.querySelector(".fk-cart-summary-line")).toBeNull()
  })

  it("removes the line via the dedicated remove button, regardless of quantity", () => {
    const { container } = render(<StatefulCartPanel />)
    fireEvent.click(container.querySelector(".fk-footer-cart")!)
    const sheet = container.ownerDocument.querySelector(".fk-cart-sheet")!

    fireEvent.click(sheet.querySelector('[aria-label="Rimuovi"]')!)
    expect(sheet.textContent).not.toContain("T-shirt")
  })

  it("disables the increase button once the line hits its per-item cap", () => {
    const { container } = render(<StatefulCartPanel />)
    fireEvent.click(container.querySelector(".fk-footer-cart")!)
    const sheet = container.ownerDocument.querySelector(".fk-cart-sheet")!
    const increase = sheet.querySelector('[aria-label="Aumenta la quantità"]') as HTMLButtonElement

    fireEvent.click(increase) // 2 -> 3
    fireEvent.click(increase) // 3 -> 4
    fireEvent.click(increase) // 4 -> 5 (cap from lineCaps)
    expect(sheet.querySelector(".fk-cart-summary-qty-value")?.textContent).toBe("5")
    expect(increase.disabled).toBe(true)
  })
})
