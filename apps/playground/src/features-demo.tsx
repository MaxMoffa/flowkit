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
      allowAnonymous: true,
      anonymousLabel: "Continua senza account",
      providers: [
        {
          id: "generic",
          clientId: "demo-client-id",
          authorizeUrl: "https://example.com/oauth/authorize",
          redirectUri: "http://localhost:5173/oauth/callback",
          scopes: ["profile"],
          icon: "🪪",
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
      // Disabilitato: il test e2e su questo step verifica le coordinate raw esatte,
      // il reverse geocode (rete reale/non mockata qui) le sovrascriverebbe in modo non deterministico.
      enableReverseGeocode: false,
    },
    {
      id: "pick-search-only",
      type: "location",
      title: "Solo ricerca indirizzo",
      subtitle: "showMap: false, enableGps: false",
      required: false,
      showMap: false,
      enableGps: false,
    },
    {
      id: "pick-map-only",
      type: "location",
      title: "Solo mappa",
      subtitle: "showSearch: false, enableGps: false",
      required: false,
      showSearch: false,
      enableGps: false,
    },
    {
      id: "pick-gps-only",
      type: "location",
      title: "Solo GPS",
      subtitle: "showMap: false, showSearch: false",
      required: false,
      showMap: false,
      showSearch: false,
    },
    {
      id: "pick-leaflet-spot",
      type: "location-leaflet",
      title: "Scegli un punto sulla mappa (Leaflet)",
      subtitle: "Stessa config di 'location', motore di rendering Leaflet.",
      required: false,
    },
    {
      id: "quick-group",
      type: "group",
      themeOverride: { accent: "#E56458" },
      title: "Un paio di domande veloci",
      layout: "stack",
      required: true,
      steps: [
        {
          id: "quick-scale",
          type: "scale",
          title: "Quanto sei soddisfatto?",
          min: 1,
          max: 5,
        },
        {
          id: "quick-chips",
          type: "chips",
          title: "Cosa ti è piaciuto?",
          multiple: true,
          options: [
            { value: "velocita", label: "Velocità" },
            { value: "facilita", label: "Facilità" },
          ],
        },
      ],
    },
    { id: "end", type: "confirmation", title: "Grazie!" },
  ],
})
