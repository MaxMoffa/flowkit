import { registerStepType } from "./registry"
import { locationStepSchema } from "./schema"
import { selectionModeSchema, type SelectionMode } from "./location-step"
import { z } from "zod"

/**
 * Variante dello step "location" che usa Leaflet invece di maplibre-gl come
 * motore di rendering (v2.15). Stessa identica config dello step "location"
 * esteso (location-step.ts): cambia solo il tipo (per poterlo registrare
 * come componente React separato, installabile a scelta, vedi
 * @flowkit/react/map-leaflet) e il motore di rendering lato @flowkit/react.
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
