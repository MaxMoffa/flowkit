# `text`

Free text/number/email input. Answer value: `string`. Component: `TextStepView`.

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `variant` | `"text" \| "number" \| "email"` | `"text"` | Changes validation: `"email"` requires a valid email format, `"number"` requires `Number(...)`-convertibility |
| `placeholder` | `string` | — | Input placeholder |
| `multiline` | `boolean` | `false` | (reserved for future textarea use) |
| `pattern` | `string` | — | Regex (as a string, no flags) the value must fully match, in addition to `variant`'s own rule — e.g. a fiscal code or phone number format |
| `addons` | `StepAddon[]` | — | SmartFill auto-suggest add-ons, see [Core concepts](../core-concepts.md#smartfill) |

## Example

```ts
{ id: "email", type: "text", title: "Want us to follow up?", required: false,
  variant: "email", placeholder: "name@example.com" }
```

[← All steps](./index.md)
