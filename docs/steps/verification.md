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
| `enabled` | `boolean` | `true` | When `false`, the step always validates and never loads the provider's script/widget — keep the step in place across environments (e.g. disabled in dev/test) without maintaining two flow variants |
| `verifyToken` | `(token, provider) => Promise<boolean>` | — (required) | Must call your backend to verify the widget token server-side |

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
