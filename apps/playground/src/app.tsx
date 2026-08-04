import { useEffect, useMemo, useRef, useState } from "react"
import { FlowRunner, type FlowRunnerHandle } from "@flowkit-io/react"
import { themes, type ThemeMode } from "@flowkit-io/themes"
import { createLocalAdapter } from "@flowkit-io/adapters"
import type { Answers, CurrentStepInfo, Flow } from "@flowkit-io/core"
import { loadPreset, presetKeys, presetLabels } from "./presets-registry"
import { ensureOptInStepsRegistered } from "./opt-in-steps"

const adapter = createLocalAdapter({ namespace: "flowkit-playground" })

/** Debug-only, read once at module load: lets e2e/flow-runner-resume.spec.ts drive
 *  `initialStep`/`initialAnswers` via the URL instead of needing extra playground UI —
 *  not part of the public API, no effect outside the e2e harness. */
const debugParams = new URLSearchParams(window.location.search)
const debugInitialStep = debugParams.get("initialStep") ?? undefined
const debugInitialAnswers = (() => {
  const raw = debugParams.get("initialAnswers")
  if (!raw) return undefined
  try {
    return JSON.parse(raw) as Answers
  } catch {
    return undefined
  }
})()

export function App() {
  const [presetKey, setPresetKey] = useState<string>("odori")
  const [themeKey, setThemeKey] = useState<keyof typeof themes>("notion-clean")
  const [mode, setMode] = useState<ThemeMode>("light")
  const [runKey, setRunKey] = useState(0)
  const [lastSubmission, setLastSubmission] = useState<Answers | null>(null)
  const flowRunnerRef = useRef<FlowRunnerHandle>(null)

  const theme = themes[themeKey]!

  const themeOptions = useMemo(() => Object.entries(themes), [])

  /** Both the preset's flow config (code-split per demo, see presets-registry.ts) and
   *  its opt-in step components (maplibre-gl/leaflet/stripe/verification, see
   *  opt-in-steps.ts) are loaded on demand — `flow` stays null, and FlowRunner unmounted,
   *  until both resolve for the currently selected preset. */
  const [flow, setFlow] = useState<Flow | null>(null)
  useEffect(() => {
    let cancelled = false
    setFlow(null)
    void loadPreset(presetKey)
      .then(async (loaded) => {
        await ensureOptInStepsRegistered(loaded)
        return loaded
      })
      .then((loaded) => {
        if (!cancelled) setFlow(loaded)
      })
    return () => {
      cancelled = true
    }
  }, [presetKey])

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
              setPresetKey(e.target.value)
              restart()
            }}
          >
            {presetKeys.map((k) => (
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
          <span>{flow?.title ?? "Caricamento…"}</span>
        </div>
        <div className="pg-frame">
          {flow && (
            <FlowRunner
              key={`${presetKey}-${runKey}`}
              ref={(handle) => {
                flowRunnerRef.current = handle
                // Debug hook, read by e2e/flow-runner-resume.spec.ts — not part of the
                // public API, no effect on rendering.
                ;(window as unknown as { __flowkitRunner?: FlowRunnerHandle | null }).__flowkitRunner = handle
              }}
              flow={flow}
              theme={theme}
              mode={mode}
              initialStep={debugInitialStep}
              initialAnswers={debugInitialAnswers}
              onSubmit={async (answers) => {
                await adapter.submit(flow.id, answers)
                setLastSubmission(answers)
              }}
              onStepChange={(step) => {
                // Debug hook, read by e2e/flow-runner-step-change.spec.ts — not part of
                // the public API, no effect on rendering.
                ;(window as unknown as { __flowkitCurrentStep?: CurrentStepInfo }).__flowkitCurrentStep = step
              }}
            />
          )}
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
