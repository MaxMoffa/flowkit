# `signature`

Signature drawn with finger, mouse or stylus on a canvas (Pointer Events, unified
handler for all input types). Answer value: a `data:image/png;base64,...` data URI —
valid as soon as the value starts with `data:image/`. Component: `SignatureStepView`.

<StepPreview type="signature" />

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `padHeight` | `number` | `220` | Height in px of the inline (non-fullscreen) pad |
| `penColor` | `string` | `"#2C2C2B"` | Stroke color |
| `backgroundColor` | `string` | `"#FFFFFF"` | Pad background |
| `showClear` | `boolean` | `true` | Shows the "clear" button |
| `showUndo` | `boolean` | `true` | Shows the "undo last stroke" button (snapshot-stack model, one entry per stroke) |

Also offers a fullscreen toggle for a larger drawing surface on small screens.

## Example

```ts
{ id: "signature", type: "signature", title: "Sign here",
  subtitle: "Draw your signature in the box.", padHeight: 260 }
```

[← All steps](./index.md)
