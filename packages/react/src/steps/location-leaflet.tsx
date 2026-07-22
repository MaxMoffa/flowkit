import { useEffect, useRef, useState } from "react"
import type leaflet from "leaflet"
import { geocode, reverseGeocode, type GeocodingResult, type LocationLeafletStepConfig } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"

const DEFAULT_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
const DEFAULT_TILE_ATTRIBUTION = "&copy; OpenStreetMap contributors"

interface LocationValue {
  lat?: number
  lng?: number
  address?: string
  regionId?: string
  pointId?: string
}

/** Minimal point-in-polygon (ray casting) for selectionMode "region", no dependency on turf. */
function isPointInPolygon(point: [number, number], ring: [number, number][]): boolean {
  let inside = false
  const [x, y] = point
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!
    const [xj, yj] = ring[j]!
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function LocationLeafletStepView({
  step,
  value,
  onChange,
}: StepComponentProps<LocationLeafletStepConfig>) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<leaflet.Map | null>(null)
  const markerRef = useRef<leaflet.Marker | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GeocodingResult[]>([])
  const [searching, setSearching] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [showGpsGuide, setShowGpsGuide] = useState(false)
  const [reverseLoading, setReverseLoading] = useState(false)
  const justSearchedRef = useRef(false)

  const current: LocationValue =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as LocationValue)
      : typeof value === "string"
        ? { address: value }
        : {}

  const selectionMode = step.selectionMode ?? { kind: "point" as const }
  const hasEnoughContent = step.showSearch !== false || step.enableGps !== false

  useEffect(() => {
    if (!containerRef.current || step.showMap === false) return
    let cancelled = false

    // Dynamic import: leaflet performs DOM-related side effects on module load,
    // incompatible with non-browser environments (SSR, jsdom in tests).
    import("leaflet").then(({ default: L }) => {
      if (cancelled || !containerRef.current) return

      const initialCenter = step.initialCenter ?? { lat: 41.9, lng: 12.5, zoom: 11 }
      const map = L.map(containerRef.current).setView(
        [current.lat ?? initialCenter.lat, current.lng ?? initialCenter.lng],
        initialCenter.zoom ?? 11,
      )
      L.tileLayer(DEFAULT_TILE_URL, { attribution: DEFAULT_TILE_ATTRIBUTION }).addTo(map)
      mapRef.current = map

      // The container's size isn't final yet on first paint (e.g. fullContainer
      // mode, layout still settling): re-measure whenever it actually changes,
      // otherwise Leaflet renders tiles for a stale/zero size.
      resizeObserverRef.current = new ResizeObserver(() => map.invalidateSize())
      resizeObserverRef.current.observe(containerRef.current)

      function placeDraggableMarker(lat: number, lng: number) {
        if (!markerRef.current) {
          markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map)
          markerRef.current.on("dragend", () => {
            const pos = markerRef.current!.getLatLng()
            onChange({ lat: pos.lat, lng: pos.lng })
          })
        } else {
          markerRef.current.setLatLng([lat, lng])
        }
      }

      if (selectionMode.kind === "point") {
        if (typeof current.lat === "number" && typeof current.lng === "number") {
          placeDraggableMarker(current.lat, current.lng)
        }
        map.on("click", (e) => {
          placeDraggableMarker(e.latlng.lat, e.latlng.lng)
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
        map.on("click", (e) => {
          const clicked: [number, number] = [e.latlng.lng, e.latlng.lat]
          for (const region of selectionMode.regions) {
            const geometry = (region as { geometry?: { type?: string; coordinates?: unknown } })
              .geometry
            if (geometry?.type !== "Polygon") continue
            const ring = (geometry.coordinates as [number, number][][])[0]
            if (ring && isPointInPolygon(clicked, ring)) {
              const regionId = (region as { properties?: { id?: string } }).properties?.id
              if (regionId) onChange({ regionId })
              return
            }
          }
        })
      }

      for (const extra of step.extraMarkers ?? []) {
        const icon = L.divIcon({ className: "fk-map-extra-marker", html: "📌" })
        const marker = L.marker([extra.lat, extra.lng], { icon }).addTo(map)
        if (extra.label) marker.bindTooltip(extra.label)
      }
    })

    return () => {
      cancelled = true
      resizeObserverRef.current?.disconnect()
      resizeObserverRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (step.enableReverseGeocode === false) return
    if (justSearchedRef.current) {
      justSearchedRef.current = false
      return
    }
    if (typeof current.lat !== "number" || typeof current.lng !== "number") return
    let cancelled = false
    const timer = setTimeout(async () => {
      setReverseLoading(true)
      try {
        const label = await reverseGeocode(current.lat!, current.lng!, {
          endpoint: step.reverseGeocodingEndpoint,
          provider: step.geocodingProvider,
        })
        if (!cancelled && label) {
          onChange({ ...current, address: label })
        }
      } finally {
        if (!cancelled) setReverseLoading(false)
      }
    }, 500)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.lat, current.lng])

  async function runSearch(q: string) {
    setQuery(q)
    if (q.trim().length < 3) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      const found = await geocode(q, {
        endpoint: step.geocodingEndpoint,
        provider: step.geocodingProvider,
      })
      setResults(found)
    } finally {
      setSearching(false)
    }
  }

  function flyToCoords(lat: number, lng: number) {
    const map = mapRef.current
    if (!map) return
    map.flyTo([lat, lng], 14)
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    } else {
      import("leaflet").then(({ default: L }) => {
        if (!mapRef.current) return
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current)
        markerRef.current.on("dragend", () => {
          const pos = markerRef.current!.getLatLng()
          onChange({ lat: pos.lat, lng: pos.lng })
        })
      })
    }
  }

  function selectResult(result: GeocodingResult) {
    justSearchedRef.current = true
    onChange({ lat: result.lat, lng: result.lng, address: result.label })
    setResults([])
    setQuery(result.label)
    flyToCoords(result.lat, result.lng)
  }

  async function requestGpsLocation() {
    setGpsError(null)
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setShowGpsGuide(true)
      return
    }

    if (navigator.permissions?.query) {
      try {
        const status = await navigator.permissions.query({
          name: "geolocation" as PermissionName,
        })
        if (status.state === "denied") {
          setShowGpsGuide(true)
          return
        }
      } catch {
        // Permissions API not supported for "geolocation" in this browser: proceed anyway.
      }
    }

    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false)
        const { latitude: lat, longitude: lng } = pos.coords
        onChange({ lat, lng })
        flyToCoords(lat, lng)
      },
      (err) => {
        setGpsLoading(false)
        if (err.code === err.PERMISSION_DENIED) {
          setShowGpsGuide(true)
        } else {
          setGpsError("Posizione non disponibile. Riprova o seleziona sulla mappa.")
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  const searchBlock = step.showSearch !== false && (
    <div className="fk-map-search">
      <input
        className="fk-input"
        type="text"
        placeholder={step.placeholder ?? "Cerca un indirizzo"}
        value={query}
        onChange={(e) => void runSearch(e.target.value)}
      />
      {searching && <span className="fk-map-search-loading">Cerco…</span>}
      {results.length > 0 && (
        <ul className="fk-map-search-results">
          {results.map((r, i) => (
            <li key={i}>
              <button type="button" onClick={() => selectResult(r)}>
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  const gpsLabel = gpsLoading ? "Rilevo la posizione…" : (step.gpsButtonLabel ?? "Usa la mia posizione")

  const gpsButton = step.enableGps !== false && (
    <button
      type="button"
      className={`fk-btn-neutral fk-gps-btn${step.fullContainer ? " fk-gps-btn--icon" : ""}`}
      onClick={() => void requestGpsLocation()}
      disabled={gpsLoading}
      aria-label={step.fullContainer ? gpsLabel : undefined}
    >
      <span aria-hidden="true">📍</span>
      <span className="fk-gps-btn-label">{gpsLabel}</span>
    </button>
  )

  const resultRow = (current.address || (current.lat !== undefined && current.lng !== undefined)) && (
    <div className="fk-loc-row">
      <div className="fk-loc-ic">📍</div>
      <div>
        <div className="fk-loc-title">
          {current.address ?? `${current.lat?.toFixed(5)}, ${current.lng?.toFixed(5)}`}
        </div>
        {step.detectedSubLabel && <div className="fk-loc-detail">{step.detectedSubLabel}</div>}
      </div>
    </div>
  )

  const gpsGuideOverlay = showGpsGuide && (
    <div className="fk-gps-guide-overlay" role="dialog" aria-modal="true">
      <div className="fk-gps-guide">
        <div className="fk-gps-guide-ic">📍</div>
        <div className="fk-gps-guide-title">{step.gpsGuideTitle ?? "Permesso di posizione bloccato"}</div>
        <p className="fk-gps-guide-text">
          {step.gpsGuideText ??
            "Il browser ha bloccato l'accesso alla posizione. Apri le impostazioni del sito (icona 🔒/ⓘ accanto all'indirizzo), consenti \"Posizione\" e riprova."}
        </p>
        <button type="button" className="fk-btn fk-btn-primary" onClick={() => setShowGpsGuide(false)}>
          Ho capito
        </button>
      </div>
    </div>
  )

  if (step.fullContainer) {
    return (
      <div className="fk-step fk-step-location fk-step-location--full">
        <div className="fk-map-overlay-top">
          {step.title && <h2 className="fk-title">{step.title}</h2>}
          {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
          {searchBlock}
        </div>

        {step.showMap !== false && <div ref={containerRef} className="fk-map-canvas fk-map-canvas--full" />}

        <div className="fk-map-overlay-bottom">
          <div className="fk-map-bottom-actions">
            {gpsButton}
            {resultRow}
          </div>
          {gpsError && <p className="fk-gps-error">{gpsError}</p>}
          {reverseLoading && <span className="fk-map-search-loading">Cerco indirizzo…</span>}
        </div>

        {gpsGuideOverlay}
      </div>
    )
  }

  return (
    <div className={`fk-step fk-step-location${hasEnoughContent ? " fk-step-location--columns" : ""}`}>
      <div className="fk-location-controls">
        {step.title && <h2 className="fk-title">{step.title}</h2>}
        {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}

        {searchBlock}

        {gpsButton}
        {gpsError && <p className="fk-gps-error">{gpsError}</p>}

        {resultRow}
        {reverseLoading && <span className="fk-map-search-loading">Cerco indirizzo…</span>}
      </div>

      {step.showMap !== false && <div ref={containerRef} className="fk-map-canvas" />}

      {gpsGuideOverlay}
    </div>
  )
}
