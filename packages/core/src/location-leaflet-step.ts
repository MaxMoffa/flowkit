import { registerStepType } from "./registry"
import { locationStepSchema } from "./schema"
import { selectionModeSchema, type SelectionMode } from "./location-step"
import { z } from "zod"

/**
 * Variant of the "location" step that uses Leaflet instead of maplibre-gl as
 * the rendering engine (v2.15). The exact same config as the extended
 * "location" step (location-step.ts): only the type changes (so it can be
 * registered as a separate, opt-in React component, see
 * @flowkit/react/map-leaflet) along with the rendering engine on the
 * @flowkit/react side.
 */
export const locationLeafletStepConfigSchema = locationStepSchema.extend({
  type: z.literal("location-leaflet"),
  styleUrl: z.string().optional(),
  geocodingEndpoint: z.string().optional(),
  geocodingProvider: z.enum(["nominatim", "custom"]).default("nominatim"),
  selectionMode: selectionModeSchema.default({ kind: "point" }),
  initialCenter: z
    .object({ lat: z.number(), lng: z.number(), zoom: z.number().optional() })
    .optional(),
  extraMarkers: z
    .array(z.object({ lat: z.number(), lng: z.number(), label: z.string().optional() }))
    .optional(),
  enableGps: z.boolean().default(true),
  showSearch: z.boolean().default(true),
  gpsButtonLabel: z.string().optional(),
  gpsGuideTitle: z.string().optional(),
  gpsGuideText: z.string().optional(),
  enableReverseGeocode: z.boolean().default(true),
  reverseGeocodingEndpoint: z.string().optional(),
})

export type LocationLeafletStepConfig = z.infer<typeof locationLeafletStepConfigSchema>

registerStepType({
  type: "location-leaflet",
  schema: locationLeafletStepConfigSchema,
  validate: (_step, value) => {
    if (typeof value === "string") return value.trim().length > 0
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const v = value as { lat?: number; lng?: number; regionId?: string; pointId?: string }
      if (typeof v.lat === "number" && typeof v.lng === "number") return true
      if (v.regionId || v.pointId) return true
    }
    return false
  },
})

export type { SelectionMode }
