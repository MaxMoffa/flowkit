# `chips`

Row of selectable pills (wraps onto multiple lines). Answer value: `string` or
`string[]` (`multiple: true`). Component: `ChipsStepView`.

<StepPreview type="chips" />

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `multiple` | `boolean` | `true` | Single or multiple selection |
| `options` | `{ value, label, description?, color? }[]` | — (min 1, or use `dataSource`) | Options |
| `dataSource` | remote data source, see [Core concepts](../core-concepts.md#remote-datasource) | — | Fetch options from a remote API |

`description` grows the chip from a compact pill into a small column card to fit the
extra line; `color` renders as a small swatch dot. Both optional — omit them and chips
render as the compact pill as before.

## Example

```ts
{ id: "duration", type: "chips", title: "How long have you noticed it?", multiple: false,
  options: [
    { value: "lt5", label: "< 5 min" }, { value: "5-30", label: "5–30 min" },
    { value: "gt30", label: "> 30 min" }, { value: "persistent", label: "Persistent", description: "More than a day" },
  ] }
```

[← All steps](./index.md)
