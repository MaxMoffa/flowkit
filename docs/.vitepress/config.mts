import { defineConfig } from "vitepress"

const base = process.env.GITHUB_PAGES === "true" ? "/flowkit/" : "/"

export default defineConfig({
  title: "Flowkit",
  description: "Headless, themeable, config-driven flow engine for React.",
  lang: "en-US",
  base,
  cleanUrls: true,
  lastUpdated: true,
  head: [["link", { rel: "icon", href: `${base}favicon.svg` }]],

  themeConfig: {
    logo: "/favicon.svg",
    nav: [
      { text: "Guide", link: "/quickstart" },
      { text: "Steps", link: "/steps/" },
      { text: "Playground", link: "/playground/", target: "_self" },
      { text: "GitHub", link: "https://github.com/MaxMoffa/flowkit" },
    ],

    sidebar: {
      "/steps/": [
        {
          text: "Step reference",
          items: [{ text: "Overview", link: "/steps/" }],
        },
        {
          text: "Structure",
          items: [
            { text: "intro", link: "/steps/intro" },
            { text: "review", link: "/steps/review" },
            { text: "confirmation", link: "/steps/confirmation" },
            { text: "group", link: "/steps/group" },
          ],
        },
        {
          text: "Choice",
          items: [
            { text: "select-cards", link: "/steps/select-cards" },
            { text: "chips", link: "/steps/chips" },
            { text: "radio", link: "/steps/radio" },
            { text: "multi-select", link: "/steps/multi-select" },
            { text: "faces", link: "/steps/faces" },
          ],
        },
        {
          text: "Rating",
          items: [
            { text: "scale", link: "/steps/scale" },
            { text: "nps", link: "/steps/nps" },
          ],
        },
        {
          text: "Text & input",
          items: [
            { text: "text", link: "/steps/text" },
            { text: "checkbox", link: "/steps/checkbox" },
            { text: "date-time", link: "/steps/date-time" },
            { text: "booking-slot", link: "/steps/booking-slot" },
            { text: "notes", link: "/steps/notes" },
          ],
        },
        {
          text: "Media",
          items: [
            { text: "media", link: "/steps/media" },
            { text: "file", link: "/steps/file" },
            { text: "media-display", link: "/steps/media-display" },
            { text: "signature", link: "/steps/signature" },
          ],
        },
        {
          text: "Location",
          items: [
            { text: "location (maplibre)", link: "/steps/location" },
            { text: "location-leaflet", link: "/steps/location-leaflet" },
          ],
        },
        {
          text: "Integrations",
          items: [
            { text: "oauth", link: "/steps/oauth" },
            { text: "payment-stripe", link: "/steps/payment-stripe" },
            { text: "verification", link: "/steps/verification" },
          ],
        },
      ],
      "/": [
        {
          text: "Getting started",
          items: [
            { text: "Installation", link: "/installation" },
            { text: "CLI: create-flowkit / flowkit-init", link: "/cli" },
            { text: "Quickstart: playground", link: "/quickstart" },
          ],
        },
        {
          text: "Guide",
          items: [
            { text: "Core concepts", link: "/core-concepts" },
            { text: "Using Flowkit in an app", link: "/using-flowkit" },
            { text: "Defining a flow", link: "/steps-reference" },
            { text: "Step-by-step reference", link: "/steps/" },
            { text: "Custom steps", link: "/custom-steps" },
            { text: "Configuring a theme", link: "/theming" },
          ],
        },
        {
          text: "Steps with dedicated guides",
          items: [
            { text: "OAuth step", link: "/oauth-step" },
            { text: "Map step (maplibre-gl / Leaflet)", link: "/map-step" },
          ],
        },
        {
          text: "Integrations & i18n",
          items: [
            { text: "Result actions", link: "/result-actions" },
            { text: "Persisting answers (adapters)", link: "/adapters" },
            { text: "i18n and included presets", link: "/i18n-and-presets" },
          ],
        },
        {
          text: "Contributing",
          items: [{ text: "Monorepo scripts and e2e tests", link: "/development" }],
        },
      ],
    },

    socialLinks: [{ icon: "github", link: "https://github.com/MaxMoffa/flowkit" }],

    search: { provider: "local" },

    footer: {
      message: "Released under the MIT License.",
      copyright: "Flowkit",
    },
  },
})
