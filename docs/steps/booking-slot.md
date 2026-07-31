# `booking-slot`

Two-level date/time slot picker, distinct from [`date-time`](./date-time.md): pick a
date, then pick one of that date's available time slots, each showing its own
availability (available/limited/full). All slots are generated client-side, pure
calendar-string arithmetic (UTC-anchored `Date` math used only for day-of-week/day
addition — the host's local timezone/DST never leaks in). Component:
`BookingSlotStepView`.

Reads `Flow.timezone` (default `"UTC"`) — a flow-level field, not per-step — and stamps
it onto the answer so consumers know which zone the wall-clock string refers to.

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `granularity` | `"15min" \| "30min" \| "60min" \| "daily"` | `"30min"` | Slot length. `"daily"` collapses the time level to a single "whole day" item |
| `startDate` / `endDate` | `string` (`YYYY-MM-DD`) | — (required) | Inclusive date range shown, interpreted in the flow's timezone |
| `weeklyWindows` | `{ dayOfWeek: 0-6, start?: "HH:mm", end?: "HH:mm" }[]` | — (min 1) | Active windows per weekday (0=Sunday); a weekday with no entry has no slots at all |
| `capacity` | `number` | `1` | Total capacity for every generated slot, unless overridden |
| `remainingOverrides` | `Record<slotStart, number>` | — | Static seed of remaining-spots overrides, keyed by the slot's `start` value. No live backend in this version — wire it to a real source once one exists |
| `limitedThreshold` | `number` (0–1) | `0.34` | A slot at or below this remaining/capacity fraction (and > 0) renders "limited" instead of "available" |

Answer value: `{ start, durationMinutes, timezone }` — a self-describing local
wall-clock datetime, not a bare ambiguous string.

## Example

```ts
{ id: "slot", type: "booking-slot", title: "Choose a time", granularity: "30min",
  startDate: "2026-08-01", endDate: "2026-08-14",
  weeklyWindows: [
    { dayOfWeek: 1, start: "09:00", end: "18:00" },
    { dayOfWeek: 2, start: "09:00", end: "18:00" },
  ],
  capacity: 3, limitedThreshold: 0.34 }
```

[← All steps](./index.md)
