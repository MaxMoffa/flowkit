import { parseFlow, type Flow } from "@flowkit-io/core"

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
      // Per-step override: stays top-aligned even under the "showcase" theme's
      // layout.contentAlign: "center" default.
      contentAlign: "top",
      // Opt-in two columns (v2.25 default is single column): demonstrates the
      // container-query-driven grid when the step's own container is wide enough.
      layout: "columns",
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
      id: "pick-full-container",
      type: "location",
      title: "Mappa a schermo intero (maplibre)",
      subtitle: "fullContainer: true — la mappa riempie tutto lo step.",
      required: false,
      fullContainer: true,
    },
    {
      id: "pick-leaflet-spot",
      type: "location-leaflet",
      title: "Scegli un punto sulla mappa (Leaflet)",
      subtitle: "Stessa config di 'location', motore di rendering Leaflet.",
      required: false,
      layout: "columns",
    },
    {
      id: "pick-leaflet-full",
      type: "location-leaflet",
      title: "Mappa a schermo intero",
      subtitle: "fullContainer: true — la mappa riempie tutto lo step.",
      required: false,
      fullContainer: true,
    },
    {
      id: "quick-group",
      type: "group",
      themeOverride: { accent: "#E56458" },
      title: "Un paio di domande veloci",
      layout: "columns",
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
    {
      id: "pick-radio",
      type: "radio",
      title: "Come preferisci essere ricontattato?",
      subtitle: "Selezione singola",
      options: [
        { value: "email", label: "Email" },
        { value: "phone", label: "Telefono" },
        { value: "sms", label: "SMS" },
      ],
    },
    {
      id: "pick-title-only",
      type: "location",
      title: "Solo titolo, niente ricerca né GPS",
      subtitle: "showSearch: false, enableGps: false — resta a colonna singola anche da desktop.",
      required: false,
      showSearch: false,
      enableGps: false,
    },
    {
      id: "solo-group",
      type: "group",
      title: "Un solo campo",
      subtitle: "layout: columns, ma con un solo figlio resta a colonna singola.",
      layout: "columns",
      required: false,
      steps: [{ id: "solo-notes", type: "notes", title: "Note", required: false }],
    },
    {
      id: "group-and",
      type: "group",
      title: "Entrambi i campi richiesti (AND)",
      subtitle: "requiredChildren: { mode: 'all' } — Continua resta disabilitato finché non compili entrambi.",
      steps: [
        { id: "a", key: "and_a", type: "text", title: "Campo A", placeholder: "Campo A", required: false },
        { id: "b", key: "and_b", type: "text", title: "Campo B", placeholder: "Campo B", required: false },
      ],
      requiredChildren: { mode: "all" },
    },
    {
      id: "group-any",
      type: "group",
      title: "Almeno un campo richiesto (OR)",
      subtitle: "requiredChildren: { mode: 'any' } — basta compilarne uno dei tre.",
      steps: [
        { id: "a", key: "any_a", type: "text", title: "Campo A", placeholder: "Campo A", required: false },
        { id: "b", key: "any_b", type: "text", title: "Campo B", placeholder: "Campo B", required: false },
        { id: "c", key: "any_c", type: "text", title: "Campo C", placeholder: "Campo C", required: false },
      ],
      requiredChildren: { mode: "any" },
    },
    {
      id: "group-none",
      type: "group",
      title: "Nessun campo obbligatorio",
      subtitle: "requiredChildren: { mode: 'none' } — puoi sempre procedere.",
      steps: [
        { id: "a", key: "none_a", type: "text", title: "Campo A", placeholder: "Campo A", required: false },
        { id: "b", key: "none_b", type: "text", title: "Campo B", placeholder: "Campo B", required: false },
      ],
      requiredChildren: { mode: "none" },
    },
    {
      id: "pick-signature",
      type: "signature",
      title: "Firma qui",
      subtitle: "Disegna con dito, mouse o penna. Continua resta disabilitato finché non firmi.",
    },
    {
      id: "pick-payment",
      type: "payment-stripe",
      title: "Completa il pagamento",
      subtitle: "Demo pubblica: nessun backend reale collegato, la creazione del PaymentIntent fallisce volutamente.",
      required: false,
      publishableKey: "pk_test_demo_not_a_real_key",
      amount: 1000,
      currency: "eur",
      description: "Ordine demo",
      createPaymentIntent: () => Promise.reject(new Error("Nessun backend di pagamento configurato in questa demo.")),
    },
    { id: "end", type: "confirmation", title: "Grazie!" },
  ],
})
