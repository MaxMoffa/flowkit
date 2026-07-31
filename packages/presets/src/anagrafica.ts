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
      key: "i_tuoi_dati_anagrafici",
      title: "I tuoi dati anagrafici",
      subtitle: "Ci vogliono un paio di minuti.",
      image: { kind: "emoji", value: "🪪" },
      cta: "Inizia →",
    },
    {
      id: "nome",
      type: "text",
      key: "nome",
      title: "Nome",
      subtitle: "Come riportato su un documento d'identità valido.",
      image: { kind: "emoji", value: "🙋" },
      variant: "text",
      placeholder: "Es. Mario",
    },
    {
      id: "cognome",
      type: "text",
      key: "cognome",
      title: "Cognome",
      subtitle: "Come riportato su un documento d'identità valido.",
      image: { kind: "emoji", value: "🙋" },
      variant: "text",
      placeholder: "Es. Rossi",
    },
    {
      id: "data-di-nascita",
      type: "date-time",
      key: "data_di_nascita",
      title: "Data di nascita",
      subtitle: "Seleziona la data indicata sul tuo documento.",
      image: { kind: "emoji", value: "🎂" },
      mode: "date",
      max: today,
    },
    {
      id: "luogo-di-nascita",
      type: "text",
      key: "luogo_di_nascita",
      title: "Luogo di nascita",
      subtitle: "Comune (e provincia) in cui sei nato/a.",
      image: { kind: "emoji", value: "📍" },
      variant: "text",
      placeholder: "Es. Milano (MI)",
    },
    {
      id: "codice-fiscale",
      type: "text",
      key: "codice_fiscale",
      title: "Codice fiscale",
      subtitle: "16 caratteri alfanumerici, senza spazi.",
      image: { kind: "emoji", value: "🧾" },
      variant: "text",
      placeholder: "Es. RSSMRA80A01F205X",
      pattern: CODICE_FISCALE_PATTERN,
    },
    {
      id: "indirizzo",
      type: "text",
      key: "indirizzo_di_residenza",
      title: "Indirizzo di residenza",
      subtitle: "Via, numero civico, città e CAP.",
      image: { kind: "emoji", value: "🏠" },
      variant: "text",
      placeholder: "Via, numero civico, città",
    },
    {
      id: "email",
      type: "text",
      key: "email",
      title: "Email",
      subtitle: "La useremo solo per contattarti riguardo a questa richiesta.",
      image: { kind: "emoji", value: "✉️" },
      variant: "email",
      placeholder: "tuo@email.it",
    },
    {
      id: "telefono",
      type: "text",
      key: "telefono",
      title: "Telefono",
      subtitle: "Un numero a cui possiamo raggiungerti in caso di necessità.",
      image: { kind: "emoji", value: "📞" },
      variant: "text",
      placeholder: "Es. 333 1234567",
      pattern: PHONE_PATTERN,
    },
    {
      id: "consenso-privacy",
      type: "checkbox",
      key: "privacy",
      title: "Privacy",
      image: { kind: "emoji", value: "🔒" },
      label: "Confermo che i dati sono corretti",
      description:
        "I tuoi dati saranno trattati esclusivamente per le finalità indicate nell'informativa privacy.",
    },
    {
      id: "review",
      type: "review",
      key: "controlla_i_tuoi_dati",
      title: "Controlla i tuoi dati",
      subtitle: "Verifica che sia tutto corretto prima di inviare.",
    },
    {
      id: "confirmation",
      type: "confirmation",
      key: "dati_inviati",
      title: "Dati inviati!",
      message: "Grazie, abbiamo ricevuto i tuoi dati anagrafici.",
      primaryCta: "Torna alla home",
      secondaryCta: "Nuovo invio",
    },
  ],
})
