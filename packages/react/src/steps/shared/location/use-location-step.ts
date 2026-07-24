import { useEffect, useRef, useState } from "react"
import type { MutableRefObject } from "react"
import { geocode, reverseGeocode, type AnswerValue, type GeocodingResult } from "@flowkit-io/core"
import {
  SELECTED_ZOOM,
  type AnyLocationStep,
  type LocationValue,
  type MapEngine,
  type MapEngineHandle,
} from "./types"

/** Debounce before resolving coordinates into an address, so dragging a marker does not
 *  fire a geocoding request per frame. */
const REVERSE_GEOCODE_DELAY_MS = 500

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
}

export interface LocationStepState {
  current: LocationValue
  query: string
  results: GeocodingResult[]
  searching: boolean
  gpsLoading: boolean
  gpsError: string | null
  showGpsGuide: boolean
  reverseLoading: boolean
  containerRef: MutableRefObject<HTMLDivElement | null>
  runSearch: (q: string) => Promise<void>
  selectResult: (result: GeocodingResult) => void
  requestGpsLocation: () => Promise<void>
  dismissGpsGuide: () => void
}

/**
 * Everything the location steps do that is not drawing a map: value normalisation,
 * address search, reverse geocoding, GPS, and the marker/camera calls issued through
 * the injected engine. The maplibre and leaflet steps differ only by that engine.
 */
export function useLocationStep(
  step: AnyLocationStep,
  value: AnswerValue,
  onChange: (value: AnswerValue) => void,
  engine: MapEngine,
): LocationStepState {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const engineRef = useRef<MapEngineHandle | null>(null)
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

    void engine({
      container: containerRef.current,
      step,
      selectionMode,
      current,
      onChange,
    }).then((handle) => {
      // The step may have unmounted while the map library was still loading.
      if (cancelled) {
        handle.destroy()
        return
      }
      engineRef.current = handle
    })

    return () => {
      cancelled = true
      engineRef.current?.destroy()
      engineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (step.enableReverseGeocode === false) return
    // A result picked from the search already carries its own label: resolving it again
    // would overwrite a better address with the reverse-geocoded one.
    if (justSearchedRef.current) {
      justSearchedRef.current = false
      return
    }
    const { lat, lng } = current
    if (typeof lat !== "number" || typeof lng !== "number") return
    let cancelled = false
    const timer = setTimeout(async () => {
      setReverseLoading(true)
      try {
        const label = await reverseGeocode(lat, lng, {
          endpoint: step.reverseGeocodingEndpoint,
          provider: step.geocodingProvider,
        })
        if (!cancelled && label) onChange({ ...current, address: label })
      } finally {
        if (!cancelled) setReverseLoading(false)
      }
    }, REVERSE_GEOCODE_DELAY_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.lat, current.lng])

  function moveTo(lat: number, lng: number) {
    engineRef.current?.flyTo(lat, lng)
    engineRef.current?.setMarker(lat, lng)
  }

  async function runSearch(q: string) {
    setQuery(q)
    if (q.trim().length < 3) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      setResults(
        await geocode(q, { endpoint: step.geocodingEndpoint, provider: step.geocodingProvider }),
      )
    } finally {
      setSearching(false)
    }
  }

  function selectResult(result: GeocodingResult) {
    justSearchedRef.current = true
    onChange({ lat: result.lat, lng: result.lng, address: result.label })
    setResults([])
    setQuery(result.label)
    moveTo(result.lat, result.lng)
  }

  async function requestGpsLocation() {
    setGpsError(null)
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setShowGpsGuide(true)
      return
    }

    // If the Permissions API already reports "denied", the browser won't show the native
    // prompt again: show the guide right away instead of silently failing getCurrentPosition.
    if (navigator.permissions?.query) {
      try {
        const status = await navigator.permissions.query({ name: "geolocation" as PermissionName })
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
        moveTo(lat, lng)
      },
      (err) => {
        setGpsLoading(false)
        if (err.code === err.PERMISSION_DENIED) {
          setShowGpsGuide(true)
        } else {
          setGpsError("Posizione non disponibile. Riprova o seleziona sulla mappa.")
        }
      },
      GEOLOCATION_OPTIONS,
    )
  }

  return {
    current,
    query,
    results,
    searching,
    gpsLoading,
    gpsError,
    showGpsGuide,
    reverseLoading,
    containerRef,
    runSearch,
    selectResult,
    requestGpsLocation,
    dismissGpsGuide: () => setShowGpsGuide(false),
  }
}

export { SELECTED_ZOOM }
