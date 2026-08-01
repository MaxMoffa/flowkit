import type { Flow, Step } from "./schema"
import type { ValidationIssue } from "./registry"

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
    "validation.required": "Campo obbligatorio: compilalo per continuare.",
    "validation.invalidFormat": "Formato non valido: controlla come hai scritto il valore e riprova.",
    "validation.minLength": "Servono almeno {min} caratteri: aggiungine ancora {remaining}.",
    "validation.maxLength": "Massimo {max} caratteri: accorcia il testo di {excess}.",
    "validation.outOfRange": "Il valore deve essere tra {min} e {max}.",
    "validation.invalidDate": "Data non ammessa: scegline una tra {min} e {max}.",
    "validation.fileTooLarge": "Il file supera {max} MB: scegline uno più leggero.",
    "validation.invalidFileType": "Tipo di file non consentito: usa uno dei formati ammessi ({accepted}).",
    "validation.tooFewOptions": "Seleziona almeno {min} opzioni: ne mancano {remaining}.",
    "validation.tooManyOptions": "Puoi selezionare al massimo {max} opzioni: rimuovine {excess}.",
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
    "validation.required": "This field is required: fill it in to continue.",
    "validation.invalidFormat": "Invalid format: check how you entered the value and try again.",
    "validation.minLength": "At least {min} characters are required: add {remaining} more.",
    "validation.maxLength": "Maximum {max} characters: shorten the text by {excess}.",
    "validation.outOfRange": "The value must be between {min} and {max}.",
    "validation.invalidDate": "Date not allowed: pick one between {min} and {max}.",
    "validation.fileTooLarge": "The file exceeds {max} MB: pick a smaller one.",
    "validation.invalidFileType": "File type not allowed: use one of the accepted formats ({accepted}).",
    "validation.tooFewOptions": "Select at least {min} options: {remaining} more needed.",
    "validation.tooManyOptions": "You can select at most {max} options: remove {excess}.",
  },
}

/** Replaces `{key}` placeholders in `template` with `params[key]`, left as-is when the
 *  key is missing (belt-and-suspenders: every call site supplies exactly the params its
 *  rule declares, so a miss would mean a bug, not user input). */
export function formatMessage(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  )
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

/** Resolves a validation issue's user-facing message: the step's own per-field
 *  override (`step.validationMessages[rule]`) wins, then the flow's dictionary
 *  (`flow.texts["validation.<rule>"]`, resolved like any other `resolveText` key), then
 *  the shipped default for the rule — each a template resolved via `formatMessage`
 *  against the issue's `params`. */
export function resolveValidationMessage(flow: Flow, step: Step, issue: ValidationIssue): string {
  const perField = (step as { validationMessages?: Record<string, string> }).validationMessages?.[issue.rule]
  const template = perField ?? resolveText(flow, `validation.${issue.rule}`)
  return formatMessage(template, issue.params)
}
