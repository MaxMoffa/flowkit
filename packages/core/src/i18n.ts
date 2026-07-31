import type { Flow } from "./schema"

export type Locale = "it" | "en"

/**
 * Default chrome/navigation/validation/status text, keyed by the same string used in
 * `Flow.texts` for a per-flow override. "it" values match what was previously
 * hardcoded directly in the components (see DECISIONS.md v2.34) — the defaults here
 * are the current behavior, not new copy.
 */
export const defaultMessages: Record<Locale, Record<string, string>> = {
  it: {
    continue: "Continua",
    back: "Indietro",
    backAriaLabel: "Indietro",
    submit: "Invia segnalazione ✓",
    returnToReview: "Torna al riepilogo",
    confirmationRestart: "Nuova segnalazione",
    confirmationHome: "Torna alla home",
    required: "Campo obbligatorio",
    verificationCompleted: "Verifica completata",
    verificationLoadingWidget: "Carico il widget di verifica…",
    verificationLoadError: "Impossibile caricare il widget di verifica.",
    verificationInProgress: "Verifica in corso…",
    verificationFailedRetry: "Verifica non riuscita, riprova.",
    verificationErrorRetry: "Errore durante la verifica, riprova.",
    verificationWidgetError: "Errore del widget di verifica.",
    fileAddPlaceholder: "Aggiungi file",
    attachmentSuffix: "allegato/i",
  },
  en: {
    continue: "Continue",
    back: "Back",
    backAriaLabel: "Back",
    submit: "Submit ✓",
    returnToReview: "Back to review",
    confirmationRestart: "New submission",
    confirmationHome: "Back to home",
    required: "Required field",
    verificationCompleted: "Verification completed",
    verificationLoadingWidget: "Loading verification widget…",
    verificationLoadError: "Couldn't load the verification widget.",
    verificationInProgress: "Verifying…",
    verificationFailedRetry: "Verification failed, try again.",
    verificationErrorRetry: "Error during verification, try again.",
    verificationWidgetError: "Verification widget error.",
    fileAddPlaceholder: "Add file",
    attachmentSuffix: "attachment(s)",
  },
}

export function t(locale: Locale, key: string): string {
  return defaultMessages[locale]?.[key] ?? defaultMessages.it[key] ?? key
}

/**
 * Resolves a chrome/status text for a flow: an explicit `flow.texts` override wins,
 * else the dictionary entry for `flow.locale`, else the Italian default (the
 * dictionary's most complete locale), else the caller's own `fallback`, else the raw
 * key. `fallback` exists for call sites migrating a literal that isn't (yet) in
 * `defaultMessages` — every key actually used by the library ships a real default, so
 * in practice it's a belt-and-suspenders parameter.
 */
export function resolveText(flow: Flow, key: string, fallback?: string): string {
  return (
    flow.texts?.[key] ??
    defaultMessages[flow.locale as Locale]?.[key] ??
    defaultMessages.it[key] ??
    fallback ??
    key
  )
}
