import type { SelectionMode } from "@flowkit-io/core"

/** Minimal point-in-polygon (ray casting) for selectionMode "region", no dependency on turf. */
export function isPointInPolygon(point: [number, number], ring: [number, number][]): boolean {
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

/** Id of the first region whose polygon contains [lng, lat], or null outside them all. */
export function regionIdAt(
  regions: Extract<SelectionMode, { kind: "region" }>["regions"],
  lngLat: [number, number],
): string | null {
  for (const region of regions) {
    const geometry = (region as { geometry?: { type?: string; coordinates?: unknown } }).geometry
    if (geometry?.type !== "Polygon") continue
    const ring = (geometry.coordinates as [number, number][][])[0]
    if (ring && isPointInPolygon(lngLat, ring)) {
      return (region as { properties?: { id?: string } }).properties?.id ?? null
    }
  }
  return null
}
