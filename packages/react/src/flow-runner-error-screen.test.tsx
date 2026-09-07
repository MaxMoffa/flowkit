import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { parseFlow } from "@flowkit-io/core"
import { warmPaper, type Theme } from "@flowkit-io/themes"
import { FlowRunner } from "./flow-runner"
import "./steps/builtins"

/** warm-paper with its step-transition animation swapped — used to check the error
 *  screen only carries over a "fade", never a "slide". */
function themeWithAnimation(name: "fade" | "slide" | "none"): Theme {
  const anim = name === "none" ? undefined : { name, duration: 200 }
  return {
    ...warmPaper,
    light: { ...warmPaper.light, animation: anim },
    dark: { ...warmPaper.dark, animation: anim },
  }
}

function makeFlow(errorScreen?: unknown) {
  return parseFlow({
    id: "f",
    title: "F",
    ...(errorScreen === undefined ? {} : { errorScreen }),
    steps: [
      { id: "welcome", type: "intro", cta: "Inizia" },
      { id: "review", type: "review" },
      { id: "end", type: "confirmation" },
    ],
  })
}

describe("FlowRunner: generic error screen (flow.errorScreen)", () => {
  it("keeps the previous footer-message behavior when flow.errorScreen is unset", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Carta rifiutata."))
    render(<FlowRunner flow={makeFlow()} initialStep="review" onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole("button", { name: "Invia segnalazione ✓" }))

    await waitFor(() => expect(screen.getByText("Carta rifiutata.")).not.toBeNull())
    // Footer message path, not the full-screen error overlay.
    expect(document.querySelector(".fk-step-error")).toBeNull()
  })

  it("shows the error screen with the rejection message + default actions when errorScreen is set", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Carta rifiutata."))
    render(<FlowRunner flow={makeFlow({})} initialStep="review" onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole("button", { name: "Invia segnalazione ✓" }))

    const alert = await screen.findByRole("alert")
    expect(alert.textContent).toContain("Qualcosa è andato storto")
    expect(alert.textContent).toContain("Carta rifiutata.")
    expect(within(alert).getByRole("button", { name: "Riprova" })).not.toBeNull()
    expect(within(alert).getByRole("button", { name: "Indietro" })).not.toBeNull()
  })

  it("retry re-runs onSubmit; a second failure re-shows the screen, a success advances the flow", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(new Error("Errore temporaneo."))
      .mockResolvedValueOnce(undefined)
    render(<FlowRunner flow={makeFlow({})} initialStep="review" onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole("button", { name: "Invia segnalazione ✓" }))
    await screen.findByRole("alert")

    fireEvent.click(screen.getByRole("button", { name: "Riprova" }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2))
    // Second call resolved → flow advanced to the confirmation step, error screen gone.
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull())
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Grazie!")
  })

  it("carries over the theme's 'fade' step animation (with its duration), but not 'slide' or none", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Boom."))

    const { rerender } = render(
      <FlowRunner
        flow={makeFlow({})}
        initialStep="review"
        onSubmit={onSubmit}
        theme={themeWithAnimation("fade")}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: "Invia segnalazione ✓" }))
    let alert = await screen.findByRole("alert")
    expect(alert.className).toContain("fk-anim-fade")
    expect(alert.style.getPropertyValue("--fk-anim-duration")).toBe("200ms")

    for (const name of ["slide", "none"] as const) {
      rerender(
        <FlowRunner
          flow={makeFlow({})}
          initialStep="review"
          onSubmit={onSubmit}
          theme={themeWithAnimation(name)}
        />,
      )
      alert = screen.getByRole("alert")
      expect(alert.className).not.toContain("fk-anim-")
    }
  })

  it("dismiss just closes the screen and leaves the user on the review step", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Boom."))
    const flow = makeFlow({ actions: [{ kind: "dismiss" }] })
    render(<FlowRunner flow={flow} initialStep="review" onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole("button", { name: "Invia segnalazione ✓" }))
    await screen.findByRole("alert")
    fireEvent.click(screen.getByRole("button", { name: "Chiudi" }))

    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull())
    expect(screen.getByRole("button", { name: "Invia segnalazione ✓" })).not.toBeNull()
  })
})
