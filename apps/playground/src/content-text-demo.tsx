import { parseFlow, type Flow } from "@flowkit-io/core"

/**
 * Demo for `ContentText` (v2.4x): flow *content* (title/subtitle, option labels,
 * catalog item text) can be a literal string (unchanged default) or `{ key, fallback? }`,
 * resolved against `flow.content` — a dictionary namespace separate from `flow.texts`
 * (reserved for the library's own chrome/validation text, see `i18n-texts-demo.tsx`).
 *
 * Every `ContentText` field below is deliberately mixed:
 * - some keys ARE present in `content` → the dictionary value renders;
 * - the `q1.subtitle` key is deliberately absent from `content` → its own `fallback`
 *   renders instead, so opening this demo shows both code paths at once without any
 *   extra UI. Swap/extend `content` (or delete a key) to see the fallback take over.
 */
export const contentTextDemoFlow: Flow = parseFlow({
  id: "content-text-demo",
  title: "Contenuto localizzabile (demo)",
  content: {
    "welcome.title": "Benvenuto/a! 👋",
    "welcome.subtitle": "Questo flow mostra i testi risolti dal dizionario `flow.content`.",
    "q1.title": "Quale canale preferisci?",
    // "q1.subtitle" is intentionally NOT in this dictionary: it falls back to the
    // ContentText value's own `fallback` below.
    "q1.email": "Email",
    "q1.phone": "Telefono",
    "cart.title": "Scegli un piano",
    "cart.basic.label": "Piano Base",
    "cart.basic.description": "Ideale per iniziare.",
  },
  steps: [
    {
      id: "welcome",
      type: "intro",
      title: { key: "welcome.title", fallback: "Welcome!" },
      subtitle: { key: "welcome.subtitle", fallback: "Default subtitle (no dictionary entry)." },
      cta: "Inizia",
    },
    {
      id: "q1",
      type: "radio",
      title: { key: "q1.title", fallback: "Come preferisci essere contattato?" },
      subtitle: { key: "q1.subtitle", fallback: "Nessuna voce nel dizionario: vedi il fallback." },
      options: [
        { value: "email", label: { key: "q1.email", fallback: "Email (default)" } },
        { value: "phone", label: { key: "q1.phone", fallback: "Telefono (default)" } },
        // A literal string still works everywhere, unchanged — no dictionary lookup at all.
        { value: "post", label: "Posta (stringa letterale)" },
      ],
    },
    {
      id: "plan",
      type: "catalog",
      title: { key: "cart.title", fallback: "Scegli un piano (default)" },
      currency: "eur",
      items: [
        {
          value: "basic",
          label: { key: "cart.basic.label", fallback: "Basic (default)" },
          description: { key: "cart.basic.description", fallback: "Default description." },
          price: 0,
        },
        {
          value: "pro",
          // "cart.pro.*" isn't in `content` at all: both label and description fall
          // back to the values below, demonstrating the same field working with zero
          // dictionary entries.
          label: { key: "cart.pro.label", fallback: "Pro (fallback, non tradotto)" },
          description: { key: "cart.pro.description", fallback: "Nessuna voce nel dizionario per questo piano." },
          price: 990,
        },
      ],
    },
    { id: "end", type: "confirmation", title: "Grazie!" },
  ],
})
