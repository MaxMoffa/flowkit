import { parseFlow, type Flow } from "@flowkit-io/core"

/** Demo for the unified `image` field (v2.34): one step per kind (emoji/icon/image),
 *  to visually check rendering + sizing consistency in light and dark mode. */
export const stepImageDemoFlow: Flow = parseFlow({
  id: "step-image-demo",
  title: "Campo immagine",
  steps: [
    {
      id: "welcome",
      type: "intro",
      title: "Emoji",
      subtitle: "kind: \"emoji\"",
      image: { kind: "emoji", value: "🎉" },
      cta: "Prova",
    },
    {
      id: "icon-step",
      type: "info",
      title: "Icona SVG",
      subtitle: "kind: \"icon\" — markup SVG inline, sanitizzato, colore via currentColor",
      image: {
        kind: "icon",
        value:
          '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 8v4l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      },
    },
    {
      id: "image-step",
      type: "info",
      title: "Immagine",
      subtitle: "kind: \"image\" — URL o data URI",
      image: {
        kind: "image",
        value:
          "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iIzI3ODNERSIvPjx0ZXh0IHg9IjI0IiB5PSIzMCIgZm9udC1zaXplPSIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiPvCfk4Q8L3RleHQ+PC9zdmc+",
      },
    },
    {
      // v2.36: non-intro/info step types now propagate `image` too, rendered inline
      // next to the title (.fk-title-icon) instead of the intro/info hero badge.
      id: "select-cards-step",
      type: "select-cards",
      title: "Non-intro icon",
      subtitle: "select-cards con icona inline (.fk-title-icon), non badge",
      image: { kind: "emoji", value: "🎯" },
      options: [{ value: "x", label: "X" }],
    },
    {
      id: "no-icon-step",
      type: "text",
      title: "Nessuna icona",
      subtitle: "step senza image: nessuno spazio vuoto accanto al titolo",
      required: false,
    },
    { id: "end", type: "confirmation", title: "Grazie!", showHomeButton: false },
  ],
})
