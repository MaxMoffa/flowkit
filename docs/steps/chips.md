# `chips`

Row of selectable pills (wraps onto multiple lines). Answer value: `string` or
`string[]` (`multiple: true`). Component: `ChipsStepView`.

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `multiple` | `boolean` | `true` | Single or multiple selection |
| `options` | `{ value, label }[]` | — (min 1, or use `dataSource`) | Options |
| `dataSource` | remote data source, see [Core concepts](../core-concepts.md#remote-datasource) | — | Fetch options from a remote API |

## Example

```ts
{ id: "duration", type: "chips", title: "How long have you noticed it?", multiple: false,
  options: [
    { value: "lt5", label: "< 5 min" }, { value: "5-30", label: "5–30 min" },
    { value: "gt30", label: "> 30 min" }, { value: "persistent", label: "Persistent" },
  ] }
```

[← All steps](./index.md)
