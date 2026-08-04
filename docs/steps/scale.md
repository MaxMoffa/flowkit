# `scale`

Numeric rating over a range. Answer value: `number`. Component: `ScaleStepView`. Two
visual variants.

<StepPreview type="scale" />

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `min` / `max` | `number` | `1` / `5` | Range bounds (inclusive) |
| `minLabel` / `maxLabel` | `string` | — | Labels at the extremes |
| `variant` | `"pills" \| "slider"` | `"pills"` | `"pills"`: row of numbered buttons. `"slider"`: `input[type=range]` with a large number and colored label, auto-initialized to the middle value `(min+max)/2` on mount |
| `valueLabels` | `string[]` | — | (`slider` only) text label per value, indexed `0..max-min` |
| `valueColors` | `string[]` | — | (`slider` only) CSS color per value, same indexing; default green→orange→red palette if absent |

## Example

```ts
// slider variant (e.g. smell intensity, 0-6)
{ id: "intensity", type: "scale", title: "How strong is it?", variant: "slider",
  min: 0, max: 6, minLabel: "0 · None", maxLabel: "6 · Extreme",
  valueLabels: ["None", "Very faint", "Faint", "Noticeable", "Strong", "Very strong", "Extreme"],
  valueColors: ["#7D7A75", "#46A171", "#46A171", "#D5803B", "#D5803B", "#E56458", "#E56458"] }

// pills variant (e.g. overall rating 1-5)
{ id: "rating", type: "scale", title: "Overall rating", min: 1, max: 5,
  minLabel: "Poor", maxLabel: "Excellent" }
```

[← All steps](./index.md)
