import { parseFlow, type Flow } from "@flowkit-io/core"

/** Regex codice fiscale italiano: 6 lettere, 2 cifre, 1 lettera, 2 cifre, 1 lettera, 3 cifre, 1 lettera. */
const CODICE_FISCALE_PATTERN = "^[A-Za-z]{6}[0-9]{2}[A-Za-z][0-9]{2}[A-Za-z][0-9]{3}[A-Za-z]$"

/** Regex telefono permissiva (formati italiani/internazionali comuni). */
const PHONE_PATTERN = "^[+]?[0-9\\s()-]{6,20}$"

const today = new Date().toISOString().slice(0, 10)

/**
 * Preset generico per la raccolta di dati anagrafici di una persona: nome, cognome,
 * data di nascita, luogo di nascita, codice fiscale, indirizzo, email, telefono e
 * consenso privacy. Pensato per essere riusato/personalizzato (es. dal builder di
 * FlowLab) componendo step già registrati in @flowkit-io/core, nessuna validazione
 * hardcoded nei componenti UI.
 */
export const anagraficaFlow: Flow = parseFlow({
  id: "anagrafica",
  title: "Dati anagrafici",
  steps: [
    {
      id: "intro",
      type: "intro",
      title: "I tuoi dati anagrafici",
      subtitle: "Ci vogliono un paio di minuti.",
      emoji: "🪪",
      cta: "Inizia →",
    },
    {
      id: "nome",
      type: "text",
      title: "Nome",
      icon: "🙋",
      variant: "text",
      placeholder: "Es. Mario",
    },
    {
      id: "cognome",
      type: "text",
      title: "Cognome",
      icon: "🙋",
      variant: "text",
      placeholder: "Es. Rossi",
    },
    {
      id: "data-di-nascita",
      type: "date-time",
      title: "Data di nascita",
      icon: "🎂",
      mode: "date",
      max: today,
    },
    {
      id: "luogo-di-nascita",
      type: "text",
      title: "Luogo di nascita",
      icon: "📍",
      variant: "text",
      placeholder: "Es. Milano (MI)",
    },
    {
      id: "codice-fiscale",
      type: "text",
      title: "Codice fiscale",
      icon: "🧾",
      variant: "text",
      placeholder: "Es. RSSMRA80A01F205X",
      pattern: CODICE_FISCALE_PATTERN,
    },
    {
      id: "indirizzo",
      type: "text",
      title: "Indirizzo di residenza",
      icon: "🏠",
      variant: "text",
      placeholder: "Via, numero civico, città",
    },
    {
      id: "email",
      type: "text",
      title: "Email",
      icon: "✉️",
      variant: "email",
      placeholder: "tuo@email.it",
    },
    {
      id: "telefono",
      type: "text",
      title: "Telefono",
      icon: "📞",
      variant: "text",
      placeholder: "Es. 333 1234567",
      pattern: PHONE_PATTERN,
    },
    {
      id: "consenso-privacy",
      type: "checkbox",
      title: "Privacy",
      icon: "🔒",
      label: "Ho letto e accetto l'informativa sulla privacy",
      description:
        "I tuoi dati saranno trattati esclusivamente per le finalità indicate nell'informativa privacy.",
    },
    {
      id: "review",
      type: "review",
      title: "Controlla i tuoi dati",
      subtitle: "Verifica che sia tutto corretto prima di inviare.",
    },
    {
      id: "confirmation",
      type: "confirmation",
      title: "Dati inviati!",
      message: "Grazie, abbiamo ricevuto i tuoi dati anagrafici.",
      primaryCta: "Torna alla home",
      secondaryCta: "Nuovo invio",
    },
  ],
})
