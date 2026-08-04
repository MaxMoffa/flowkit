# `group`

Composes multiple steps into a single page, with no navigation of its own — it counts
as one normal flow step. Answer value: an aggregated object `{ [childId]: value }`
(children's answers stay nested under the group's id, not flattened into the top-level
`Answers`). The "Continue" button stays disabled until every gating child has a valid
answer. Component: `GroupStepView`.

<StepPreview type="group" />

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `layout` | `"stack" \| "columns"` | `"stack"` | `"stack"`: children stacked vertically. `"columns"`: side by side, wrapping on narrow screens (only takes effect with ≥2 children) |
| `steps` | `Step[]` | — (min 1) | Child steps, same syntax as flow-level `steps[]` |
| `requiredChildren` | `{ mode: "all" \| "any" \| "none", ids?: string[] }` | — | Conditional advancing. Unset: every child gates the group by its own `required` flag. Set: only children in `ids` gate it (all of them if omitted), replacing (not merging) their individual `required` flag — `"all"` requires every one, `"any"` at least one, `"none"` never blocks |

## Example

```ts
{ id: "quick-group", type: "group", title: "A couple of quick questions", layout: "stack",
  steps: [
    { id: "satisfaction", type: "scale", title: "How satisfied are you?", min: 1, max: 5 },
    { id: "liked", type: "chips", title: "What did you like?", multiple: true,
      options: [{ value: "speed", label: "Speed" }, { value: "ease", label: "Ease of use" }] },
  ] }
```

[← All steps](./index.md)
