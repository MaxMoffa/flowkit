# `multi-select`

Generic multi-selection (checklist), with min/max constraints. Answer value:
`string[]`. Component: `MultiSelectStepView`.

<StepPreview type="multi-select" />

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `options` | `{ value, label }[]` | — (min 1, or use `dataSource`) | Options |
| `min` | `number` | `0` | Minimum number of selections required |
| `max` | `number` | — | Maximum number of selections allowed |
| `dataSource` | remote data source, see [Core concepts](../core-concepts.md#remote-datasource) | — | Fetch options from a remote API |

## Example

```ts
{ id: "highlights", type: "multi-select", title: "What did you like most?", min: 0,
  options: [
    { value: "speed", label: "Speed" }, { value: "support", label: "Support" },
  ] }
```

[← All steps](./index.md) · See also [`radio`](./radio.md) for single selection
