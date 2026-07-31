# `verification`

Blocks advancement until a human-verification widget (Cloudflare Turnstile or Google
reCAPTCHA) succeeds. Component: `VerificationStepView`.

Not registered by the main entry point — the provider's script is only loaded if you
import it:

```ts
import "@flowkit-io/react/verification"
```

The component never checks the secret key itself (would require it client-side).
`verifyToken` is your callback: it must call **your** backend, which holds the
provider's secret key and calls Cloudflare's/Google's siteverify endpoint, resolving
`true` only on real success.

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `provider` | `"turnstile" \| "recaptcha"` | — (required) | Which widget to render |
| `siteKey` | `string` | — (required) | Public site key. Never a secret key |
| `enabled` | `boolean` | `true` | When `false`, the step always validates and never loads the provider's script/widget, showing no UI beyond title/subtitle — keep the step in place across environments (e.g. disabled in dev/test) without maintaining two flow variants |
| `previewVerified` | `boolean` | `false` | When `true`, skips the widget entirely and renders the same "Verifica completata ✅" success state a real pass would — no script load, no `verifyToken` call, no API usage. For previewing/demoing the step's full UI without spending a real challenge. Ignored if `enabled` is `false` |
| `verifyToken` | `(token, provider) => Promise<boolean>` | — (required) | Must call your backend to verify the widget token server-side |

`enabled: false` and `previewVerified: true` both make the step always valid, but they
render differently: `enabled: false` shows nothing beyond the title (the step is
effectively hidden/disabled), `previewVerified: true` shows the full success UI (the
step still "exists", it just always looks passed).

Answer value: `{ verified: boolean, token?: string, provider }`.

## Example

```ts
{ id: "captcha", type: "verification", title: "Quick check",
  provider: "turnstile", siteKey: "0x4AAA…",
  verifyToken: (token) =>
    fetch("/api/verify-turnstile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    }).then((r) => r.json()).then((r) => r.success === true) }
```

[← All steps](./index.md)
