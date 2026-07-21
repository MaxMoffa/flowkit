# Map step (maplibre-gl / Leaflet)

Step of type `location`: real map rendered with [maplibre-gl](https://maplibre.org/),
place search (geocoding, default [Nominatim/OSM](https://nominatim.org)), configurable
selection.

```ts
{
  id: "pick-spot",
  type: "location",
  title: "Pick a spot on the map",
  styleUrl: "https://demotiles.maplibre.org/style.json",  // replaceable with your own style
  geocodingEndpoint: "https://nominatim.openstreetmap.org/search", // replaceable (self-hosted server, other provider)
  selectionMode: { kind: "point" },  // default
  initialCenter: { lat: 41.9, lng: 12.5, zoom: 11 },
}
```

## `selectionMode`: what "selecting" means

```ts
type SelectionMode =
  | { kind: "point" }                                              // default: free draggable pin
  | { kind: "region"; regions: GeoJSONFeature[] }                    // click inside a polygon → regionId
  | { kind: "preset-points"; points: { id, label, lat, lng }[] }     // click on a fixed point → pointId
```

- **`point`** (default): click/drag on the map places a draggable marker, `value`
  becomes `{ lat, lng }`.
- **`preset-points`**: shows a marker for each point in the list; clicking a marker
  sets `value: { lat, lng, pointId }`.
- **`region`**: clicking inside one of the provided GeoJSON polygons sets
  `value: { regionId }` (point-in-polygon computed client-side, no external dependency
  like turf).

## Customizing the rendering

- **Declarative** (stays in the config, serializable): `extraMarkers` adds decorative,
  non-selectable markers.
- **Full override** (custom markers with logic, function hooks): doesn't go through
  the JSON config (which must stay serializable), but through the "wrap the default
  registered component" pattern — register your own component for `"location"` that
  internally uses `LocationStepView` and passes it direct props:

```tsx
import { registerStepComponent, LocationStepView } from "@flowkit-io/react"

function CustomLocationView(props) {
  // add non-serializable logic/hooks here, then delegate to the default:
  return <LocationStepView {...props} />
}

registerStepComponent("location", CustomLocationView)
```

## Leaflet variant (`location-leaflet`)

The exact same config as `location` (`selectionMode`, geocoding, GPS, search...), but
with [Leaflet](https://leafletjs.com/) as the rendering engine instead of maplibre-gl
(default OpenStreetMap tiles). Use this variant if you prefer Leaflet or want to avoid
the maplibre-gl dependency.

```ts
{ id: "pick-spot-leaflet", type: "location-leaflet", title: "Pick a spot on the map" }
```

**Both map variants are opt-in**: `@flowkit-io/react` registers neither `location` nor
`location-leaflet` by default. Import only the entry point you need:

```ts
import "@flowkit-io/react/map-maplibre"  // registers "location" (+ maplibre-gl peer dependency)
import "@flowkit-io/react/map-leaflet"   // registers "location-leaflet" (+ leaflet peer dependency)
```

This avoids downloading both map libraries in projects that don't use a map step. The
`flowkit-init --steps=map-maplibre,map-leaflet` CLI writes these imports (and the
matching npm dependencies) only for the steps you choose — see [CLI](./cli.md).

## Desktop two-column layout

On desktop (≥1024px), a non-`fullContainer` `location`/`location-leaflet` step
automatically switches to a 2-column layout: search/GPS/result controls in the left
column, the map in the right column. Both columns share a single row so they always
match height, regardless of how much content the left column ends up with (e.g. search
results, a GPS error message) — no config needed.

Back to the [docs index](./README.md).
