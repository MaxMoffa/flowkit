import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import type { InfoStep } from "@flowkit-io/core"
import { InfoStepView } from "./info"

const baseFlow = { id: "t", title: "t", locale: "it", steps: [], disableBack: false, timezone: "UTC" }

function makeProps(step: Partial<InfoStep>) {
  return {
    step: { id: "info-1", type: "info", required: false, ...step } as InfoStep,
    value: null,
    onChange: () => {},
    flow: baseFlow,
    answers: {},
    meta: {},
    onMetaChange: () => {},
  } as const
}

describe("InfoStepView", () => {
  it("renders title/subtitle/image the same way intro does, via the shared IntroLikeView", () => {
    const { container } = render(
      <InfoStepView
        {...makeProps({
          title: "Prima di iniziare",
          subtitle: "Leggi con attenzione",
          image: { kind: "emoji", value: "ℹ️" },
        })}
      />,
    )
    expect(container.querySelector("h1.fk-title")?.textContent).toBe("Prima di iniziare")
    expect(container.querySelector("p.fk-subtitle")?.textContent).toBe("Leggi con attenzione")
    expect(container.querySelector(".fk-intro-badge")?.textContent).toBe("ℹ️")
  })

  it("renders no livePill (info-only field intro has but info doesn't)", () => {
    const { container } = render(<InfoStepView {...makeProps({ title: "X" })} />)
    expect(container.querySelector(".fk-intro-pill")).toBeNull()
  })
})
