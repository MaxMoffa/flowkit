export interface GeocodingResult {
  label: string
  lat: number
  lng: number
}

export interface GeocodingConfig {
  /** Default: endpoint pubblico Nominatim/OSM. Sostituibile con un server self-hosted o altro provider compatibile. */
  endpoint?: string
  provider?: "nominatim" | "custom"
}

const DEFAULT_NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search"

/** Cerca un luogo per testo. Wrapper fetch minimale, compatibile col formato di risposta Nominatim. */
export async function geocode(
  query: string,
  config?: GeocodingConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<GeocodingResult[]> {
  if (!query.trim()) return []

  const endpoint = config?.endpoint ?? DEFAULT_NOMINATIM_ENDPOINT
  const url = new URL(endpoint)
  url.searchParams.set("q", query)
  url.searchParams.set("format", "json")
  url.searchParams.set("limit", "5")

  const res = await fetchImpl(url.toString(), { headers: { Accept: "application/json" } })
  if (!res.ok) {
    throw new Error(`Geocoding fallito: ${res.status} ${res.statusText}`)
  }
  const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>
  return data.map((d) => ({ label: d.display_name, lat: Number(d.lat), lng: Number(d.lon) }))
}

const DEFAULT_NOMINATIM_REVERSE_ENDPOINT = "https://nominatim.openstreetmap.org/reverse"

/**
 * Reverse geocoding: coordinate -> etichetta leggibile. Non lancia mai:
 * ritorna null su qualunque errore (rete, HTTP non-ok, risposta senza
 * display_name), lasciando al chiamante la scelta del fallback (es.
 * mostrare le coordinate raw).
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  config?: GeocodingConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const endpoint = config?.endpoint ?? DEFAULT_NOMINATIM_REVERSE_ENDPOINT
  try {
    const url = new URL(endpoint)
    url.searchParams.set("lat", String(lat))
    url.searchParams.set("lon", String(lng))
    url.searchParams.set("format", "json")
    const res = await fetchImpl(url.toString(), { headers: { Accept: "application/json" } })
    if (!res.ok) return null
    const data = (await res.json()) as { display_name?: string }
    return data.display_name ?? null
  } catch {
    return null
  }
}
