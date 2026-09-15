import type { Flow } from "@flowkit-io/core"
import { resolveContentText } from "@flowkit-io/core"
import type { AnyLocationStep } from "./types"
import type { LocationStepState } from "./use-location-step"
import { FlowMarkdown } from "../../../markdown"
import { CloseIcon } from "../close-icon"
import { GpsIcon } from "../gps-icon"
import { LocationPinIcon } from "../location-pin-icon"
import { StepTitle } from "../step-title"

interface LocationStepLayoutProps {
  step: AnyLocationStep
  state: LocationStepState
  flow: Flow
}

/** Chrome of both map steps: search bar, GPS button, selected-address row, permission
 *  guide, and the two layouts (fullContainer vs stacked/columns). Identical for every
 *  engine, since only what happens inside `.fk-map-canvas` depends on the library. */
export function LocationStepLayout({ step, state, flow }: LocationStepLayoutProps) {
  const title = step.title !== undefined ? resolveContentText(flow, step.title) : undefined
  const subtitle = step.subtitle !== undefined ? resolveContentText(flow, step.subtitle) : undefined
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
    clearSelection,
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
      {searching && (
        <span className="fk-map-search-loading">
          <span className="fk-spinner fk-spinner-sm" aria-hidden="true" />
          Cerco…
        </span>
      )}
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
      {gpsLoading ? <span className="fk-spinner fk-spinner-sm" aria-hidden="true" /> : <GpsIcon />}
      <span className="fk-gps-btn-label">{gpsLabel}</span>
    </button>
  )

  const hasSelection = Boolean(current.address || (current.lat !== undefined && current.lng !== undefined))

  const resultRow = hasSelection && (
    <div className="fk-loc-row">
      <div className="fk-loc-ic"><LocationPinIcon /></div>
      <div>
        <div className="fk-loc-title">
          {current.address ?? `${current.lat?.toFixed(5)}, ${current.lng?.toFixed(5)}`}
        </div>
        {step.detectedSubLabel && (
          <div className="fk-loc-detail"><FlowMarkdown text={step.detectedSubLabel} variant="inline" /></div>
        )}
      </div>
    </div>
  )

  /* Stacked layout only: the selected place grows out of the map card itself instead of
     sitting between the GPS button and the map — the card's bottom edge extends into
     this panel, with a clear (×) button since there's now room for one. */
  const mapResultPanel = hasSelection && (
    <div className="fk-map-result">
      <div className="fk-loc-ic"><LocationPinIcon /></div>
      {reverseLoading ? (
        <div className="fk-map-result-text fk-map-result-loading">
          <span className="fk-spinner fk-spinner-sm" aria-hidden="true" />
          Cerco indirizzo…
        </div>
      ) : (
        <div className="fk-map-result-text">
          <div className="fk-loc-title">
            {current.address ?? `${current.lat?.toFixed(5)}, ${current.lng?.toFixed(5)}`}
          </div>
          {step.detectedSubLabel && (
            <div className="fk-loc-detail"><FlowMarkdown text={step.detectedSubLabel} variant="inline" /></div>
          )}
        </div>
      )}
      <button
        type="button"
        className="fk-map-result-clear"
        onClick={clearSelection}
        aria-label="Annulla la selezione"
      >
        <CloseIcon />
      </button>
    </div>
  )

  const gpsGuideOverlay = showGpsGuide && (
    <div className="fk-gps-guide-overlay" role="dialog" aria-modal="true">
      <div className="fk-gps-guide">
        <div className="fk-gps-guide-ic"><LocationPinIcon /></div>
        <div className="fk-gps-guide-title">
          <FlowMarkdown text={step.gpsGuideTitle ?? "Permesso di posizione bloccato"} variant="inline" />
        </div>
        <p className="fk-gps-guide-text">
          <FlowMarkdown
            text={
              step.gpsGuideText ??
              "Il browser ha bloccato l'accesso alla posizione. Apri le impostazioni del sito (icona 🔒/ⓘ accanto all'indirizzo), consenti \"Posizione\" e riprova."
            }
            variant="block"
          />
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
          <StepTitle image={step.image} title={title} />
          {subtitle && <p className="fk-subtitle"><FlowMarkdown text={subtitle} variant="block" /></p>}
          {searchBlock}
        </div>

        {step.showMap !== false && <div ref={containerRef} className="fk-map-canvas fk-map-canvas--full" />}

        <div className="fk-map-overlay-bottom">
          <div className="fk-map-bottom-actions">
            {gpsButton}
            {resultRow}
          </div>
          {gpsError && <p className="fk-gps-error">{gpsError}</p>}
          {reverseLoading && (
            <span className="fk-map-search-loading">
              <span className="fk-spinner fk-spinner-sm" aria-hidden="true" />
              Cerco indirizzo…
            </span>
          )}
        </div>

        {gpsGuideOverlay}
      </div>
    )
  }

  return (
    <div className={`fk-step fk-step-location${columnsEnabled ? " fk-step-location--columns" : ""}`}>
      <div className="fk-location-controls">
        <StepTitle image={step.image} title={title} />
        {subtitle && <p className="fk-subtitle"><FlowMarkdown text={subtitle} variant="block" /></p>}

        {searchBlock}

        {gpsButton}
        {gpsError && <p className="fk-gps-error">{gpsError}</p>}
      </div>

      {step.showMap !== false && (
        <div className="fk-map-card">
          <div
            ref={containerRef}
            className={`fk-map-canvas${mapResultPanel ? " fk-map-canvas--attached" : ""}`}
          />
          {mapResultPanel}
        </div>
      )}

      {gpsGuideOverlay}
    </div>
  )
}
