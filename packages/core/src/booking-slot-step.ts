import { z } from "zod"
import { registerStepType } from "./registry"
import { baseStepFields } from "./schema"

/**
 * "booking-slot" step (v2.31): a slot picker distinct from "date-time" — two levels
 * (available dates, then available times for the chosen date), each slot showing its
 * own availability (available/limited/full). Slots are generated entirely client-side
 * from this config (no remote data source in this iteration): no "backend" tracks real
 * bookings, so `remainingOverrides` is a static seed a flow author supplies to demo
 * limited/full slots. The step reads the flow's fixed `timezone` (Flow.timezone, see
 * schema.ts) — never the browser's — so date/time math here is pure calendar
 * arithmetic (UTC-anchored Date math, used only to avoid the host's local-time DST
 * quirks; it never represents an actual moment in the browser's zone).
 */

export const bookingSlotGranularitySchema = z.enum(["15min", "30min", "60min", "daily"])

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/
const datePattern = /^\d{4}-\d{2}-\d{2}$/

export const bookingSlotWeeklyWindowSchema = z
  .object({
    /** 0 = Sunday .. 6 = Saturday. */
    dayOfWeek: z.number().int().min(0).max(6),
    /** "HH:mm" 24h, inclusive start. Ignored for granularity "daily". */
    start: z.string().regex(timePattern).default("00:00"),
    /** "HH:mm" 24h, exclusive end. Ignored for granularity "daily". */
    end: z.string().regex(timePattern).default("23:59"),
  })
  .refine((w) => w.start < w.end, { message: "start must be before end", path: ["end"] })

export const bookingSlotStepSchema = z
  .object({
    ...baseStepFields,
    type: z.literal("booking-slot"),
    granularity: bookingSlotGranularitySchema.default("30min"),
    /** Inclusive date range shown, "YYYY-MM-DD", interpreted in the flow's timezone. */
    startDate: z.string().regex(datePattern),
    endDate: z.string().regex(datePattern),
    /** Active windows per weekday; a weekday with no entry has no slots at all. */
    weeklyWindows: z.array(bookingSlotWeeklyWindowSchema).min(1),
    /** Total capacity for every generated slot, unless overridden. */
    capacity: z.number().int().min(1).default(1),
    /** Static seed of remaining-spots overrides, keyed by the slot's `start` value
     *  ("YYYY-MM-DDTHH:mm:00", or "YYYY-MM-DDT00:00:00" for a "daily" slot). Unset
     *  slots default to full `capacity`. */
    remainingOverrides: z.record(z.string(), z.number().int().min(0)).optional(),
    /** A slot with remaining/capacity at or below this fraction (and > 0) renders
     *  "limited" instead of "available". */
    limitedThreshold: z.number().min(0).max(1).default(0.34),
  })
  .refine((s) => s.startDate <= s.endDate, { message: "startDate must not be after endDate", path: ["endDate"] })

export type BookingSlotStep = z.infer<typeof bookingSlotStepSchema>

export interface BookingSlot {
  /** "HH:mm", or undefined for a "daily" (whole-day) slot. */
  time?: string
  /** Local wall-clock datetime in the flow's fixed timezone, no UTC offset:
   *  "YYYY-MM-DDTHH:mm:00". */
  start: string
  durationMinutes: number
  capacity: number
  remaining: number
  status: "available" | "limited" | "full"
}

export interface BookingSlotValue {
  start: string
  durationMinutes: number
  /** The flow's fixed timezone this datetime is expressed in (Flow.timezone). */
  timezone: string
}

const GRANULARITY_MINUTES: Record<Exclude<z.infer<typeof bookingSlotGranularitySchema>, "daily">, number> = {
  "15min": 15,
  "30min": 30,
  "60min": 60,
}

function parseDateParts(date: string): { y: number; m: number; d: number } {
  const [y, m, d] = date.split("-").map(Number)
  return { y: y!, m: m!, d: d! }
}

/** UTC-anchored on purpose: used only for calendar arithmetic (day-of-week, add days),
 *  never to represent a real instant, so the host's local timezone/DST can't skew it. */
function dateFromUtc(y: number, m: number, d: number): string {
  return new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10)
}

function dayOfWeekOf(date: string): number {
  const { y, m, d } = parseDateParts(date)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

function addDays(date: string, days: number): string {
  const { y, m, d } = parseDateParts(date)
  return dateFromUtc(y, m, d + days)
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h! * 60 + m!
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function slotStatus(remaining: number, capacity: number, limitedThreshold: number): BookingSlot["status"] {
  if (remaining <= 0) return "full"
  if (remaining / capacity <= limitedThreshold) return "limited"
  return "available"
}

/** Pure: the slots available on one specific date, respecting weeklyWindows/capacity/
 *  remainingOverrides. Empty array = no slots that day (closed). */
export function listBookingSlotsForDate(config: BookingSlotStep, date: string): BookingSlot[] {
  const weekday = dayOfWeekOf(date)
  const windows = config.weeklyWindows.filter((w) => w.dayOfWeek === weekday)
  if (windows.length === 0) return []

  if (config.granularity === "daily") {
    const start = `${date}T00:00:00`
    const remaining = config.remainingOverrides?.[start] ?? config.capacity
    return [
      {
        start,
        durationMinutes: 24 * 60,
        capacity: config.capacity,
        remaining,
        status: slotStatus(remaining, config.capacity, config.limitedThreshold),
      },
    ]
  }

  const stepMinutes = GRANULARITY_MINUTES[config.granularity]
  const slots: BookingSlot[] = []
  for (const window of windows) {
    const windowStart = timeToMinutes(window.start)
    const windowEnd = timeToMinutes(window.end)
    for (let t = windowStart; t + stepMinutes <= windowEnd; t += stepMinutes) {
      const time = minutesToTime(t)
      const start = `${date}T${time}:00`
      const remaining = config.remainingOverrides?.[start] ?? config.capacity
      slots.push({
        time,
        start,
        durationMinutes: stepMinutes,
        capacity: config.capacity,
        remaining,
        status: slotStatus(remaining, config.capacity, config.limitedThreshold),
      })
    }
  }
  return slots
}

/** Pure: every date in [startDate, endDate] that has at least one slot. Capped at ~10
 *  years of days as a sanity guard against a misconfigured huge range. */
export function listBookingSlotDates(config: BookingSlotStep): string[] {
  const dates: string[] = []
  let cursor = config.startDate
  for (let i = 0; i < 3660 && cursor <= config.endDate; i++, cursor = addDays(cursor, 1)) {
    if (listBookingSlotsForDate(config, cursor).length > 0) dates.push(cursor)
  }
  return dates
}

registerStepType({
  type: "booking-slot",
  schema: bookingSlotStepSchema,
  validate: (_step, value) => {
    const v = value as Partial<BookingSlotValue> | null
    return (
      !!v &&
      typeof v === "object" &&
      typeof v.start === "string" &&
      v.start.length > 0 &&
      typeof v.durationMinutes === "number"
    )
  },
})
