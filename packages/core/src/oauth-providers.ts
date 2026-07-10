/** Authorize URL noti per provider comuni. Nessun segreto, solo endpoint pubblici. */
export const knownOAuthProviders: Record<string, { authorizeUrl: string }> = {
  google: { authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth" },
  github: { authorizeUrl: "https://github.com/login/oauth/authorize" },
  facebook: { authorizeUrl: "https://www.facebook.com/v19.0/dialog/oauth" },
}
