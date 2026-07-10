import { useMemo, useState } from "react"
import { FlowRunner } from "@flowkit/react"
import { themes, type ThemeMode } from "@flowkit/themes"
import { createLocalAdapter } from "@flowkit/adapters"
import type { Answers } from "@flowkit/core"
import { presets, presetLabels } from "./presets-registry"

const adapter = createLocalAdapter({ namespace: "flowkit-playground" })

export function App() {
  const [presetKey, setPresetKey] = useState<keyof typeof presets>("odori")
  const [themeKey, setThemeKey] = useState<keyof typeof themes>("notion-clean")
  const [mode, setMode] = useState<ThemeMode>("light")
  const [runKey, setRunKey] = useState(0)
  const [lastSubmission, setLastSubmission] = useState<Answers | null>(null)

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
        <button
          type="button"
          className="pg-btn"
          onClick={() => setMode((m) => (m === "light" ? "dark" : "light"))}
        >
          {mode === "light" ? "🌙 Scuro" : "☀️ Chiaro"}
        </button>
        <button type="button" className="pg-btn" onClick={restart}>
          ↺ Ricomincia
        </button>
        <a
          className="pg-btn"
          href={`fullscreen.html?preset=${presetKey}&theme=${themeKey}&mode=${mode}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Anteprima fullscreen"
        >
          ⛶ Anteprima fullscreen
        </a>
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
    </div>
  )
}
