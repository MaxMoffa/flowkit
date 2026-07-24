import type leaflet from "leaflet"
import type { LocationLeafletStepConfig } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { LocationStepLayout } from "./shared/location/location-step-layout"
import { regionIdAt } from "./shared/location/geometry"
import { DEFAULT_CENTER, SELECTED_ZOOM, type MapEngine } from "./shared/location/types"
import { useLocationStep } from "./shared/location/use-location-step"

const DEFAULT_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
const DEFAULT_TILE_ATTRIBUTION = "&copy; OpenStreetMap contributors"

/**
 * Leaflet engine. Same dynamic-import reason as the maplibre one: leaflet touches the DOM
 * at module load. `styleUrl` is ignored here — leaflet draws the default raster tiles.
 */
const leafletEngine: MapEngine = async ({ container, step, selectionMode, current, onChange }) => {
  const { default: L } = await import("leaflet")

  const initialCenter = step.initialCenter ?? DEFAULT_CENTER
  const map = L.map(container).setView(
    [current.lat ?? initialCenter.lat, current.lng ?? initialCenter.lng],
    initialCenter.zoom ?? DEFAULT_CENTER.zoom,
  )
  L.tileLayer(DEFAULT_TILE_URL, { attribution: DEFAULT_TILE_ATTRIBUTION }).addTo(map)

  // The container's size isn't final yet on first paint (e.g. fullContainer mode, layout
  // still settling): re-measure whenever it actually changes, otherwise Leaflet renders
  // tiles for a stale/zero size.
  const resizeObserver = new ResizeObserver(() => map.invalidateSize())
  resizeObserver.observe(container)

  let marker: leaflet.Marker | null = null

  function setMarker(lat: number, lng: number) {
    if (marker) {
      marker.setLatLng([lat, lng])
      return
    }
    marker = L.marker([lat, lng], { draggable: true }).addTo(map)
    marker.on("dragend", () => {
      const pos = marker!.getLatLng()
      onChange({ lat: pos.lat, lng: pos.lng })
    })
  }

  if (selectionMode.kind === "point") {
    if (typeof current.lat === "number" && typeof current.lng === "number") {
      setMarker(current.lat, current.lng)
    }
    map.on("click", (e) => {
      setMarker(e.latlng.lat, e.latlng.lng)
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
    })
  }

  if (selectionMode.kind === "preset-points") {
    for (const point of selectionMode.points) {
      const icon = L.divIcon({ className: "fk-map-preset-pin", html: "📍" })
      L.marker([point.lat, point.lng], { icon })
        .addTo(map)
        .on("click", () => onChange({ lat: point.lat, lng: point.lng, pointId: point.id }))
    }
  }

  if (selectionMode.kind === "region") {
    const { regions } = selectionMode
    map.on("click", (e) => {
      const regionId = regionIdAt(regions, [e.latlng.lng, e.latlng.lat])
      if (regionId) onChange({ regionId })
    })
  }

  for (const extra of step.extraMarkers ?? []) {
    const icon = L.divIcon({ className: "fk-map-extra-marker", html: "📌" })
    const extraMarker = L.marker([extra.lat, extra.lng], { icon }).addTo(map)
    if (extra.label) extraMarker.bindTooltip(extra.label)
  }

  return {
    setMarker,
    flyTo: (lat, lng) => map.flyTo([lat, lng], SELECTED_ZOOM),
    destroy: () => {
      resizeObserver.disconnect()
      map.remove()
    },
  }
}

export function LocationLeafletStepView({
  step,
  value,
  onChange,
}: StepComponentProps<LocationLeafletStepConfig>) {
  const state = useLocationStep(step, value, onChange, leafletEngine)
  return <LocationStepLayout step={step} state={state} />
}
