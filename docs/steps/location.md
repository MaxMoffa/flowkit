# `location`

Captures a geographic position on a **real map** (maplibre-gl). Answer value:
`{ lat, lng, address?, regionId?, pointId? }` (or `string`, for backward compatibility
with flows written before v2.8). Component: `LocationStepView`. See the dedicated
[Map step](../map-step.md) guide for the full `selectionMode`/geocoding config.

Not registered by the main entry point:

```ts
import "@flowkit-io/react/map-maplibre" // registers "location"
```

<StepPreview type="location" />

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `placeholder` | `string` | `"Search an address"` | Address search bar placeholder |
| `showMap` | `boolean` | `true` | Shows/hides the map. If `false`, position can only be set via search and/or GPS (`selectionMode` ignored) |
| `showSearch` | `boolean` | `true` | Shows/hides the address search bar |
| `enableGps` | `boolean` | `true` | Shows/hides the "use my location" button, rendered below the map with neutral (non-accent) styling |
| `gpsButtonLabel` | `string` | `"Use my location"` | GPS button text |
| `gpsGuideTitle` / `gpsGuideText` | `string` | default text | Title/text of the help popup shown when the geolocation permission is denied/blocked |
| `enableReverseGeocode` | `boolean` | `true` | After GPS/click/drag, resolves coordinates into a human-readable address (Nominatim `/reverse` or custom endpoint); falls back to "lat, lng" on failure |
| `reverseGeocodingEndpoint` | `string` | public Nominatim `/reverse` | Reverse geocoding endpoint, replaceable |
| `detectedSubLabel` | `string` | — | Secondary line under the selected address/coordinates |
| `styleUrl` | `string` | public maplibre demo style | Map style URL, replaceable |
| `geocodingEndpoint` | `string` | public Nominatim `/search` | Forward-search endpoint, replaceable (e.g. self-hosted) |
| `selectionMode` | see [Map step](../map-step.md) | `{ kind: "point" }` | What "selecting" means on the map (ignored if `showMap: false`) |
| `initialCenter` | `{ lat, lng, zoom? }` | Rome, zoom 11 | Initial map center/zoom |
| `extraMarkers` | `{ lat, lng, label? }[]` | — | Additional decorative, non-selectable markers |
| `fullContainer` | `boolean` | `false` | Map fills the entire step viewport edge-to-edge; title/subtitle/search collapse into a floating scrim bar on top, GPS/result/errors into a floating card at the bottom |

`showMap`, `showSearch` and `enableGps` are independent — combine freely (search-only,
map-only, GPS-only, or any mix).

On desktop (≥1024px) a non-`fullContainer` step automatically switches to a 2-column
layout: controls on the left, map on the right — no config needed.

## Example

```ts
{ id: "location", type: "location", title: "Where do you smell it?",
  subtitle: "Search an address or click directly on the map." }

// GPS-only, no map or search:
{ id: "location-gps-only", type: "location", showMap: false, showSearch: false }

// Map fills the whole step, controls float on top:
{ id: "location-full", type: "location", fullContainer: true }
```

[← All steps](./index.md) · See also [`location-leaflet`](./location-leaflet.md)
