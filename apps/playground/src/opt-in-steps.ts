import type { Flow, Step } from "@flowkit-io/core"

/** Step types whose React component lives in a separate, opt-in entry point (see
 *  packages/react's package.json `exports`) precisely so a consumer who never uses
 *  maps/payments/verification doesn't bundle maplibre-gl/leaflet/@stripe/turnstile. The
 *  playground and the docs' per-step previews (both render arbitrary flows/step types at
 *  runtime, not known at build time) need to load whichever of these the active flow
 *  actually uses, on demand. */
const OPT_IN_STEP_LOADERS: Partial<Record<string, () => Promise<unknown>>> = {
  location: () => import("@flowkit-io/react/map-maplibre"),
  "location-leaflet": () => import("@flowkit-io/react/map-leaflet"),
  "payment-stripe": () => import("@flowkit-io/react/payment-stripe"),
  verification: () => import("@flowkit-io/react/verification"),
}

function collectStepTypes(steps: Step[], acc: Set<string>): void {
  for (const step of steps) {
    acc.add(step.type)
    const children = (step as { steps?: Step[] }).steps
    if (Array.isArray(children)) collectStepTypes(children, acc)
  }
}

/** Loads (and self-registers, via each module's own import side effect) only the
 *  opt-in step components `flow` actually needs — a no-op for the types that don't
 *  require one. Safe to call repeatedly/concurrently for overlapping flows: dynamic
 *  `import()` of the same specifier resolves the same cached module promise. */
export async function ensureOptInStepsRegistered(flow: Flow): Promise<void> {
  const types = new Set<string>()
  collectStepTypes(flow.steps, types)
  const loaders = [...types]
    .map((type) => OPT_IN_STEP_LOADERS[type])
    .filter((loader): loader is () => Promise<unknown> => loader !== undefined)
  await Promise.all(loaders.map((loader) => loader()))
}
