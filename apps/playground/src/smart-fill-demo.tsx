import { parseFlow, type Flow } from "@flowkit-io/core"

/**
 * Demo for the "smartFill" step add-on (v2.29): the "codiceFiscale" generator suggests
 * a value for the text step from nome/cognome/data-di-nascita/luogo-di-nascita/sesso
 * answered earlier in the flow. "luogo-di-nascita" must resolve to the comune's Belfiore
 * cadastral code (see core/smart-fill-generators.ts) — modeled here as a select-cards
 * step whose option `value` already is that code, for a handful of well-known cities.
 */
export const smartFillDemoFlow: Flow = parseFlow({
  id: "smart-fill-demo",
  title: "Codice fiscale suggerito (demo)",
  steps: [
    {
      id: "welcome",
      type: "intro",
      title: "Calcoliamo il tuo codice fiscale",
      subtitle: "Il campo finale viene proposto in automatico, ma puoi sempre correggerlo.",
      cta: "Inizia",
    },
    { id: "nome", type: "text", title: "Nome", placeholder: "Es. Mario" },
    { id: "cognome", type: "text", title: "Cognome", placeholder: "Es. Rossi" },
    {
      id: "sesso",
      type: "radio",
      title: "Sesso",
      options: [
        { value: "M", label: "Maschio" },
        { value: "F", label: "Femmina" },
      ],
    },
    {
      id: "data-di-nascita",
      type: "date-time",
      title: "Data di nascita",
      mode: "date",
    },
    {
      id: "luogo-di-nascita",
      type: "select-cards",
      title: "Luogo di nascita",
      options: [
        { value: "H501", label: "Roma" },
        { value: "F205", label: "Milano" },
        { value: "F839", label: "Napoli" },
        { value: "L219", label: "Torino" },
        { value: "A944", label: "Bologna" },
      ],
    },
    {
      id: "codice-fiscale",
      type: "text",
      title: "Codice fiscale",
      subtitle: "Suggerito dai dati inseriti sopra: puoi accettarlo o correggerlo.",
      placeholder: "Es. RSSMRA80A01H501X",
      addons: [
        {
          type: "smartFill",
          generator: "codiceFiscale",
          sourceFields: {
            nome: "nome",
            cognome: "cognome",
            dataNascita: "data-di-nascita",
            luogoNascita: "luogo-di-nascita",
            sesso: "sesso",
          },
        },
      ],
    },
    { id: "end", type: "confirmation", title: "Grazie!", showHomeButton: false },
  ],
})
