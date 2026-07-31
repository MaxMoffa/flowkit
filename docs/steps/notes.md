# `notes`

Free-form textarea. Answer value: `string`. Component: `NotesStepView`.

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `placeholder` | `string` | `"Write here..."` | Textarea placeholder |

## Example

```ts
{ id: "notes", type: "notes", title: "Anything to add?", required: false,
  placeholder: "E.g. the smell gets stronger with a north wind…" }
```

Pair it with [`media`](./media.md) on one page via [`group`](./group.md) — this is what
the old `notes-photo` step used to be, before it was split in two.

[← All steps](./index.md)
