# `date-time`

Native browser date/time input. Answer value: `string` in the matching `<input>`'s
format (`YYYY-MM-DD`, `HH:mm` or `YYYY-MM-DDTHH:mm`). Component: `DateTimeStepView`.

<StepPreview type="date-time" />

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `mode` | `"date" \| "time" \| "datetime"` | `"date"` | Selects the native `<input>` type |
| `min` / `max` | `string` | — | Bounds, same format as the value |
| `step` | `number` | — | The input's `step` attribute |
| `disablePast` | `boolean` | `false` | If `true` and `min` isn't set, computes `min` = now |
| `defaultValue` | `string` | — | Initial value if not yet answered |

## Example

```ts
{ id: "date-time", type: "date-time", title: "When?", mode: "datetime", disablePast: true }
```

Need available-slot picking instead of a raw date/time input? See
[`booking-slot`](./booking-slot.md).

[← All steps](./index.md)
