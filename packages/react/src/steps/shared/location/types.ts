import type { LocationLeafletStepConfig, LocationStepConfig, SelectionMode } from "@flowkit-io/core"

/** The answer a location step writes. Also accepted as a bare string, for flows written
 *  before v2.8, which the hook normalises into `{ address }`. */
export interface LocationValue {
  lat?: number
  lng?: number
  address?: string
  regionId?: string
  pointId?: string
}

/** The two map steps share one config: only the `type` literal differs. */
export type AnyLocationStep = LocationStepConfig | LocationLeafletStepConfig

/** What the shared hook needs from a mounted map, whatever library drew it. */
export interface MapEngineHandle {
  /** Creates the draggable marker on first call, moves it afterwards. */
  setMarker: (lat: number, lng: number) => void
  flyTo: (lat: number, lng: number) => void
  destroy: () => void
}

export interface MapMountOptions {
  container: HTMLDivElement
  step: AnyLocationStep
  selectionMode: SelectionMode
  /** Value at mount time, to restore an already-selected marker. */
  current: LocationValue
  onChange: (value: LocationValue) => void
}

/**
 * Mounts a map into `container` and returns the handle the step drives it through.
 * Implementations own their library's dynamic import, so nothing pulls in maplibre-gl
 * or leaflet unless the matching step is actually used.
 */
export type MapEngine = (options: MapMountOptions) => Promise<MapEngineHandle>

export const DEFAULT_CENTER = { lat: 41.9, lng: 12.5, zoom: 11 }
export const SELECTED_ZOOM = 14
export const MARKER_COLOR = "#2783DE"
