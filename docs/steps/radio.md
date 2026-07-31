# `radio`

Single-selection list, one option per row. Answer value: `string`. Component:
`RadioStepView`. Same list layout as `multi-select`, but a native
`<input type="radio">` instead of a checkbox.

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `options` | `{ value, label }[]` | — (min 1, or use `dataSource`) | Options |
| `dataSource` | remote data source, see [Core concepts](../core-concepts.md#remote-datasource) | — | Fetch options from a remote API |

## Example

```ts
{ id: "contact-method", type: "radio", title: "How should we contact you?",
  options: [
    { value: "email", label: "Email" }, { value: "phone", label: "Phone" },
  ] }
```

[← All steps](./index.md) · See also [`multi-select`](./multi-select.md)
