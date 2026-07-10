export interface GeocodingResult {
  label: string
  lat: number
  lng: number
}

export interface GeocodingConfig {
  /** Default: public Nominatim/OSM endpoint. Replaceable with a self-hosted server or another compatible provider. */
  endpoint?: string
  provider?: "nominatim" | "custom"
}

const DEFAULT_NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search"

/** Searches for a place by text. Minimal fetch wrapper, compatible with the Nominatim response format. */
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
    throw new Error(`Geocoding failed: ${res.status} ${res.statusText}`)
  }
  const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>
  return data.map((d) => ({ label: d.display_name, lat: Number(d.lat), lng: Number(d.lon) }))
}

const DEFAULT_NOMINATIM_REVERSE_ENDPOINT = "https://nominatim.openstreetmap.org/reverse"

/**
 * Reverse geocoding: coordinates -> human-readable label. Never throws:
 * returns null on any error (network, non-ok HTTP, response without
 * display_name), leaving the fallback choice to the caller (e.g.
 * showing the raw coordinates).
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
