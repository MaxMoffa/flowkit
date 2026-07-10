import { useEffect, useRef, useState } from "react"
import type maplibregl from "maplibre-gl"
import { geocode, reverseGeocode, type GeocodingResult, type LocationStepConfig } from "@flowkit/core"
import type { StepComponentProps } from "../types"

const DEFAULT_STYLE_URL = "https://demotiles.maplibre.org/style.json"

interface LocationValue {
  lat?: number
  lng?: number
  address?: string
  regionId?: string
  pointId?: string
}

/** Point-in-polygon minimale (ray casting) per selectionMode "region", niente dipendenza da turf. */
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

export function LocationStepView({ step, value, onChange }: StepComponentProps<LocationStepConfig>) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
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

  useEffect(() => {
    if (!containerRef.current || step.showMap === false) return
    let cancelled = false

    // Import dinamico: maplibre-gl esegue side-effect legati al DOM (Blob/URL) al
    // caricamento del modulo, incompatibili con ambienti non-browser (SSR, jsdom nei test).
    import("maplibre-gl").then(({ default: maplibregl }) => {
      if (cancelled || !containerRef.current) return

      const initialCenter = step.initialCenter ?? { lat: 41.9, lng: 12.5, zoom: 11 }
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: step.styleUrl ?? DEFAULT_STYLE_URL,
        center: [current.lng ?? initialCenter.lng, current.lat ?? initialCenter.lat],
        zoom: initialCenter.zoom ?? 11,
      })
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")
      mapRef.current = map

      function placeDraggableMarker(lng: number, lat: number) {
        if (!markerRef.current) {
          markerRef.current = new maplibregl.Marker({ draggable: true, color: "#2783DE" })
            .setLngLat([lng, lat])
            .addTo(map)
          markerRef.current.on("dragend", () => {
            const pos = markerRef.current!.getLngLat()
            onChange({ lat: pos.lat, lng: pos.lng })
          })
        } else {
          markerRef.current.setLngLat([lng, lat])
        }
      }

      if (selectionMode.kind === "point") {
        if (typeof current.lat === "number" && typeof current.lng === "number") {
          placeDraggableMarker(current.lng, current.lat)
        }
        map.on("click", (e) => {
          placeDraggableMarker(e.lngLat.lng, e.lngLat.lat)
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
        map.on("click", (e) => {
          const clicked: [number, number] = [e.lngLat.lng, e.lngLat.lat]
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
        const el = document.createElement("div")
        el.className = "fk-map-extra-marker"
        el.textContent = "📌"
        if (extra.label) el.title = extra.label
        new maplibregl.Marker({ element: el }).setLngLat([extra.lng, extra.lat]).addTo(map)
      }
    })

    return () => {
      cancelled = true
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

  function selectResult(result: GeocodingResult) {
    justSearchedRef.current = true
    onChange({ lat: result.lat, lng: result.lng, address: result.label })
    setResults([])
    setQuery(result.label)
    const map = mapRef.current
    if (map) {
      map.flyTo({ center: [result.lng, result.lat], zoom: 14 })
      if (markerRef.current) {
        markerRef.current.setLngLat([result.lng, result.lat])
      } else {
        import("maplibre-gl").then(({ default: maplibregl }) => {
          if (!mapRef.current) return
          markerRef.current = new maplibregl.Marker({ draggable: true, color: "#2783DE" })
            .setLngLat([result.lng, result.lat])
            .addTo(mapRef.current)
          markerRef.current.on("dragend", () => {
            const pos = markerRef.current!.getLngLat()
            onChange({ lat: pos.lat, lng: pos.lng })
          })
        })
      }
    }
  }

  function flyToCoords(lat: number, lng: number) {
    const map = mapRef.current
    if (!map) return
    map.flyTo({ center: [lng, lat], zoom: 14 })
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat])
    } else {
      import("maplibre-gl").then(({ default: maplibregl }) => {
        if (!mapRef.current) return
        markerRef.current = new maplibregl.Marker({ draggable: true, color: "#2783DE" })
          .setLngLat([lng, lat])
          .addTo(mapRef.current)
        markerRef.current.on("dragend", () => {
          const pos = markerRef.current!.getLngLat()
          onChange({ lat: pos.lat, lng: pos.lng })
        })
      })
    }
  }

  async function requestGpsLocation() {
    setGpsError(null)
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setShowGpsGuide(true)
      return
    }

    // Se il Permissions API riporta già "denied", il browser non ripropone il
    // prompt nativo: mostriamo subito la guida invece di far fallire getCurrentPosition in silenzio.
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
        // Permissions API non supportata per "geolocation" in questo browser: si prosegue comunque.
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

  return (
    <div className="fk-step fk-step-location">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}

      {step.showSearch !== false && (
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
      )}

      {step.showMap !== false && <div ref={containerRef} className="fk-map-canvas" />}

      {step.enableGps !== false && (
        <button
          type="button"
          className="fk-btn-neutral fk-gps-btn"
          onClick={() => void requestGpsLocation()}
          disabled={gpsLoading}
        >
          📍 {gpsLoading ? "Rilevo la posizione…" : (step.gpsButtonLabel ?? "Usa la mia posizione")}
        </button>
      )}
      {gpsError && <p className="fk-gps-error">{gpsError}</p>}

      {(current.address || (current.lat !== undefined && current.lng !== undefined)) && (
        <div className="fk-loc-row">
          <div className="fk-loc-ic">📍</div>
          <div>
            <div className="fk-loc-title">
              {current.address ?? `${current.lat?.toFixed(5)}, ${current.lng?.toFixed(5)}`}
            </div>
            {step.detectedSubLabel && <div className="fk-loc-detail">{step.detectedSubLabel}</div>}
          </div>
        </div>
      )}
      {reverseLoading && <span className="fk-map-search-loading">Cerco indirizzo…</span>}

      {showGpsGuide && (
        <div className="fk-gps-guide-overlay" role="dialog" aria-modal="true">
          <div className="fk-gps-guide">
            <div className="fk-gps-guide-ic">📍</div>
            <div className="fk-gps-guide-title">
              {step.gpsGuideTitle ?? "Permesso di posizione bloccato"}
            </div>
            <p className="fk-gps-guide-text">
              {step.gpsGuideText ??
                "Il browser ha bloccato l'accesso alla posizione. Apri le impostazioni del sito (icona 🔒/ⓘ accanto all'indirizzo), consenti \"Posizione\" e riprova."}
            </p>
            <button type="button" className="fk-btn fk-btn-primary" onClick={() => setShowGpsGuide(false)}>
              Ho capito
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
