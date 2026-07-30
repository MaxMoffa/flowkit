import { useEffect, useState } from "react"
import { listBookingSlotDates, listBookingSlotsForDate } from "@flowkit-io/core"
import type { AnswerValue, BookingSlot, BookingSlotStep, BookingSlotValue } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { FlowMarkdown } from "../markdown"

const WEEKDAY_LABELS_IT = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"]

/** Weekday of a "YYYY-MM-DD" string, computed the same UTC-anchored way as core's
 *  booking-slot-step.ts: pure calendar math, not tied to the browser's own timezone. */
function dayOfWeek(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay()
}

function formatDateLabel(date: string): string {
  const [, month, day] = date.split("-")
  return `${WEEKDAY_LABELS_IT[dayOfWeek(date)]} ${day}/${month}`
}

const STATUS_LABEL: Record<BookingSlot["status"], string> = {
  available: "Disponibile",
  limited: "Pochi posti",
  full: "Esaurito",
}

export function BookingSlotStepView({ step, value, onChange, flow }: StepComponentProps<BookingSlotStep>) {
  const currentValue = value as BookingSlotValue | null
  const dates = listBookingSlotDates(step)
  const [selectedDate, setSelectedDate] = useState<string | null>(
    () => currentValue?.start.slice(0, 10) ?? dates[0] ?? null,
  )

  useEffect(() => {
    if (selectedDate === null && dates.length > 0) setSelectedDate(dates[0]!)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only seed the initial selection, never overwrite a user pick
  }, [dates])

  const slots = selectedDate ? listBookingSlotsForDate(step, selectedDate) : []

  function pick(slot: BookingSlot) {
    if (slot.status === "full") return
    const nextValue: BookingSlotValue = {
      start: slot.start,
      durationMinutes: slot.durationMinutes,
      timezone: flow.timezone,
    }
    // AnswerValue's Record<string, unknown> branch needs an explicit index signature;
    // BookingSlotValue is a plain interface, same double-cast pattern as UploadedItem[].
    onChange(nextValue as unknown as AnswerValue)
  }

  return (
    <div className="fk-step fk-step-booking-slot">
      {step.title && <h2 className="fk-title"><FlowMarkdown text={step.title} variant="inline" /></h2>}
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}

      {dates.length === 0 ? (
        <p className="fk-remote-status">Nessuna data disponibile.</p>
      ) : (
        <div className="fk-booking-dates" role="tablist" aria-label="Data">
          {dates.map((date) => (
            <button
              key={date}
              type="button"
              role="tab"
              aria-selected={selectedDate === date}
              className={`fk-booking-date${selectedDate === date ? " fk-booking-date-selected" : ""}`}
              onClick={() => setSelectedDate(date)}
            >
              {formatDateLabel(date)}
            </button>
          ))}
        </div>
      )}

      {selectedDate && (
        <div className="fk-booking-slots">
          {slots.map((slot) => {
            const isSelected = currentValue?.start === slot.start
            return (
              <button
                key={slot.start}
                type="button"
                aria-pressed={isSelected}
                className={`fk-booking-slot-btn fk-booking-slot-${slot.status}${isSelected ? " fk-booking-slot-selected" : ""}`}
                onClick={() => pick(slot)}
                disabled={slot.status === "full"}
              >
                <span className="fk-booking-slot-time">{slot.time ?? "Giornata intera"}</span>
                <span className="fk-booking-slot-status">{STATUS_LABEL[slot.status]}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
