# `file`

Generic file upload (any type), multi-item by default. Answer value: `UploadedItem[]`
(`{ id, name, mimeType, size, dataUrl, kind: "file" }`). Component: `FileStepView`.

<StepPreview type="file" />

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `placeholder` | `string` | `"Add file"` | Label of the picker button |
| `multiple` | `boolean` | `true` | Allow selecting more than one file at a time |
| `formatPreset` | `"any" \| "images" \| "documents" \| "pdf" \| "spreadsheets" \| "archives"` | `"any"` | Standard accepted-format preset |
| `customAccept` | `string` | — | Free-form `accept` string (e.g. `".csv,.zip"`), combined with `formatPreset` |
| `maxItems` | `number` | — (no limit) | Maximum number of files |

Selected files show as a horizontally-scrolling chip row (icon by category + name +
size); each opens a preview (name, size, type, open/download link) on click.

## Example

```ts
{ id: "attachment", type: "file", title: "Attach a document", required: false,
  formatPreset: "documents", customAccept: ".pdf", multiple: true }
```

Use `media` for photos/videos and `file` for everything else — both share the same
`UploadedItem[]` shape, so review/report/export code handles them identically.

[← All steps](./index.md) · See also [`media`](./media.md)
