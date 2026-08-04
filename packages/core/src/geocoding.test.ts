import { describe, expect, it, vi } from "vitest"
import { geocode, reverseGeocode } from "./geocoding"

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: async () => body,
  } as Response
}

describe("geocode", () => {
  it("returns [] without calling fetch for a blank query", async () => {
    const fetchImpl = vi.fn()
    const result = await geocode("   ", undefined, fetchImpl)
    expect(result).toEqual([])
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it("maps the Nominatim response shape to GeocodingResult[]", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse([
        { display_name: "Rome, Italy", lat: "41.9028", lon: "12.4964" },
        { display_name: "Rome, GA, USA", lat: "34.257", lon: "-85.1647" },
      ]),
    )
    const result = await geocode("Rome", undefined, fetchImpl)
    expect(result).toEqual([
      { label: "Rome, Italy", lat: 41.9028, lng: 12.4964 },
      { label: "Rome, GA, USA", lat: 34.257, lng: -85.1647 },
    ])
  })

  it("queries the default Nominatim endpoint with q/format/limit params", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse([]))
    await geocode("Milan", undefined, fetchImpl)
    const calledUrl = new URL(fetchImpl.mock.calls[0]![0] as string)
    expect(calledUrl.origin + calledUrl.pathname).toBe("https://nominatim.openstreetmap.org/search")
    expect(calledUrl.searchParams.get("q")).toBe("Milan")
    expect(calledUrl.searchParams.get("format")).toBe("json")
    expect(calledUrl.searchParams.get("limit")).toBe("5")
  })

  it("uses config.endpoint when provided", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse([]))
    await geocode("Milan", { endpoint: "https://geocode.example.com/search" }, fetchImpl)
    const calledUrl = new URL(fetchImpl.mock.calls[0]![0] as string)
    expect(calledUrl.origin + calledUrl.pathname).toBe("https://geocode.example.com/search")
  })

  it("throws on a non-ok response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse([], false, 503))
    await expect(geocode("Milan", undefined, fetchImpl)).rejects.toThrow(/Geocoding failed: 503/)
  })
})

describe("reverseGeocode", () => {
  it("returns display_name on success", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ display_name: "Piazza Duomo, Milan" }))
    const result = await reverseGeocode(45.4642, 9.19, undefined, fetchImpl)
    expect(result).toBe("Piazza Duomo, Milan")
  })

  it("queries lat/lon/format on the default reverse endpoint", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ display_name: "x" }))
    await reverseGeocode(45.4642, 9.19, undefined, fetchImpl)
    const calledUrl = new URL(fetchImpl.mock.calls[0]![0] as string)
    expect(calledUrl.origin + calledUrl.pathname).toBe("https://nominatim.openstreetmap.org/reverse")
    expect(calledUrl.searchParams.get("lat")).toBe("45.4642")
    expect(calledUrl.searchParams.get("lon")).toBe("9.19")
  })

  it("returns null (never throws) on a non-ok response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, false, 500))
    const result = await reverseGeocode(0, 0, undefined, fetchImpl)
    expect(result).toBeNull()
  })

  it("returns null when the response has no display_name", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}))
    const result = await reverseGeocode(0, 0, undefined, fetchImpl)
    expect(result).toBeNull()
  })

  it("returns null (never throws) when fetch itself rejects", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network down"))
    const result = await reverseGeocode(0, 0, undefined, fetchImpl)
    expect(result).toBeNull()
  })
})
