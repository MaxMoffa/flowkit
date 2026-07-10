import { parseFlow, type Flow } from "@flowkit/core"

/**
 * Demo end-to-end delle feature v2.7 (step OAuth) e v2.8 (step mappa reale
 * con maplibre-gl): entrambe verificate solo su React in questo giro.
 */
export const featuresDemoFlow: Flow = parseFlow({
  id: "features-demo",
  title: "OAuth + Mappa reale",
  steps: [
    { id: "welcome", type: "intro", title: "OAuth + Mappa", cta: "Prova" },
    {
      id: "login",
      type: "oauth",
      title: "Accedi per continuare",
      subtitle: "Provider demo (nessuna vera app OAuth registrata).",
      required: false,
      providers: [
        {
          id: "generic",
          clientId: "demo-client-id",
          authorizeUrl: "https://example.com/oauth/authorize",
          redirectUri: "http://localhost:5173/oauth/callback",
          scopes: ["profile"],
        },
      ],
    },
    {
      id: "pick-spot",
      type: "location",
      title: "Scegli un punto sulla mappa",
      subtitle: "Cerca un indirizzo o clicca direttamente sulla mappa.",
      required: false,
    },
    {
      id: "pick-preset-point",
      type: "location",
      title: "Oppure scegli tra i punti suggeriti",
      subtitle: "selectionMode: preset-points",
      required: false,
      selectionMode: {
        kind: "preset-points",
        points: [
          { id: "duomo", label: "Duomo di Milano", lat: 45.4642, lng: 9.19 },
          { id: "colosseo", label: "Colosseo", lat: 41.8902, lng: 12.4922 },
          { id: "torre-eiffel", label: "Torre Eiffel", lat: 48.8584, lng: 2.2945 },
        ],
      },
      initialCenter: { lat: 45.0, lng: 8.0, zoom: 3 },
    },
    { id: "end", type: "confirmation", title: "Grazie!" },
  ],
})
