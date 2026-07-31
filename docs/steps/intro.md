# `intro`

Initial "hero" screen, no header/progress bar. Component: `IntroStepView`.

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `emoji` | `string` | — | Emoji shown in a rounded badge above the title |
| `cta` | `string` | `"Start"` | Primary button text in the footer |
| `livePill` | `string` | — | If present, shows a pill with an animated green dot above the badge (e.g. "34 reports today nearby") |

Must be the **first** step of every flow — `parseFlow` enforces that the first step's
registered type carries `role: "intro"` (see [Core concepts](../core-concepts.md)).

## Example

```ts
{ id: "intro", type: "intro", title: "What's in the air?", subtitle: "Report it in 30 seconds.",
  emoji: "👃", cta: "Report a smell →", livePill: "34 reports today nearby" }
```

[← All steps](./index.md)
