import { useMemo, useState } from "react"
import { FlowRunner } from "@flowkit-io/react"
import { themes, type ThemeMode } from "@flowkit-io/themes"
import { createLocalAdapter } from "@flowkit-io/adapters"
import type { Answers } from "@flowkit-io/core"
import { presets } from "./presets-registry"

type SimWidth = 390 | 768 | null

const adapter = createLocalAdapter({ namespace: "flowkit-playground" })

function readParams() {
  const params = new URLSearchParams(window.location.search)
  const presetKey = params.get("preset")
  const themeKey = params.get("theme")
  const mode = params.get("mode")
  return {
    presetKey: presetKey && presetKey in presets ? presetKey : "odori",
    themeKey: themeKey && themeKey in themes ? themeKey : "notion-clean",
    mode: (mode === "dark" ? "dark" : "light") as ThemeMode,
  }
}

export function FullscreenPreview() {
  const [{ presetKey, themeKey, mode }] = useState(readParams)
  const [simWidth, setSimWidth] = useState<SimWidth>(null)

  const flow = presets[presetKey]!
  const theme = themes[themeKey]!

  const onSubmit = useMemo(
    () => async (answers: Answers) => {
      await adapter.submit(flow.id, answers)
    },
    [flow.id],
  )

  return (
    <div className="pg-fs-page" data-pg-mode={mode}>
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
      <div className="pg-fullscreen-frame" style={{ width: simWidth ?? "100%" }}>
        <FlowRunner key={`fullscreen-${presetKey}`} flow={flow} theme={theme} mode={mode} onSubmit={onSubmit} />
      </div>
    </div>
  )
}
