import { useEffect, useMemo, useState } from "react"
import { FlowRunner } from "@flowkit-io/react"
import { themes, type ThemeMode } from "@flowkit-io/themes"
import { createLocalAdapter } from "@flowkit-io/adapters"
import type { Answers, Flow } from "@flowkit-io/core"
import { loadPreset, presetKeys } from "./presets-registry"
import { ensureOptInStepsRegistered } from "./opt-in-steps"
import { buildStepPreviewFlow } from "./step-preview-flow"

type SimWidth = 390 | 768 | 1024 | null

const adapter = createLocalAdapter({ namespace: "flowkit-playground" })

function readParams() {
  const params = new URLSearchParams(window.location.search)
  const presetKey = params.get("preset")
  const stepPreviewType = params.get("stepPreview")
  const themeKey = params.get("theme")
  const modeParam = params.get("mode")
  const chromeParam = params.get("chrome")
  return {
    presetKey: presetKey && presetKeys.includes(presetKey) ? presetKey : "odori",
    stepPreviewType,
    themeKey: themeKey && themeKey in themes ? themeKey : "notion-clean",
    mode: (modeParam === "dark" ? "dark" : "light") as ThemeMode,
    // A step preview is meant to be embedded (docs page iframe): chromeless by default.
    // A regular preset fullscreen preview keeps the toolbar by default. Either can be
    // forced with ?chrome=0|1.
    showChrome: chromeParam !== null ? chromeParam !== "0" : !stepPreviewType,
  }
}

/** Loads either a full preset (?preset=) or a single step type's minimal preview flow
 *  (?stepPreview=<type>, see step-preview-flow.ts) and registers whatever opt-in step
 *  components it needs. Returns null while loading, or if `stepPreviewType` names a
 *  type with no visual preview (e.g. "branch"). */
function useFullscreenFlow(presetKey: string, stepPreviewType: string | null): Flow | null {
  const [flow, setFlow] = useState<Flow | null>(null)

  useEffect(() => {
    let cancelled = false
    setFlow(null)
    const flowPromise = stepPreviewType
      ? Promise.resolve(buildStepPreviewFlow(stepPreviewType))
      : loadPreset(presetKey)
    void flowPromise
      .then(async (loaded) => {
        if (!loaded) return null
        await ensureOptInStepsRegistered(loaded)
        return loaded
      })
      .then((loaded) => {
        if (!cancelled) setFlow(loaded)
      })
    return () => {
      cancelled = true
    }
  }, [presetKey, stepPreviewType])

  return flow
}

export function FullscreenPreview() {
  const [{ presetKey, stepPreviewType, themeKey, mode, showChrome }] = useState(readParams)
  const [simWidth, setSimWidth] = useState<SimWidth>(stepPreviewType ? 390 : null)

  const theme = themes[themeKey]!
  const flow = useFullscreenFlow(presetKey, stepPreviewType)

  const onSubmit = useMemo(
    () => async (answers: Answers) => {
      if (flow && !stepPreviewType) await adapter.submit(flow.id, answers)
    },
    [flow, stepPreviewType],
  )

  return (
    <div className="pg-fs-page" data-pg-mode={mode}>
      {showChrome && (
        <div className="pg-fullscreen-bar">
          <div className="pg-fullscreen-sim">
            <button
              type="button"
              className={`pg-btn ${simWidth === 390 ? "pg-sim-active" : ""}`}
              onClick={() => setSimWidth(390)}
            >
              Mobile 390px
            </button>
            <button
              type="button"
              className={`pg-btn ${simWidth === 768 ? "pg-sim-active" : ""}`}
              onClick={() => setSimWidth(768)}
            >
              Tablet 768px
            </button>
            <button
              type="button"
              className={`pg-btn ${simWidth === 1024 ? "pg-sim-active" : ""}`}
              onClick={() => setSimWidth(1024)}
            >
              Desktop 1024px
            </button>
            <button
              type="button"
              className={`pg-btn ${simWidth === null ? "pg-sim-active" : ""}`}
              onClick={() => setSimWidth(null)}
            >
              Desktop (100%)
            </button>
          </div>
          <a className="pg-btn" href="./" aria-label="Torna al playground">
            ← Torna al playground
          </a>
        </div>
      )}
      <div className="pg-fullscreen-frame" style={{ width: simWidth ?? "100%" }}>
        {flow && (
          <FlowRunner
            key={`fullscreen-${presetKey}-${stepPreviewType}`}
            flow={flow}
            theme={theme}
            mode={mode}
            initialStep={stepPreviewType ? "preview" : undefined}
            onSubmit={onSubmit}
          />
        )}
      </div>
    </div>
  )
}
