# `multi-select`

Generic multi-selection (checklist), with min/max constraints. Answer value:
`string[]`. Component: `MultiSelectStepView`.

<StepPreview type="multi-select" />

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `options` | `{ value, label, description?, color? }[]` | — (min 1, or use `dataSource`) | Options |
| `min` | `number` | `0` | Minimum number of selections required |
| `max` | `number` | — | Maximum number of selections allowed |
| `dataSource` | remote data source, see [Core concepts](../core-concepts.md#remote-datasource) | — | Fetch options from a remote API |

`description` renders as helper text below the option label; `color` renders as a small
swatch dot. Both optional — omit them and options render as before.

## Example

```ts
{ id: "highlights", type: "multi-select", title: "What did you like most?", min: 0,
  options: [
    { value: "speed", label: "Speed", description: "Fast load times", color: "#46A171" },
    { value: "support", label: "Support" },
  ] }
```

[← All steps](./index.md) · See also [`radio`](./radio.md) for single selection
