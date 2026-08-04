# `intro`

Initial "hero" screen, no header/progress bar. Component: `IntroStepView`.

<StepPreview type="intro" />

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `image` | `{kind,value}` | — | The base [`image`](./index.md#the-image-field) field, rendered in a rounded badge above the title (any of the 3 kinds) |
| `cta` | `string` | `"Start"` | Primary button text in the footer |
| `livePill` | `string` | — | If present, shows a pill with an animated green dot above the badge (e.g. "34 reports today nearby") |

Must be the **first** step of every flow — `parseFlow` enforces that the first step's
registered type carries `role: "intro"` (see [Core concepts](../core-concepts.md)). For
the same title/subtitle/image structure at any other position in the flow, repeatable,
see [`info`](./info.md).

## Example

```ts
{ id: "intro", type: "intro", title: "What's in the air?", subtitle: "Report it in 30 seconds.",
  image: { kind: "emoji", value: "👃" }, cta: "Report a smell →", livePill: "34 reports today nearby" }
```

[← All steps](./index.md)
