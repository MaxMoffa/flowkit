export type Locale = "it" | "en"

export const defaultMessages: Record<Locale, Record<string, string>> = {
  it: {
    next: "Avanti",
    back: "Indietro",
    submit: "Invia",
    required: "Campo obbligatorio",
  },
  en: {
    next: "Next",
    back: "Back",
    submit: "Submit",
    required: "Required field",
  },
}

export function t(locale: Locale, key: string): string {
  return defaultMessages[locale]?.[key] ?? defaultMessages.it[key] ?? key
}
