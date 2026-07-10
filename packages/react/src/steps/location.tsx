import { useEffect, useState } from "react"
import type { LocationStep } from "@flowkit/core"
import type { StepComponentProps } from "../types"

export function LocationStepView({ step, value, onChange }: StepComponentProps<LocationStep>) {
  const [manual, setManual] = useState(false)
  const detected = step.detectedLabel ?? "Posizione rilevata"

  useEffect(() => {
    if (step.showMap && !manual && (value === null || value === undefined || value === "")) {
      onChange(detected)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fk-step fk-step-location">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}

      {step.showMap && !manual && (
        <>
          <div className="fk-map">
            <div className="fk-map-road r1" />
            <div className="fk-map-road r2" />
            <div className="fk-map-road r3" />
            <div className="fk-map-accuracy" />
            <svg className="fk-map-pin" width="34" height="44" viewBox="0 0 34 44">
              <path
                d="M17 0C7.6 0 0 7.6 0 17c0 12 17 27 17 27s17-15 17-27C34 7.6 26.4 0 17 0z"
                fill="var(--fk-accent)"
              />
              <circle cx="17" cy="17" r="6" fill="#fff" />
            </svg>
          </div>
          <div className="fk-loc-row">
            <div className="fk-loc-ic">📍</div>
            <div>
              <div className="fk-loc-title">{typeof value === "string" && value ? value : detected}</div>
              {step.detectedSubLabel && <div className="fk-loc-detail">{step.detectedSubLabel}</div>}
            </div>
          </div>
          <button type="button" className="fk-link" onClick={() => setManual(true)}>
            {step.manualEntryLabel ?? "Inserisci un indirizzo manualmente"}
          </button>
        </>
      )}

      {(!step.showMap || manual) && (
        <input
          className="fk-input"
          type="text"
          placeholder={step.placeholder ?? "Cerca un indirizzo"}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={manual}
        />
      )}
    </div>
  )
}
