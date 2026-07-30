import { describe, expect, it } from "vitest"
import { bookingSlotStepSchema, listBookingSlotDates, listBookingSlotsForDate, parseFlow } from "./index"

function step(overrides: Record<string, unknown> = {}) {
  return bookingSlotStepSchema.parse({
    id: "slot",
    type: "booking-slot",
    startDate: "2026-08-03", // a Monday
    endDate: "2026-08-09", // the following Sunday
    weeklyWindows: [{ dayOfWeek: 1, start: "09:00", end: "10:00" }], // Mondays only
    capacity: 4,
    ...overrides,
  })
}

describe("listBookingSlotDates", () => {
  it("only includes dates whose weekday has a weeklyWindows entry", () => {
    const dates = listBookingSlotDates(step())
    expect(dates).toEqual(["2026-08-03"]) // the one Monday in range
  })

  it("is empty when no date in range matches any weekly window", () => {
    const dates = listBookingSlotDates(
      step({
        startDate: "2026-08-03", // Monday
        endDate: "2026-08-03",
        weeklyWindows: [{ dayOfWeek: 3, start: "09:00", end: "10:00" }], // Wednesdays only
      }),
    )
    expect(dates).toEqual([])
  })
})

describe("listBookingSlotsForDate", () => {
  it("generates 30-min slots by default within the window, none past it", () => {
    const s = step({ weeklyWindows: [{ dayOfWeek: 1, start: "09:00", end: "10:00" }], granularity: "30min" })
    const slots = listBookingSlotsForDate(s, "2026-08-03")
    expect(slots.map((x) => x.time)).toEqual(["09:00", "09:30"])
    expect(slots[0]!.start).toBe("2026-08-03T09:00:00")
    expect(slots[0]!.durationMinutes).toBe(30)
  })

  it("returns an empty array for a weekday with no matching window", () => {
    expect(listBookingSlotsForDate(step(), "2026-08-04")).toEqual([]) // Tuesday
  })

  it("produces one whole-day slot for granularity 'daily'", () => {
    const s = step({ granularity: "daily" })
    const slots = listBookingSlotsForDate(s, "2026-08-03")
    expect(slots).toHaveLength(1)
    expect(slots[0]).toMatchObject({ start: "2026-08-03T00:00:00", durationMinutes: 24 * 60 })
    expect(slots[0]!.time).toBeUndefined()
  })

  it("computes availability status from capacity, remainingOverrides, and limitedThreshold", () => {
    const s = step({
      capacity: 4,
      limitedThreshold: 0.5,
      remainingOverrides: { "2026-08-03T09:00:00": 0, "2026-08-03T09:30:00": 2 },
    })
    const slots = listBookingSlotsForDate(s, "2026-08-03")
    expect(slots.find((x) => x.time === "09:00")?.status).toBe("full")
    expect(slots.find((x) => x.time === "09:30")?.status).toBe("limited") // 2/4 = 0.5 <= threshold
  })

  it("defaults to 'available' when no override is set", () => {
    const slots = listBookingSlotsForDate(step(), "2026-08-03")
    expect(slots.every((s) => s.status === "available")).toBe(true)
    expect(slots.every((s) => s.remaining === 4)).toBe(true)
  })
})

describe("bookingSlotStepSchema validation", () => {
  it("rejects endDate before startDate", () => {
    expect(() => step({ startDate: "2026-08-09", endDate: "2026-08-03" })).toThrow()
  })

  it("rejects a weekly window whose start isn't before its end", () => {
    expect(() => step({ weeklyWindows: [{ dayOfWeek: 1, start: "10:00", end: "09:00" }] })).toThrow()
  })

  it("rejects an empty weeklyWindows array", () => {
    expect(() => step({ weeklyWindows: [] })).toThrow()
  })
})

describe("Flow.timezone", () => {
  it("defaults to UTC", () => {
    const flow = parseFlow({
      id: "f",
      title: "F",
      steps: [
        { id: "i", type: "intro" },
        { id: "c", type: "confirmation" },
      ],
    })
    expect(flow.timezone).toBe("UTC")
  })

  it("is preserved when explicitly set", () => {
    const flow = parseFlow({
      id: "f",
      title: "F",
      timezone: "Europe/Rome",
      steps: [
        { id: "i", type: "intro" },
        { id: "c", type: "confirmation" },
      ],
    })
    expect(flow.timezone).toBe("Europe/Rome")
  })
})
