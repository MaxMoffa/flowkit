---
layout: home

hero:
  name: Flowkit
  text: Config-driven flows for React
  tagline: Headless engine + themeable renderer. Describe a flow as JSON/TS, get a mobile-first, accessible, animated wizard — 25 built-in step types, open registry for custom ones.
  image:
    src: /favicon.svg
    alt: Flowkit
  actions:
    - theme: brand
      text: Quickstart
      link: /quickstart
    - theme: alt
      text: Step reference
      link: /steps/
    - theme: alt
      text: Open the playground
      link: /playground/
      target: _self

features:
  - icon: 🧩
    title: 25 built-in step types
    details: intro, choice, rating, text, date/booking, media, real maps (maplibre/leaflet), OAuth, Stripe payment, Turnstile/reCAPTCHA verification, and more — see the step-by-step reference.
  - icon: 🛠️
    title: Open step registry
    details: Register your own step type with registerStepType/registerStepComponent (core + react). Custom steps behave exactly like built-ins — same validation, review row, theming.
  - icon: 🎨
    title: Themeable, not hardcoded
    details: Every color/radius/spacing/font/animation is a CSS variable. Ships with 5 themes (notion-clean, mint-fresh, midnight-ink, rose-quartz, sunset-clay) plus per-step theme overrides.
  - icon: 📦
    title: Small, tree-shakeable footprint
    details: Map/payment/verification renderers are opt-in entry points — installing @flowkit-io/react never forces maplibre-gl, leaflet or Stripe.js onto a project that doesn't use them.
  - icon: 🔌
    title: Adapters, not lock-in
    details: local storage, REST, Notion — or write your own FlowAdapter. Draft persistence, submit, and result-link creation are all pluggable.
  - icon: ✅
    title: Zod-validated, TypeScript end to end
    details: parseFlow validates your config at build time with descriptive errors. StepTypeMap augmentation keeps custom steps fully typed for consumers who want it.
---
