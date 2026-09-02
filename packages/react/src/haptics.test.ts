import { afterEach, describe, expect, it, vi } from "vitest"
import { haptic } from "./haptics"

const nav = navigator as unknown as { vibrate?: (pattern: number | number[]) => boolean }

afterEach(() => {
  delete nav.vibrate
})

describe("haptic", () => {
  it("calls navigator.vibrate with a pattern when enabled and supported", () => {
    const vibrate = vi.fn(() => true)
    nav.vibrate = vibrate

    haptic("advance", true)
    expect(vibrate).toHaveBeenCalledWith(10)

    haptic("submit", true)
    expect(vibrate).toHaveBeenCalledWith([14, 10, 14])

    haptic("blocked", true)
    expect(vibrate).toHaveBeenCalledWith([28])
  })

  it("is a no-op when disabled", () => {
    const vibrate = vi.fn(() => true)
    nav.vibrate = vibrate
    haptic("advance", false)
    expect(vibrate).not.toHaveBeenCalled()
  })

  it("is a silent no-op when the Vibration API is missing", () => {
    expect(nav.vibrate).toBeUndefined()
    expect(() => haptic("advance", true)).not.toThrow()
  })

  it("swallows errors thrown by navigator.vibrate", () => {
    nav.vibrate = vi.fn(() => {
      throw new Error("blocked outside a user gesture")
    })
    expect(() => haptic("back", true)).not.toThrow()
  })
})
