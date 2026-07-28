import { describe, expect, it } from "vitest"
import { getStepTypeDefinition, verificationStepSchema } from "./index"

function makeStep(overrides: Partial<Parameters<typeof verificationStepSchema.parse>[0]> = {}) {
  return verificationStepSchema.parse({
    id: "verify",
    type: "verification",
    provider: "turnstile",
    siteKey: "test-site-key",
    verifyToken: async () => true,
    ...overrides,
  })
}

describe("verification step", () => {
  it("registers with no role, so it's a plain gating step, not intro/confirmation-like", () => {
    expect(getStepTypeDefinition("verification")?.role).toBeUndefined()
  })

  it("defaults enabled to true", () => {
    const step = makeStep()
    expect(step.enabled).toBe(true)
  })

  it("accepts both provider values", () => {
    expect(makeStep({ provider: "turnstile" }).provider).toBe("turnstile")
    expect(makeStep({ provider: "recaptcha" }).provider).toBe("recaptcha")
  })

  it("rejects a config missing verifyToken", () => {
    expect(() =>
      verificationStepSchema.parse({
        id: "verify",
        type: "verification",
        provider: "turnstile",
        siteKey: "test-site-key",
      }),
    ).toThrow()
  })

  it("rejects verifyToken that isn't a function", () => {
    expect(() => makeStep({ verifyToken: "nope" as unknown as never })).toThrow()
  })

  describe("validate", () => {
    const def = getStepTypeDefinition("verification")!

    it("returns false for a null/undefined value", () => {
      const step = makeStep()
      expect(def.validate(step, null, {})).toBe(false)
      expect(def.validate(step, undefined, {})).toBe(false)
    })

    it("returns false when verified is false", () => {
      const step = makeStep()
      expect(def.validate(step, { verified: false, provider: "turnstile" }, {})).toBe(false)
    })

    it("returns true when verified is true", () => {
      const step = makeStep()
      expect(
        def.validate(step, { verified: true, provider: "turnstile", token: "abc" }, {}),
      ).toBe(true)
    })

    it("bypasses validation entirely when enabled is false, regardless of value", () => {
      const step = makeStep({ enabled: false })
      expect(def.validate(step, null, {})).toBe(true)
      expect(def.validate(step, { verified: false, provider: "turnstile" }, {})).toBe(true)
    })
  })
})
