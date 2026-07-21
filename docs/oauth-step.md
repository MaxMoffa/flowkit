# OAuth step

Step of type `oauth`: shows a button for each enabled provider, which on click does a
**full redirect** to the provider's authorize URL (PKCE included where required). The
library **never performs the code→token exchange**: it only builds the redirect URL;
completing the OAuth flow (parsing the redirect URI, calling the token endpoint) is the
host app's responsibility.

```ts
{
  id: "login",
  type: "oauth",
  title: "Sign in to continue",
  required: false,
  providers: [
    {
      id: "google",              // "google" | "github" | "facebook" | custom id
      clientId: "YOUR_CLIENT_ID",
      redirectUri: "https://your-domain.com/oauth/callback",
      scopes: ["profile", "email"],
      usePkce: true,              // default true, generates code_verifier/code_challenge via Web Crypto
      icon: "🔵",                  // optional: overrides the provider's default emoji
    },
    {
      id: "generic",               // unknown provider: authorizeUrl required
      clientId: "...",
      authorizeUrl: "https://custom-provider.example.com/oauth/authorize",
      redirectUri: "https://your-domain.com/oauth/callback",
    },
  ],
  allowAnonymous: true,           // shows a button to proceed without authenticating
  anonymousLabel: "Continue without an account",
}
```

Known providers with a preset authorize URL: `google`, `github`, `facebook` (public
URLs only, no secrets). For a provider not listed, use `id: "generic"` (or an id of
your choice) with an explicit `authorizeUrl`. Every provider can have a custom `icon`
(emoji): if absent, the known default is used, then the generic lock emoji 🔐.

If `allowAnonymous: true`, an extra button lets the user proceed without
authenticating: the step's value becomes `{ providerId: "", anonymous: true }`, a state
distinct both from "not answered" (`null`) and from a real connection.

**Completing the login** after the redirect, on the host app side:

```ts
import { completeOAuthCallback } from "@flowkit-io/core"

// on the return page (redirectUri), reading the query string or hash:
const result = completeOAuthCallback("google", window.location.search)
// result: { providerId, code?, token?, state? }

// then, your choice:
// 1) exchange `code` for a token on your backend (never in the browser: would require the client secret)
// 2) pass `result` as the oauth step's value (e.g. via FlowRunner's onChange,
//    resuming the flow state where you left it before the redirect)
```

`generatePkcePair()`/`buildAuthorizeUrl(provider, pkce?)` are exported from
`@flowkit-io/core` if you need to build the URL manually outside the step.

Back to the [docs index](./README.md).
