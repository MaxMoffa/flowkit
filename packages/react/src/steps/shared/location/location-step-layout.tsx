import type { AnyLocationStep } from "./types"
import type { LocationStepState } from "./use-location-step"

interface LocationStepLayoutProps {
  step: AnyLocationStep
  state: LocationStepState
}

/** Chrome of both map steps: search bar, GPS button, selected-address row, permission
 *  guide, and the two layouts (fullContainer vs stacked/columns). Identical for every
 *  engine, since only what happens inside `.fk-map-canvas` depends on the library. */
export function LocationStepLayout({ step, state }: LocationStepLayoutProps) {
  const {
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
    dismissGpsGuide,
  } = state

  const hasEnoughContent = step.showSearch !== false || step.enableGps !== false
  const columnsEnabled = step.layout === "columns" && hasEnoughContent

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
        <button type="button" className="fk-btn fk-btn-primary" onClick={dismissGpsGuide}>
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
    <div className={`fk-step fk-step-location${columnsEnabled ? " fk-step-location--columns" : ""}`}>
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
