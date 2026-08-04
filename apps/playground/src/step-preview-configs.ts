import type { Step } from "@flowkit-io/core"

/** Tiny inline placeholder (light-gray rounded rect + camera glyph) so the
 *  media-display preview renders something real without depending on the network or
 *  shipping a binary asset. */
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">' +
      '<rect width="640" height="360" rx="20" fill="#F0EFED"/>' +
      '<text x="320" y="192" font-size="72" text-anchor="middle" dominant-baseline="middle">📷</text>' +
      "</svg>",
  )

/**
 * One representative example config per built-in step type, used to build the live
 * preview embedded on that type's docs page (docs/steps/{type}.md, via the VitePress
 * `<StepPreview>` component → apps/playground's fullscreen.html?stepPreview=...).
 * Loosely mirrors each page's own "## Example" block — kept as separate plain data
 * (not shared code/imports) since the docs pages are static markdown, not generated.
 *
 * "branch" has no entry on purpose: role "logic", invisible, resolved and skipped
 * before it would ever render — there is nothing to show.
 */
export const stepPreviewConfigs: Partial<Record<string, Step>> = {
  intro: {
    id: "preview",
    type: "intro",
    title: "What's in the air?",
    subtitle: "Report it in 30 seconds.",
    image: { kind: "emoji", value: "👃" },
    cta: "Report a smell →",
    livePill: "34 reports today nearby",
  } as unknown as Step,

  info: {
    id: "preview",
    type: "info",
    title: "Before you continue",
    subtitle: "Read the next screen carefully — it explains **why** we ask for this.",
    image: { kind: "emoji", value: "ℹ️" },
  } as unknown as Step,

  "long-content": {
    id: "preview",
    type: "long-content",
    title: "Terms & Conditions",
    requireScrollToEnd: true,
    content:
      "**By continuing you agree to...**\n\n- point one\n- point two\n\n[Full text](https://example.com/terms)",
  } as unknown as Step,

  review: {
    id: "preview",
    type: "review",
    title: "Ready to go?",
    subtitle: "Check and submit your report.",
    meta: "🌬️ We'll automatically add the weather and wind direction",
  } as unknown as Step,

  confirmation: {
    id: "preview",
    type: "confirmation",
    title: "Thank you!",
    message: "Your report has been recorded.",
    stats: [
      { value: "35", label: "reports today nearby" },
      { value: "#12", label: "yours today" },
    ],
  } as unknown as Step,

  group: {
    id: "preview",
    type: "group",
    title: "A couple of quick questions",
    layout: "stack",
    steps: [
      { id: "satisfaction", type: "scale", title: "How satisfied are you?", min: 1, max: 5 },
      {
        id: "liked",
        type: "chips",
        title: "What did you like?",
        multiple: true,
        options: [
          { value: "speed", label: "Speed" },
          { value: "ease", label: "Ease of use" },
        ],
      },
    ],
  } as unknown as Step,

  "select-cards": {
    id: "preview",
    type: "select-cards",
    title: "What type of smell?",
    multiple: false,
    options: [
      { value: "sewage", label: "Sewage", emoji: "🥚", description: "Rotten eggs, sulfur" },
      { value: "chemical", label: "Chemical", emoji: "🧪", description: "Solvents, paint" },
    ],
  } as unknown as Step,

  chips: {
    id: "preview",
    type: "chips",
    title: "How long have you noticed it?",
    multiple: false,
    options: [
      { value: "lt5", label: "< 5 min" },
      { value: "5-30", label: "5–30 min" },
      { value: "gt30", label: "> 30 min" },
      { value: "persistent", label: "Persistent" },
    ],
  } as unknown as Step,

  radio: {
    id: "preview",
    type: "radio",
    title: "How should we contact you?",
    options: [
      { value: "email", label: "Email" },
      { value: "phone", label: "Phone" },
    ],
  } as unknown as Step,

  "multi-select": {
    id: "preview",
    type: "multi-select",
    title: "What did you like most?",
    min: 0,
    options: [
      { value: "speed", label: "Speed" },
      { value: "support", label: "Support" },
    ],
  } as unknown as Step,

  faces: {
    id: "preview",
    type: "faces",
    title: "How annoying is it?",
    required: false,
    faces: [
      { value: "1", emoji: "😊" },
      { value: "2", emoji: "😐" },
      { value: "3", emoji: "😕" },
      { value: "4", emoji: "🤢" },
      { value: "5", emoji: "🤮" },
    ],
  } as unknown as Step,

  scale: {
    id: "preview",
    type: "scale",
    title: "How strong is it?",
    variant: "slider",
    min: 0,
    max: 6,
    minLabel: "0 · None",
    maxLabel: "6 · Extreme",
    valueLabels: ["None", "Very faint", "Faint", "Noticeable", "Strong", "Very strong", "Extreme"],
  } as unknown as Step,

  nps: {
    id: "preview",
    type: "nps",
    title: "Would you recommend us?",
    question: "How likely are you to recommend us to a friend or colleague?",
  } as unknown as Step,

  text: {
    id: "preview",
    type: "text",
    title: "Want us to follow up?",
    required: false,
    variant: "email",
    placeholder: "name@example.com",
  } as unknown as Step,

  checkbox: {
    id: "preview",
    type: "checkbox",
    title: "Privacy",
    label: "Confermo che i dati sono corretti",
    description: "I tuoi dati saranno trattati secondo l'informativa privacy.",
  } as unknown as Step,

  notes: {
    id: "preview",
    type: "notes",
    title: "Anything to add?",
    required: false,
    placeholder: "E.g. the smell gets stronger with a north wind…",
  } as unknown as Step,

  "date-time": {
    id: "preview",
    type: "date-time",
    title: "When?",
    mode: "datetime",
    disablePast: true,
  } as unknown as Step,

  "booking-slot": {
    id: "preview",
    type: "booking-slot",
    title: "Choose a time",
    granularity: "30min",
    startDate: "2026-08-01",
    endDate: "2026-08-14",
    weeklyWindows: [
      { dayOfWeek: 1, start: "09:00", end: "18:00" },
      { dayOfWeek: 2, start: "09:00", end: "18:00" },
    ],
    capacity: 3,
    limitedThreshold: 0.34,
  } as unknown as Step,

  media: {
    id: "preview",
    type: "media",
    title: "Add a photo",
    required: false,
  } as unknown as Step,

  file: {
    id: "preview",
    type: "file",
    title: "Attach a document",
    required: false,
    formatPreset: "documents",
    multiple: true,
  } as unknown as Step,

  "media-display": {
    id: "preview",
    type: "media-display",
    title: "Here's what we mean",
    kind: "image",
    src: PLACEHOLDER_IMAGE,
    aspectRatio: "16/9",
  } as unknown as Step,

  signature: {
    id: "preview",
    type: "signature",
    title: "Sign here",
    subtitle: "Draw your signature in the box.",
    padHeight: 260,
  } as unknown as Step,

  location: {
    id: "preview",
    type: "location",
    title: "Where do you smell it?",
    subtitle: "Search an address or click directly on the map.",
  } as unknown as Step,

  "location-leaflet": {
    id: "preview",
    type: "location-leaflet",
    title: "Where do you smell it?",
  } as unknown as Step,

  oauth: {
    id: "preview",
    type: "oauth",
    title: "Sign in to continue",
    providers: [{ id: "google", clientId: "preview-client-id", redirectUri: "https://example.com/callback" }],
  } as unknown as Step,

  "payment-stripe": {
    id: "preview",
    type: "payment-stripe",
    title: "Complete the payment",
    // Stripe's own well-known public test key (used across their docs/examples) — safe
    // to embed, test-mode only, no linked account. The step never actually charges
    // anything here: createPaymentIntent below deliberately rejects.
    publishableKey: "pk_test_TYooMQauvdEDq54NiTphI7jx",
    amount: 1500,
    currency: "eur",
    createPaymentIntent: () =>
      Promise.reject(new Error("Anteprima — nessun backend di pagamento collegato.")),
  } as unknown as Step,

  verification: {
    id: "preview",
    type: "verification",
    title: "Quick check",
    provider: "turnstile",
    siteKey: "preview-site-key",
    // Shows the real "verified" success UI without loading Turnstile's script or
    // spending a challenge — see verification-step.ts's previewVerified doc comment.
    previewVerified: true,
    verifyToken: () => Promise.resolve(true),
  } as unknown as Step,
}
