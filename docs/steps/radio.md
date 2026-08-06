# `radio`

Single-selection list, one option per row. Answer value: `string`. Component:
`RadioStepView`. Same list layout as `multi-select`, but a native
`<input type="radio">` instead of a checkbox.

<StepPreview type="radio" />

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `options` | `{ value, label, description?, color? }[]` | — (min 1, or use `dataSource`) | Options |
| `dataSource` | remote data source, see [Core concepts](../core-concepts.md#remote-datasource) | — | Fetch options from a remote API |

`description` renders as helper text below the option label; `color` renders as a small
swatch dot. Both optional — omit them and options render as before.

## Example

```ts
{ id: "contact-method", type: "radio", title: "How should we contact you?",
  options: [
    { value: "email", label: "Email", description: "We reply within 24h" },
    { value: "phone", label: "Phone" },
  ] }
```

[← All steps](./index.md) · See also [`multi-select`](./multi-select.md)
