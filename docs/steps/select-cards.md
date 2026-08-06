# `select-cards`

2-column grid of selectable cards (emoji + label + optional description). Answer
value: `string` (single) or `string[]` (`multiple: true`). Component:
`SelectCardsStepView`.

<StepPreview type="select-cards" />

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `multiple` | `boolean` | `false` | Single or multiple selection |
| `options` | `{ value, label, emoji?, description?, color? }[]` | — (min 1, or use `dataSource`) | Grid options |
| `dataSource` | remote data source, see [Core concepts](../core-concepts.md#remote-datasource) | — | Fetch options from a remote API instead of/alongside static `options` |

`color` renders as a small swatch dot next to the emoji/label. Optional — omit it and
cards render as before.

Validation: if `multiple`, requires at least one item selected; otherwise a non-empty
string.

## Example

```ts
{ id: "smell-type", type: "select-cards", title: "What type of smell?", multiple: false,
  options: [
    { value: "sewage", label: "Sewage", emoji: "🥚", description: "Rotten eggs, sulfur" },
    { value: "chemical", label: "Chemical", emoji: "🧪", description: "Solvents, paint" },
  ] }
```

[← All steps](./index.md)
