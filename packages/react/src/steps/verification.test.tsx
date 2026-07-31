import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import type { AnswerValue, VerificationStep } from "@flowkit-io/core"
import { VerificationStepView } from "./verification"

const baseFlow = { id: "t", title: "t", locale: "it", steps: [], disableBack: false, timezone: "UTC" }

function makeStep(overrides: Partial<VerificationStep> = {}): VerificationStep {
  return {
    id: "verify",
    type: "verification",
    provider: "turnstile",
    siteKey: "test-site-key",
    enabled: true,
    previewVerified: false,
    verifyToken: async () => true,
    ...overrides,
  } as unknown as VerificationStep
}

function renderStep(step: VerificationStep, value: AnswerValue = null) {
  return render(
    <VerificationStepView
      step={step}
      value={value}
      onChange={() => {}}
      flow={baseFlow}
      answers={{}}
      meta={{}}
      onMetaChange={() => {}}
    />,
  )
}

describe("VerificationStepView", () => {
  it("enabled:false renders only title/subtitle, no widget and no success state", () => {
    const { container } = renderStep(makeStep({ enabled: false, title: "Check", subtitle: "sub" }))
    expect(container.querySelector("h2")?.textContent).toBe("Check")
    expect(container.querySelector(".fk-verification-widget")).toBeNull()
    expect(container.querySelector(".fk-loc-row")).toBeNull()
  })

  it("previewVerified:true shows the success state immediately, without a widget container", () => {
    const { container } = renderStep(makeStep({ previewVerified: true }))
    expect(container.querySelector(".fk-loc-row")?.textContent).toContain("Verifica completata")
    expect(container.querySelector(".fk-verification-widget")).toBeNull()
  })

  it("previewVerified:true synthesizes a verified value via onChange on mount", () => {
    let lastValue: unknown = null
    render(
      <VerificationStepView
        step={makeStep({ previewVerified: true })}
        value={null}
        onChange={(v) => {
          lastValue = v
        }}
        flow={baseFlow}
        answers={{}}
        meta={{}}
        onMetaChange={() => {}}
      />,
    )
    expect(lastValue).toEqual({ verified: true, provider: "turnstile" })
  })

  it("enabled:false takes precedence over previewVerified:true", () => {
    const { container } = renderStep(makeStep({ enabled: false, previewVerified: true }))
    expect(container.querySelector(".fk-loc-row")).toBeNull()
    expect(container.querySelector(".fk-verification-widget")).toBeNull()
  })

  it("default (enabled, not preview) renders the widget container and a loading state", () => {
    const { container } = renderStep(makeStep())
    expect(container.querySelector(".fk-verification-widget")).not.toBeNull()
    expect(container.querySelector(".fk-map-search-loading")?.textContent).toContain("Carico il widget")
  })

  it("shows the success state once the answer value already carries verified:true", () => {
    const { container } = renderStep(makeStep(), { verified: true, provider: "turnstile", token: "abc" })
    expect(container.querySelector(".fk-loc-row")?.textContent).toContain("Verifica completata")
  })
})
