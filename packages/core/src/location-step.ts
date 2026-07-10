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
 * Config estesa dello step "location" (v2.8): mappa reale (maplibre-gl),
 * ricerca luoghi (geocoding, default Nominatim), modalità di selezione.
 * Estende lo schema base di location.ts (schema.ts) in modo additivo: un
 * flow che non specifica nulla di nuovo si comporta come prima (selectionMode
 * "point" di default).
 */
export const locationStepConfigSchema = locationStepSchema.extend({
  /** URL dello stile maplibre. Default: stile demo pubblico, documentato come sostituibile. */
  styleUrl: z.string().optional(),
  geocodingEndpoint: z.string().optional(),
  geocodingProvider: z.enum(["nominatim", "custom"]).default("nominatim"),
  selectionMode: selectionModeSchema.default({ kind: "point" }),
  initialCenter: z
    .object({ lat: z.number(), lng: z.number(), zoom: z.number().optional() })
    .optional(),
  /** Marker aggiuntivi mostrati sulla mappa oltre al punto selezionato (dichiarativo, serializzabile). */
  extraMarkers: z
    .array(z.object({ lat: z.number(), lng: z.number(), label: z.string().optional() }))
    .optional(),
})

export type LocationStepConfig = z.infer<typeof locationStepConfigSchema>

/**
 * Sostituisce la registrazione builtin di "location" (schema+validate) fatta
 * in builtins.ts: import side-effect eseguito dopo, in index.ts.
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
