import type { LocationStepConfig } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { LocationStepLayout } from "./shared/location/location-step-layout"
import { regionIdAt } from "./shared/location/geometry"
import {
  DEFAULT_CENTER,
  MARKER_COLOR,
  SELECTED_ZOOM,
  type MapEngine,
} from "./shared/location/types"
import { useLocationStep } from "./shared/location/use-location-step"

const DEFAULT_STYLE_URL = "https://demotiles.maplibre.org/style.json"

/**
 * maplibre-gl engine. The dynamic import matters: maplibre-gl performs DOM-related side
 * effects (Blob/URL) at module load, which breaks non-browser environments (SSR, jsdom).
 */
const maplibreEngine: MapEngine = async ({ container, step, selectionMode, current, onChange }) => {
  const { default: maplibregl } = await import("maplibre-gl")

  const initialCenter = step.initialCenter ?? DEFAULT_CENTER
  const map = new maplibregl.Map({
    container,
    style: step.styleUrl ?? DEFAULT_STYLE_URL,
    center: [current.lng ?? initialCenter.lng, current.lat ?? initialCenter.lat],
    zoom: initialCenter.zoom ?? DEFAULT_CENTER.zoom,
  })
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")

  // The container's size isn't final yet on first paint (layout still settling), so
  // maplibre's own projection matrix can go stale relative to the container's true size.
  // A manual map click still "looks" aligned then, because unproject()/project() both run
  // through that same stale matrix and round-trip back to the clicked pixel — but a GPS
  // fix is an absolute real-world lat/lng with no such round trip, so setMarker() places it
  // using the stale matrix while the background (rendered at the container's real size)
  // doesn't match, and the two visibly drift apart. Same fix as the leaflet engine's
  // ResizeObserver below, just via maplibre's own resize() instead of invalidateSize().
  const resizeObserver = new ResizeObserver(() => map.resize())
  resizeObserver.observe(container)

  let marker: maplibregl.Marker | null = null

  function setMarker(lat: number, lng: number) {
    if (marker) {
      marker.setLngLat([lng, lat])
      return
    }
    marker = new maplibregl.Marker({ draggable: true, color: MARKER_COLOR })
      .setLngLat([lng, lat])
      .addTo(map)
    marker.on("dragend", () => {
      const pos = marker!.getLngLat()
      onChange({ lat: pos.lat, lng: pos.lng })
    })
  }

  if (selectionMode.kind === "point") {
    if (typeof current.lat === "number" && typeof current.lng === "number") {
      setMarker(current.lat, current.lng)
    }
    map.on("click", (e) => {
      setMarker(e.lngLat.lat, e.lngLat.lng)
      onChange({ lat: e.lngLat.lat, lng: e.lngLat.lng })
    })
  }

  if (selectionMode.kind === "preset-points") {
    for (const point of selectionMode.points) {
      const el = document.createElement("button")
      el.type = "button"
      el.className = "fk-map-preset-pin"
      el.textContent = "📍"
      el.setAttribute("aria-label", point.label)
      el.onclick = () => onChange({ lat: point.lat, lng: point.lng, pointId: point.id })
      new maplibregl.Marker({ element: el }).setLngLat([point.lng, point.lat]).addTo(map)
    }
  }

  if (selectionMode.kind === "region") {
    const { regions } = selectionMode
    map.on("click", (e) => {
      const regionId = regionIdAt(regions, [e.lngLat.lng, e.lngLat.lat])
      if (regionId) onChange({ regionId })
    })
  }

  for (const extra of step.extraMarkers ?? []) {
    const el = document.createElement("div")
    el.className = "fk-map-extra-marker"
    el.textContent = "📌"
    if (extra.label) el.title = extra.label
    new maplibregl.Marker({ element: el }).setLngLat([extra.lng, extra.lat]).addTo(map)
  }

  return {
    setMarker,
    removeMarker: () => {
      marker?.remove()
      marker = null
    },
    flyTo: (lat, lng) => map.flyTo({ center: [lng, lat], zoom: SELECTED_ZOOM }),
    destroy: () => {
      resizeObserver.disconnect()
      map.remove()
    },
  }
}

export function LocationStepView({ step, value, onChange, flow }: StepComponentProps<LocationStepConfig>) {
  const state = useLocationStep(step, value, onChange, maplibreEngine)
  return <LocationStepLayout step={step} state={state} flow={flow} />
}
