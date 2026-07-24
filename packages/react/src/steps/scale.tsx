import { useEffect } from "react"
import type { ScaleStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"

const defaultColors = ["#7D7A75", "#46A171", "#46A171", "#D5803B", "#D5803B", "#E56458", "#E56458"]

export function ScaleStepView({ step, value, onChange }: StepComponentProps<ScaleStep>) {
  const values = Array.from({ length: step.max - step.min + 1 }, (_, i) => step.min + i)
  const isSlider = step.variant === "slider"
  const current = typeof value === "number" ? value : Math.round((step.min + step.max) / 2)

  useEffect(() => {
    if (isSlider && typeof value !== "number") onChange(current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const idx = current - step.min
  const sliderLabel = step.valueLabels?.[idx] ?? ""
  const sliderColor = step.valueColors?.[idx] ?? defaultColors[idx] ?? "var(--fk-text)"

  // Header and min/max labels are identical in both variants: only the control between
  // them changes, so the two used to be a copy-pasted pair of full returns.
  return (
    <div className={`fk-step fk-step-scale${isSlider ? " fk-step-scale-slider" : ""}`}>
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}

      {isSlider ? (
        <>
          <div className="fk-scale-slider-value">
            <div className="fk-scale-n" style={{ color: sliderColor }}>
              {current}
            </div>
            {sliderLabel && (
              <div className="fk-scale-lab" style={{ color: sliderColor }}>
                {sliderLabel}
              </div>
            )}
          </div>
          <input
            className="fk-scale-range"
            type="range"
            min={step.min}
            max={step.max}
            value={current}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </>
      ) : (
        <div className="fk-scale-row">
          {values.map((n) => (
            <button
              key={n}
              type="button"
              className={`fk-scale-pill ${value === n ? "fk-scale-pill-selected" : ""}`}
              onClick={() => onChange(n)}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {(step.minLabel || step.maxLabel) && (
        <div className="fk-scale-labels">
          <span>{step.minLabel}</span>
          <span>{step.maxLabel}</span>
        </div>
      )}
    </div>
  )
}
