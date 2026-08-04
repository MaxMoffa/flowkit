import type { Theme } from "vitepress"
import DefaultTheme from "vitepress/theme"
import "./custom.css"
import StepPreview from "./components/StepPreview.vue"

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("StepPreview", StepPreview)
  },
} satisfies Theme
