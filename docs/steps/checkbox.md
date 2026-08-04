# `checkbox`

Single boolean toggle (e.g. privacy consent). Answer value: `boolean`. Component:
`CheckboxStepView`. The "must be accepted to proceed" gate comes from the standard
`required` field (default `true`): when not `false`, the step only validates once the
box is checked.

<StepPreview type="checkbox" />

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `label` | `string` | — (min 1) | Text shown next to the box |
| `description` | `string` | — | Optional extended text/notice below the box |

## Example

```ts
{ id: "consenso-privacy", type: "checkbox", title: "Privacy",
  label: "Confermo che i dati sono corretti",
  description: "I tuoi dati saranno trattati secondo l'informativa privacy." }
```

[← All steps](./index.md)
