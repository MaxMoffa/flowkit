import { parseFlow, type Flow } from "@flowkit-io/core"

/** Demo for the "booking-slot" step (v2.31): two-level date/time picker, generated
 *  client-side from config, in a fixed flow timezone (not the browser's). */
export const bookingSlotDemoFlow: Flow = parseFlow({
  id: "booking-slot-demo",
  title: "Prenota uno slot",
  timezone: "Europe/Rome",
  steps: [
    {
      id: "welcome",
      type: "intro",
      title: "Prenota il tuo appuntamento",
      subtitle: "Scegli una data, poi un orario disponibile.",
      cta: "Inizia",
    },
    {
      id: "slot",
      type: "booking-slot",
      title: "Quando vuoi venire?",
      subtitle: "Orari dal lunedì al venerdì, ogni 30 minuti.",
      granularity: "30min",
      startDate: "2026-08-03",
      endDate: "2026-08-14",
      weeklyWindows: [
        { dayOfWeek: 1, start: "09:00", end: "12:30" },
        { dayOfWeek: 2, start: "09:00", end: "12:30" },
        { dayOfWeek: 3, start: "09:00", end: "12:30" },
        { dayOfWeek: 4, start: "09:00", end: "12:30" },
        { dayOfWeek: 5, start: "09:00", end: "12:30" },
      ],
      capacity: 4,
      limitedThreshold: 0.5,
      remainingOverrides: {
        "2026-08-03T09:00:00": 0,
        "2026-08-03T09:30:00": 1,
        "2026-08-03T10:00:00": 2,
      },
    },
    { id: "end", type: "confirmation", title: "Prenotazione confermata!", showHomeButton: false },
  ],
})
