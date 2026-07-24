import { registerStepType } from "./registry"
import { locationStepSchema } from "./schema"
import { isValidLocationValue, locationConfigFields, type SelectionMode } from "./location-step"
import { z } from "zod"

/**
 * Variant of the "location" step that uses Leaflet instead of maplibre-gl as
 * the rendering engine (v2.15). The exact same config as the extended
 * "location" step (location-step.ts): only the type changes (so it can be
 * registered as a separate, opt-in React component, see
 * @flowkit-io/react/map-leaflet) along with the rendering engine on the
 * @flowkit-io/react side.
 */
export const locationLeafletStepConfigSchema = locationStepSchema.extend({
  ...locationConfigFields,
  type: z.literal("location-leaflet"),
})

export type LocationLeafletStepConfig = z.infer<typeof locationLeafletStepConfigSchema>

registerStepType({
  type: "location-leaflet",
  schema: locationLeafletStepConfigSchema,
  validate: (_step, value) => isValidLocationValue(value),
})

export type { SelectionMode }
