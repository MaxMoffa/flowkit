# `confirmation`

Final screen, no header/progress bar; footer with a restart ("New report") and a
"Back to home" button — each can be hidden, and when both are hidden the footer bar is
dropped entirely. Must be the **last** step of every flow (`parseFlow` enforces
`role: "confirmation"` on the last step). Component: `ConfirmationStepView`.

<StepPreview type="confirmation" />

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `title` | `string` | `"Thank you!"` | — |
| `message` | `string` | — | Subtitle |
| `emoji` | `string` | — | Replaces the default checkmark icon |
| `stats` | `{ value, label }[]` | — | Rows of statistics in side-by-side boxes |
| `primaryCta` / `secondaryCta` | `string` | `"Back to home"` / `"New report"` | Footer button text (falls back to the `confirmationHome` / `confirmationRestart` i18n text) |
| `showHomeButton` | `boolean` | `true` | Show/hide the primary "Back to home" button |
| `showRestartButton` | `boolean` | `true` | Show/hide the secondary restart ("New report") button. With `showHomeButton` also `false`, no footer is rendered |
| `homeUrl` | `string` | — | When set, the primary button `window.location.href`-navigates instead of resetting the in-memory flow state |
| `emailShare` | object | — | Enables a "send answers via email" (`mailto:`) button |
| `resultActions` | object, see [Result actions](../result-actions.md) | — | `pdfExport`, `resultLink`, `nativeShare`, `emailApi` |

## Example

```ts
{ id: "confirmation", type: "confirmation", title: "Thank you!",
  message: "Your report has been recorded.",
  stats: [{ value: "35", label: "reports today nearby" }, { value: "#12", label: "yours today" }] }
```

[← All steps](./index.md)
