import type { ComponentProps } from "react"
import { describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"
import { ConfirmationFooter } from "./flow-footer"

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
