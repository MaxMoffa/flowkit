# `branch`

Invisible step: never rendered to the user. `FlowRunner` resolves it (evaluating
`rules` against the answers collected so far) and jumps straight to the resolved
target step, before the browser ever paints the branch step's own chrome. Enables
conditional navigation — if/else, forward skips, excluding steps that don't apply —
without any dedicated navigation UI of its own.

Adds no field to the flow and no value to collected data (`includeInSummary: false`,
`role: "logic"`). A step skipped over by a branch is never visited, so it never
appears in the answers object, the review/summary, or a PDF/print export — and the
Back button, after a branch, returns to the step the flow was actually on before the
jump (not to whichever step the jump skipped).

The same holds *retroactively*: when the user edits the answer that drove a branch (via
Back, or via a review row) and the branch now points elsewhere, the steps that dropped
off the route leave the collected answers, the review/summary and the Back path with
it, and continuing walks the newly opened route — which has never been answered —
instead of returning straight to the review.

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `rules` | `BranchRule[]` | `[]` | Evaluated in order; the first matching rule wins |
| `fallback` | `string` (step `id`) | — | Used when no rule matches; if unset, falls through to the natural next step in `steps[]` |

`BranchRule` = `{ when: Condition, goTo: string }` — `goTo` is a step **`id`** (the
same target namespace as a clickable review row / `goToStep`), not a `key`.

A branch may target another branch: the chain is followed through in one move, to the
first step that can actually be rendered. Nothing validates target ids at parse time,
so a `goTo`/`fallback` naming a step that doesn't exist is ignored (the flow falls
through to the next candidate, ultimately to the natural next step), and branches that
loop back onto each other resolve to the nearest renderable step instead of hanging —
a config typo degrades the routing, it never breaks navigation.

## Condition syntax

A condition is JSON-safe data, not code — no `eval`, so a flow config from an
untrusted source can't run arbitrary logic.

```ts
type Condition =
  | { all: Condition[] }   // AND
  | { any: Condition[] }   // OR
  | { not: Condition }
  | { key: string; op: Op; value?: unknown }

type Op = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "notIn" | "contains" | "truthy" | "falsy"
```

`key` references another step's resolved **[`key`](./index.md)** field (not `id`) —
conditions read the same `Answers` object the flow collects, which is keyed by
`key`. `gt`/`gte`/`lt`/`lte` require both the answer and `value` to actually be
numbers, else the condition is `false`. `in`/`notIn`/`contains` expect `value`/the
answer (respectively) to be an array.

## Example

```ts
{
  id: "router", type: "branch",
  rules: [{ when: { key: "has_pet", op: "eq", value: "no" }, goTo: "review" }],
  // no `fallback`: falls through to the natural next step ("pet-name") otherwise
}
```

[← All steps](./index.md)
