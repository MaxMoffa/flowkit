# Defining a flow

A `Flow` is built with `parseFlow` (validates with zod and applies defaults):

```ts
import { parseFlow, type Flow } from "@flowkit-io/core"

export const myFlow: Flow = parseFlow({
  id: "my-flow",       // unique id, used by adapters to group answers
  title: "My flow", // title, e.g. shown in the playground's status bar
  locale: "it",          // optional, default "it"
  steps: [
    /* ... */
  ],
})
```

`parseFlow` throws a descriptive error if a `type` isn't registered, or a `ZodError` if
the config doesn't match the type's schema: always use it at build/flow-definition time
(not on arbitrary untrusted runtime input).

## Reference by step type

Moved to its own [step-by-step reference](./steps/index.md) — one page per step type
(config table + example), plus the fields common to every step and a by-category
index. Start there for "what does step X support".

Back to the [docs index](./README.md).
