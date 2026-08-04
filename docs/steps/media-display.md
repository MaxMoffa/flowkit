# `media-display`

Read-only image/video shown before/during a question (e.g. "what do you think of
this?"). Distinct from [`media`](./media.md): no file picker, no `UploadedItem[]`
answer, just a configured source to render. Collects no answer — `required` defaults
to `false` (overriding the usual `true`). Component: `MediaDisplayStepView`.

<StepPreview type="media-display" />

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `kind` | `"image" \| "video"` | `"image"` | Media type |
| `src` | `string` | — (required) | Primary source URL |
| `sources` | `{ src, type?, media? }[]` | — | Additional responsive sources: `<source>` children for video, or extra `srcSet` candidates for image |
| `poster` | `string` | — | Poster frame shown before playback (video only) |
| `alt` | `string` | — | Alt text (image) |
| `caption` | `string` | — | Caption shown under the media |
| `autoplay` | `boolean` | `false` | Video only. Requires `muted: true` (browser autoplay policy — schema rejects the combination otherwise) |
| `loop` / `muted` / `controls` | `boolean` | `false` / `false` / `true` | Video playback options |
| `aspectRatio` | `string` | — (intrinsic size) | CSS `aspect-ratio`, e.g. `"16/9"` |
| `fit` | `"cover" \| "contain" \| "fill"` | `"cover"` | `object-fit` |

## Example

```ts
{ id: "preview", type: "media-display", title: "Here's what we mean",
  kind: "video", src: "/clips/example.mp4", poster: "/clips/example-poster.jpg",
  autoplay: true, muted: true, loop: true, aspectRatio: "16/9" }
```

[← All steps](./index.md)
