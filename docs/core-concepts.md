# Core concepts

| Concept | Lives in | What it is |
|---|---|---|
| `Flow` | `@flowkit-io/core` | zod-validated object: `{ id, title, locale, steps[] }` |
| `Step` | `@flowkit-io/core` | A "screen" of the flow; its `type` is resolved at runtime from a **registry** (see [Custom steps](./custom-steps.md)), not a closed union |
| `Answers` | `@flowkit-io/core` | `Record<stepId, value>`, the state filled in by the user |
| `Theme` | `@flowkit-io/themes` | `{ name, label, light, dark }`, each variant is a set of tokens (colors, spacing, fonts, images) |
| `FlowRunner` | `@flowkit-io/react` | React component that mounts a `Flow`, manages state/navigation/rendering |
| `FlowAdapter` | `@flowkit-io/adapters` | `{ submit, loadDraft, saveDraft }` interface for persisting answers (local/rest/supabase/notion) |

The typical flow: write a `Flow` with `parseFlow(...)`, pass it to `<FlowRunner>`
along with a `Theme` and an `onSubmit`, and once the user reaches the `review` step
and confirms, you receive `Answers` already validated according to each step's
`required` rules.

Back to the [docs index](./README.md).
