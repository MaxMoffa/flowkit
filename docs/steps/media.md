# `media`

Image and/or video capture/upload, multi-item by default. Answer value:
`UploadedItem[]` (`{ id, name, mimeType, size, dataUrl, kind: "image" | "video" }`, each
`dataUrl` read client-side via `FileReader`). Component: `MediaStepView`.

<StepPreview type="media" />

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `placeholder` | `string` | `"Choose from library"` | Label of the library-picker button |
| `multiple` | `boolean` | `true` | Allow selecting/capturing more than one item at a time |
| `acceptImages` | `boolean` | `true` | Accept image files |
| `acceptVideos` | `boolean` | `false` | Accept video files |
| `imageFormats` | `string[]` | — (any image) | Restrict accepted image MIME types/extensions |
| `videoFormats` | `string[]` | — (any video) | Restrict accepted video MIME types/extensions |
| `maxItems` | `number` | — (no limit) | Maximum number of items |

Renders two controls: a **camera capture** button (`capture="environment"`, its own
file input, shown only on mobile devices that report a camera — see
[`use-media-capture-availability`](../core-concepts.md)) and a **library** picker
(always shown). Selected items show as a horizontally-scrolling thumbnail row; each
opens a full-featured viewer on click — swipe/arrow/keyboard navigation, pinch/click
zoom, drag-to-pan, and a confirmed delete.

## Example

```ts
{ id: "photo", type: "media", title: "Add a photo", required: false }

// accept both photos and short videos, up to 4 items:
{ id: "evidence", type: "media", acceptImages: true, acceptVideos: true, maxItems: 4 }
```

To combine a text field with a media step on one page, use [`group`](./group.md):

```ts
{ id: "notes-photo-group", type: "group", title: "Anything to add?", required: false,
  steps: [
    { id: "notes", type: "notes", required: false },
    { id: "photo", type: "media", required: false },
  ] }
```

[← All steps](./index.md) · See also [`file`](./file.md), [`media-display`](./media-display.md)
