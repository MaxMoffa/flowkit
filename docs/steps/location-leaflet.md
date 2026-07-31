# `location-leaflet`

Same step as [`location`](./location.md) — identical config fields, answer value,
2-column desktop layout and `fullContainer` behaviour — rendered with **leaflet**
instead of maplibre-gl. Component: `LocationLeafletStepView`. Pick it when you want
raster tiles or already ship leaflet; pick `location` for vector tiles.

Not registered by the main entry point:

```ts
import "@flowkit-io/react/map-leaflet" // registers "location-leaflet"
```

Every field behaves exactly as under `location`, with one exception: `styleUrl` is
accepted by the schema but **currently ignored** — the leaflet renderer always draws
the default OpenStreetMap raster tiles
(`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`). Use `location` if you need a
custom basemap.

## Example

```ts
{ id: "location", type: "location-leaflet", title: "Where do you smell it?" }
```

[← All steps](./index.md)
