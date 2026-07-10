import { useMemo, useState } from "react"
import { FlowRunner } from "@flowkit/react"
import { themes, type ThemeMode } from "@flowkit/themes"
import { createLocalAdapter } from "@flowkit/adapters"
import { odoriFlow, feedbackFlow } from "@flowkit/presets"
import type { Answers, Flow } from "@flowkit/core"
import { customStepDemoFlow } from "./custom-step-demo"
import { featuresDemoFlow } from "./features-demo"
import { customIntroDemoFlow } from "./custom-intro-demo"

const presets: Record<string, Flow> = {
  odori: odoriFlow,
  feedback: feedbackFlow,
  "custom-step": customStepDemoFlow,
  "features-demo": featuresDemoFlow,
  "custom-intro": customIntroDemoFlow,
}

const presetLabels: Record<string, string> = {
  odori: "Segnala odore",
  feedback: "Feedback",
  "custom-step": "Step custom (demo)",
  "features-demo": "OAuth + Mappa (demo)",
  "custom-intro": "Intro & conferma custom (demo)",
}

const adapter = createLocalAdapter({ namespace: "flowkit-playground" })

type SimWidth = 390 | 768 | null

export function App() {
  const [presetKey, setPresetKey] = useState<keyof typeof presets>("odori")
  const [themeKey, setThemeKey] = useState<keyof typeof themes>("notion-clean")
  const [mode, setMode] = useState<ThemeMode>("light")
  const [runKey, setRunKey] = useState(0)
  const [lastSubmission, setLastSubmission] = useState<Answers | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [simWidth, setSimWidth] = useState<SimWidth>(null)

  const flow = presets[presetKey]!
  const theme = themes[themeKey]!

  const themeOptions = useMemo(() => Object.entries(themes), [])

  function restart() {
    setRunKey((k) => k + 1)
  }

  return (
    <div className="pg-page" data-pg-mode={mode}>
      <header className="pg-hero">
        <p className="pg-eyebrow">Flowkit</p>
        <h1>Componi flow guidati, themeable, in pochi minuti.</h1>
        <p className="pg-hero-sub">
          Libreria React headless-first per costruire wizard mobile: config in TypeScript,
          rendering React, temi a variabili CSS. Prova i preset qui sotto, cambia tema e
          naviga il flow come farebbe un utente reale.
        </p>
      </header>

      <div className="pg-controls">
        <label>
          Preset
          <select
            aria-label="Preset"
            value={presetKey}
            onChange={(e) => {
              setPresetKey(e.target.value as keyof typeof presets)
              restart()
            }}
          >
            {Object.keys(presets).map((k) => (
              <option key={k} value={k}>
                {presetLabels[k] ?? k}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tema
          <select
            aria-label="Tema"
            value={themeKey}
            onChange={(e) => setThemeKey(e.target.value as keyof typeof themes)}
          >
            {themeOptions.map(([k, t]) => (
              <option key={k} value={k}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => setMode((m) => (m === "light" ? "dark" : "light"))}>
          {mode === "light" ? "🌙 Scuro" : "☀️ Chiaro"}
        </button>
        <button type="button" onClick={restart}>
          ↺ Ricomincia
        </button>
        <button type="button" onClick={() => setFullscreen(true)} aria-label="Anteprima fullscreen">
          ⛶ Anteprima fullscreen
        </button>
      </div>

      <div
        className="pg-phone"
        style={{
          background: mode === "dark" ? theme.dark.canvas : theme.light.canvas,
          color: mode === "dark" ? theme.dark.text : theme.light.text,
        }}
      >
        <div className="pg-notch" />
        <div className="pg-statusbar">
          <span>9:41</span>
          <span>{flow.title}</span>
        </div>
        <div className="pg-frame">
          <FlowRunner
            key={`${presetKey}-${runKey}`}
            flow={flow}
            theme={theme}
            mode={mode}
            onSubmit={async (answers) => {
              await adapter.submit(flow.id, answers)
              setLastSubmission(answers)
            }}
          />
        </div>
      </div>

      <div className="pg-theme-strip">
        {themeOptions.map(([k, t]) => (
          <button
            key={k}
            type="button"
            className={`pg-swatch ${k === themeKey ? "pg-swatch-active" : ""}`}
            onClick={() => setThemeKey(k as keyof typeof themes)}
            style={{
              background: mode === "dark" ? t.dark.canvas : t.light.canvas,
              borderColor: mode === "dark" ? t.dark.accent : t.light.accent,
            }}
            title={t.label}
          >
            <span style={{ background: mode === "dark" ? t.dark.accent : t.light.accent }} />
            {t.label}
          </button>
        ))}
      </div>

      {lastSubmission && (
        <pre className="pg-debug">{JSON.stringify(lastSubmission, null, 2)}</pre>
      )}

      <footer className="pg-footer">
        <a href="https://github.com/MaxMoffa/flowkit" target="_blank" rel="noreferrer">
          Codice su GitHub
        </a>
      </footer>

      {fullscreen && (
        <div className="pg-fullscreen-overlay" data-pg-mode={mode}>
          <div className="pg-fullscreen-bar">
            <div className="pg-fullscreen-sim">
              <button
                type="button"
                className={simWidth === 390 ? "pg-sim-active" : ""}
                onClick={() => setSimWidth(390)}
              >
                Mobile 390px
              </button>
              <button
                type="button"
                className={simWidth === 768 ? "pg-sim-active" : ""}
                onClick={() => setSimWidth(768)}
              >
                Tablet 768px
              </button>
              <button
                type="button"
                className={simWidth === null ? "pg-sim-active" : ""}
                onClick={() => setSimWidth(null)}
              >
                Desktop (100%)
              </button>
            </div>
            <button type="button" onClick={() => setFullscreen(false)} aria-label="Chiudi anteprima fullscreen">
              ✕ Chiudi
            </button>
          </div>
          <div className="pg-fullscreen-frame" style={{ width: simWidth ?? "100%" }}>
            <FlowRunner
              key={`fullscreen-${presetKey}-${runKey}`}
              flow={flow}
              theme={theme}
              mode={mode}
              onSubmit={async (answers) => {
                await adapter.submit(flow.id, answers)
                setLastSubmission(answers)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
