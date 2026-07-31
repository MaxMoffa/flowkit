# `faces`

Row of selectable emoji faces (hedonic scale); wraps onto a new row on narrow screens
instead of shrinking. Answer value: `string`. Component: `FacesStepView`.

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `faces` | `{ value, emoji, label? }[]` | 5 standard faces (😞🙁😐🙂😄) | If `label` is absent, only the emoji is shown |

Behavior: the middle face in the array auto-selects on mount.

## Example

```ts
{ id: "hedonic", type: "faces", title: "How annoying is it?", required: false,
  faces: [
    { value: "1", emoji: "😊" }, { value: "2", emoji: "😐" }, { value: "3", emoji: "😕" },
    { value: "4", emoji: "🤢" }, { value: "5", emoji: "🤮" },
  ] }
```

[← All steps](./index.md)
