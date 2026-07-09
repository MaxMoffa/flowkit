import { useMemo, useState } from "react"
import { FlowRunner } from "@flowkit/react"
import { themes, type ThemeMode } from "@flowkit/themes"
import { createLocalAdapter } from "@flowkit/adapters"
import { odoriFlow, feedbackFlow } from "@flowkit/presets"
import type { Answers, Flow } from "@flowkit/core"

const presets: Record<string, Flow> = {
  odori: odoriFlow,
  feedback: feedbackFlow,
}

const adapter = createLocalAdapter({ namespace: "flowkit-playground" })

export function App() {
  const [presetKey, setPresetKey] = useState<keyof typeof presets>("odori")
  const [themeKey, setThemeKey] = useState<keyof typeof themes>("notion-clean")
  const [mode, setMode] = useState<ThemeMode>("light")
  const [runKey, setRunKey] = useState(0)
  const [lastSubmission, setLastSubmission] = useState<Answers | null>(null)

  const flow = presets[presetKey]!
  const theme = themes[themeKey]!

  const themeOptions = useMemo(() => Object.keys(themes), [])

  function restart() {
    setRunKey((k) => k + 1)
  }

  return (
    <div className="pg-page" data-pg-mode={mode}>
      <div className="pg-controls">
        <label>
          Preset
          <select
            value={presetKey}
            onChange={(e) => {
              setPresetKey(e.target.value as keyof typeof presets)
              restart()
            }}
          >
            <option value="odori">Segnala odore</option>
            <option value="feedback">Feedback</option>
          </select>
        </label>
        <label>
          Tema
          <select value={themeKey} onChange={(e) => setThemeKey(e.target.value as keyof typeof themes)}>
            {themeOptions.map((k) => (
              <option key={k} value={k}>
                {k}
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

      {lastSubmission && (
        <pre className="pg-debug">{JSON.stringify(lastSubmission, null, 2)}</pre>
      )}
    </div>
  )
}
