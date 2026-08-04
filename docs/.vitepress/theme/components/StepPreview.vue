<script setup lang="ts">
import { computed } from "vue"
import { useData, withBase } from "vitepress"

const props = defineProps<{
  /** Registered step type, e.g. "intro", "select-cards" — must have an entry in the
   *  playground's step-preview-configs.ts, or the embed renders blank. */
  type: string
}>()

const { isDark } = useData()

/** Reuses the playground's own fullscreen preview (apps/playground/src/
 *  fullscreen-preview.tsx), pointed at a single step type instead of a full preset via
 *  ?stepPreview=. withBase() accounts for the site's base path ("/flowkit/" on GitHub
 *  Pages, "/" locally) — the playground is deployed alongside the docs at /playground/,
 *  see .github/workflows/deploy-pages.yml. */
const src = computed(() => {
  const mode = isDark.value ? "dark" : "light"
  return withBase(`/playground/fullscreen.html?stepPreview=${props.type}&mode=${mode}`)
})
</script>

<template>
  <div class="step-preview">
    <iframe :src="src" loading="lazy" :title="`Anteprima step ${type}`" />
  </div>
</template>

<style scoped>
.step-preview {
  display: flex;
  justify-content: center;
  margin: 24px 0;
}

.step-preview iframe {
  width: 380px;
  height: 720px;
  max-width: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 20px;
  background: var(--vp-c-bg);
}
</style>
