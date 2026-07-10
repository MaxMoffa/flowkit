import { z } from "zod"
import { registerStepType } from "./registry"
import { locationStepSchema } from "./schema"

const geoPointSchema = z.object({
  id: z.string(),
  label: z.string(),
  lat: z.number(),
  lng: z.number(),
})

export const selectionModeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("point") }),
  z.object({ kind: z.literal("region"), regions: z.array(z.record(z.unknown())) }),
  z.object({ kind: z.literal("preset-points"), points: z.array(geoPointSchema).min(1) }),
])

export type SelectionMode = z.infer<typeof selectionModeSchema>

/**
 * Extended config for the "location" step (v2.8): real map (maplibre-gl),
 * place search (geocoding, default Nominatim), selection mode. Extends the
 * base schema from location.ts (schema.ts) additively: a flow that doesn't
 * specify anything new behaves like before (selectionMode "point" by
 * default).
 */
export const locationStepConfigSchema = locationStepSchema.extend({
  /** Maplibre style URL. Default: public demo style, documented as replaceable. */
  styleUrl: z.string().optional(),
  geocodingEndpoint: z.string().optional(),
  geocodingProvider: z.enum(["nominatim", "custom"]).default("nominatim"),
  selectionMode: selectionModeSchema.default({ kind: "point" }),
  initialCenter: z
    .object({ lat: z.number(), lng: z.number(), zoom: z.number().optional() })
    .optional(),
  /** Extra markers shown on the map besides the selected point (declarative, serializable). */
  extraMarkers: z
    .array(z.object({ lat: z.number(), lng: z.number(), label: z.string().optional() }))
    .optional(),
  /** Shows the "use my location" button (Geolocation API). Default: true. */
  enableGps: z.boolean().default(true),
  /**
   * Shows the address search bar. Default: true. If showMap is false,
   * selectionMode (which assumes interaction with the map) is ignored:
   * the position can only be set via search and/or GPS.
   */
  showSearch: z.boolean().default(true),
  gpsButtonLabel: z.string().optional(),
  /** Text of the help popup shown when the geolocation permission is denied/blocked. */
  gpsGuideTitle: z.string().optional(),
  gpsGuideText: z.string().optional(),
  /** Automatic reverse geocoding (coordinates -> label) after GPS/click/drag. Default: true. */
  enableReverseGeocode: z.boolean().default(true),
  reverseGeocodingEndpoint: z.string().optional(),
})

export type LocationStepConfig = z.infer<typeof locationStepConfigSchema>

/**
 * Replaces the builtin "location" registration (schema+validate) done in
 * builtins.ts: side-effect import evaluated afterwards, in index.ts.
 */
registerStepType({
  type: "location",
  schema: locationStepConfigSchema,
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
