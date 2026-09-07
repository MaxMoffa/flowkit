import type { Flow, Step, ContentText } from "./schema"
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
    submitWithPayment: "Completa pagamento e invia ✓",
    submitWithPaymentAmount: "Paga {amount} ✓",
    paymentTotal: "Totale",
    paymentFailed: "Pagamento non riuscito, riprova.",
    errorTitle: "Qualcosa è andato storto",
    errorGenericMessage: "Si è verificato un errore. Riprova.",
    errorRetry: "Riprova",
    errorChangePayment: "Cambia metodo di pagamento",
    errorEditStep: "Modifica",
    errorRestart: "Ricomincia",
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
    photoCapture: "Scatta foto",
    photoRetake: "Scatta un'altra foto",
    photoRequestingPermission: "Richiesta di accesso alla fotocamera…",
    photoPermissionDenied: "Accesso alla fotocamera negato. Puoi comunque scegliere una foto.",
    photoNoCamera: "Nessuna fotocamera disponibile. Puoi comunque scegliere una foto.",
    barcodeRequestingPermission: "Richiesta di accesso alla fotocamera…",
    barcodePermissionDenied: "Accesso alla fotocamera negato. Inserisci il codice manualmente.",
    barcodeNoCamera: "Nessuna fotocamera disponibile. Inserisci il codice manualmente.",
    barcodeScanning: "Inquadra il codice a barre o il QR code.",
    barcodeFound: "Codice trovato",
    barcodeLoadError: "Impossibile avviare la scansione. Inserisci il codice manualmente.",
    barcodeRescan: "Scansiona di nuovo",
    barcodeManualLabel: "Inserisci il codice manualmente",
    barcodeManualPlaceholder: "Codice",
    catalogAdd: "Aggiungi",
    catalogIncrease: "Aumenta la quantità",
    catalogDecrease: "Riduci la quantità",
    catalogRemove: "Rimuovi",
    catalogTotal: "Totale ordine",
    catalogEmpty: "Nessun articolo selezionato",
    catalogDetails: "vedi i dettagli",
    catalogClose: "Chiudi",
    cartOpen: "Carrello",
    addressCountry: "Paese",
    addressLine1: "Indirizzo",
    addressLine2: "Interno, scala… (facoltativo)",
    addressCity: "Città",
    addressPostalCode: "CAP",
    addressState: "Provincia (facoltativo)",
    taxLabel: "IVA",
    taxCalculating: "Calcolo delle imposte…",
    taxError: "Impossibile calcolare le imposte ora.",
    taxEstimated: "stima",
    taxInclusiveNote: "IVA inclusa",
    taxExclusiveNote: "+ IVA",
    orderSubtotal: "Subtotale",
    catalogEstimatedTotal: "Totale stimato",
    catalogFilters: "Filtri",
    catalogFilterEmpty: "Nessun prodotto per questo filtro.",
    otherOption: "Altro",
    otherOptionPlaceholder: "Specifica…",
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
    submitWithPayment: "Complete payment & submit ✓",
    submitWithPaymentAmount: "Pay {amount} ✓",
    paymentTotal: "Total",
    paymentFailed: "Payment failed, please try again.",
    errorTitle: "Something went wrong",
    errorGenericMessage: "An error occurred. Please try again.",
    errorRetry: "Try again",
    errorChangePayment: "Change payment method",
    errorEditStep: "Edit",
    errorRestart: "Start over",
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
    photoCapture: "Take a photo",
    photoRetake: "Take another photo",
    photoRequestingPermission: "Requesting camera access…",
    photoPermissionDenied: "Camera access denied. You can still choose a photo.",
    photoNoCamera: "No camera available. You can still choose a photo.",
    barcodeRequestingPermission: "Requesting camera access…",
    barcodeNoCamera: "No camera available. Enter the code manually.",
    barcodePermissionDenied: "Camera access denied. Enter the code manually.",
    barcodeScanning: "Point the camera at the barcode or QR code.",
    barcodeFound: "Code found",
    barcodeLoadError: "Couldn't start scanning. Enter the code manually.",
    barcodeRescan: "Scan again",
    barcodeManualLabel: "Enter the code manually",
    barcodeManualPlaceholder: "Code",
    catalogAdd: "Add",
    catalogIncrease: "Increase quantity",
    catalogDecrease: "Decrease quantity",
    catalogRemove: "Remove",
    catalogTotal: "Order total",
    catalogEmpty: "No items selected",
    catalogDetails: "see details",
    catalogClose: "Close",
    cartOpen: "Cart",
    addressCountry: "Country",
    addressLine1: "Address",
    addressLine2: "Apt, suite, unit (optional)",
    addressCity: "City",
    addressPostalCode: "Postal code",
    addressState: "State / province (optional)",
    taxLabel: "Tax",
    taxCalculating: "Calculating tax…",
    taxError: "Couldn't calculate tax right now.",
    taxEstimated: "estimate",
    taxInclusiveNote: "Tax included",
    taxExclusiveNote: "+ tax",
    orderSubtotal: "Subtotal",
    catalogEstimatedTotal: "Estimated total",
    catalogFilters: "Filters",
    catalogFilterEmpty: "No products for this filter.",
    otherOption: "Other",
    otherOptionPlaceholder: "Please specify…",
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

/**
 * Resolves a `ContentText` value (step title/subtitle, option label/description,
 * catalog/product item label/description/details) against the flow's own `content`
 * dictionary (`Flow.content` — a namespace separate from `flow.texts`, which is
 * reserved for the library's fixed system/chrome keys). A literal string resolves to
 * itself unchanged (default, zero-regression behavior). An object value resolves, in
 * order: `flow.content[value.key]`, else `value.fallback`, else the raw `value.key`
 * (so an unresolved key never renders as blank/undefined).
 */
export function resolveContentText(flow: Flow, value: ContentText): string {
  if (typeof value === "string") return value
  return flow.content?.[value.key] ?? value.fallback ?? value.key
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
