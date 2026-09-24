import { useEffect, useMemo, useRef, useState } from "react"
import { FlowRunner, type FlowRunnerHandle } from "@flowkit-io/react"
import { FlowOverlay, type FlowOverlayPresentation } from "@flowkit-io/react/overlay"
import { themes, type Theme, type ThemeMode, type ThemeTokens } from "@flowkit-io/themes"
import { createLocalAdapter } from "@flowkit-io/adapters"
import type { Answers, CurrentStepInfo, Flow, Locale } from "@flowkit-io/core"
import { loadPreset, presetKeys, presetLabels } from "./presets-registry"
import { ensureOptInStepsRegistered } from "./opt-in-steps"
import { simulateStripeTestCardOutcome } from "./simulate-stripe-decline"
import { simulateStripe3dsOutcome } from "./simulate-stripe-3ds"

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
/** Stands in for the platform's server-side IP geolocation (see
 *  `FlowRunnerProps.estimatedAddress`) — the playground has no server of its own, so
 *  this is read from the URL instead. Read by e2e/catalog-tax-estimate.spec.ts; also
 *  handy to poke at manually, e.g. `?preset=catalog-demo&estimatedCountry=FR`. */
const debugEstimatedCountry = debugParams.get("estimatedCountry") ?? undefined

/** Every setting a visitor can override on top of whatever preset is selected —
 *  applies uniformly to all of them, see `applyCustomization` below. `"default"`
 *  always means "leave the preset's own value alone". */
interface Customization {
  progressVariant: "default" | "bar" | "dots" | "steps" | "segments" | "hidden"
  progressPosition: "default" | "header" | "footer"
  haptics: boolean
  disableBack: "default" | "on" | "off"
  errorScreen: "default" | "on" | "off"
  locale: "default" | Locale
  submitLabel: string
  continueLabel: string
  backLabel: string
  extraTexts: string
}

const defaultCustomization: Customization = {
  progressVariant: "default",
  progressPosition: "default",
  haptics: true,
  disableBack: "default",
  errorScreen: "default",
  locale: "default",
  submitLabel: "",
  continueLabel: "",
  backLabel: "",
  extraTexts: "",
}

/** Layers the visitor's panel choices onto a preset's own flow, without mutating it —
 *  a shallow clone per changed field. `flow.steps` is only touched (and only its
 *  `review`-typed entries) when `submitLabel` is set. */
function applyFlowCustomization(flow: Flow, c: Customization, extraTexts: Record<string, string>): Flow {
  const texts = { ...flow.texts, ...extraTexts }
  if (c.continueLabel.trim()) texts.continue = c.continueLabel.trim()
  if (c.backLabel.trim()) texts.back = c.backLabel.trim()
  return {
    ...flow,
    disableBack: c.disableBack === "default" ? flow.disableBack : c.disableBack === "on",
    errorScreen:
      c.errorScreen === "default" ? flow.errorScreen : c.errorScreen === "on" ? flow.errorScreen ?? {} : undefined,
    texts,
    steps: c.submitLabel.trim()
      ? flow.steps.map((step) =>
          step.type === "review" ? { ...step, submitLabel: c.submitLabel.trim() } : step,
        )
      : flow.steps,
  }
}

/** Same idea for the theme: only `layout.progressVariant`/`progressPosition`, on both
 *  modes, and only the ones set away from `"default"`. */
function applyThemeCustomization(theme: Theme, c: Customization): Theme {
  if (c.progressVariant === "default" && c.progressPosition === "default") return theme
  const withLayout = (tokens: ThemeTokens): ThemeTokens => ({
    ...tokens,
    layout: {
      ...tokens.layout,
      ...(c.progressVariant !== "default" ? { progressVariant: c.progressVariant } : {}),
      ...(c.progressPosition !== "default" ? { progressPosition: c.progressPosition } : {}),
    },
  })
  return { ...theme, light: withLayout(theme.light), dark: withLayout(theme.dark) }
}

export function App() {
  const [presetKey, setPresetKey] = useState<string>("odori")
  const [themeKey, setThemeKey] = useState<keyof typeof themes>("warm-paper")
  const [mode, setMode] = useState<ThemeMode>("light")
  const [runKey, setRunKey] = useState(0)
  const [lastSubmission, setLastSubmission] = useState<Answers | null>(null)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [overlayPresentation, setOverlayPresentation] = useState<FlowOverlayPresentation>("auto")
  const [overlayFixedHeight, setOverlayFixedHeight] = useState(true)
  const [customization, setCustomization] = useState<Customization>(defaultCustomization)
  const flowRunnerRef = useRef<FlowRunnerHandle>(null)

  function patchCustomization(patch: Partial<Customization>) {
    setCustomization((c) => ({ ...c, ...patch }))
  }

  const { extraTexts, extraTextsError } = useMemo((): {
    extraTexts: Record<string, string>
    extraTextsError: string | null
  } => {
    const raw = customization.extraTexts.trim()
    if (!raw) return { extraTexts: {}, extraTextsError: null }
    try {
      const parsed = JSON.parse(raw) as unknown
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return { extraTexts: {}, extraTextsError: 'Deve essere un oggetto JSON piatto, es. {"submit": "Vai!"}' }
      }
      return { extraTexts: parsed as Record<string, string>, extraTextsError: null }
    } catch {
      return { extraTexts: {}, extraTextsError: "JSON non valido" }
    }
  }, [customization.extraTexts])

  const isOverlayDemo = presetKey === "flow-overlay-demo"

  const theme = themes[themeKey]!

  const themeOptions = useMemo(() => Object.entries(themes).filter(([k]) => k !== "showcase"), [])

  const customizedTheme = useMemo(() => applyThemeCustomization(theme, customization), [theme, customization])

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

  const customizedFlow = useMemo(
    () => (flow ? applyFlowCustomization(flow, customization, extraTexts) : null),
    [flow, customization, extraTexts],
  )
  const hasReviewStep = flow?.steps.some((step) => step.type === "review") ?? false

  function restart() {
    setRunKey((k) => k + 1)
    setOverlayOpen(false)
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

      <div className="pg-layout">
      <div className="pg-panel">
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
        <div className="pg-controls-theme">
          <span className="pg-controls-theme-label">Tema</span>
          <div className="pg-swatches">
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
        </div>
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

      <div className="pg-customize">
          <p className="pg-customize-hint">
            Vale per qualunque preset qui sopra: sovrascrive la config del flow selezionato,
            senza toccarne la sorgente.
          </p>
          <div className="pg-customize-grid">
            <fieldset>
              <legend>Progresso</legend>
              <label>
                Stile
                <select
                  aria-label="Stile progresso"
                  value={customization.progressVariant}
                  onChange={(e) =>
                    patchCustomization({
                      progressVariant: e.target.value as Customization["progressVariant"],
                    })
                  }
                >
                  <option value="default">Del tema (default)</option>
                  <option value="bar">Barra</option>
                  <option value="dots">Puntini</option>
                  <option value="steps">Numerato (cerchi)</option>
                  <option value="segments">Barra segmentata</option>
                  <option value="hidden">Nascosto</option>
                </select>
              </label>
              <label>
                Posizione
                <select
                  aria-label="Posizione progresso"
                  value={customization.progressPosition}
                  onChange={(e) =>
                    patchCustomization({
                      progressPosition: e.target.value as Customization["progressPosition"],
                    })
                  }
                >
                  <option value="default">Del tema (default)</option>
                  <option value="header">Header</option>
                  <option value="footer">Footer</option>
                </select>
              </label>
            </fieldset>

            <fieldset>
              <legend>Comportamento</legend>
              <label className="pg-customize-check">
                <input
                  type="checkbox"
                  checked={customization.haptics}
                  onChange={(e) => patchCustomization({ haptics: e.target.checked })}
                />
                Vibrazione sui pulsanti
              </label>
              <label>
                Navigazione indietro
                <select
                  aria-label="Navigazione indietro"
                  value={customization.disableBack}
                  onChange={(e) =>
                    patchCustomization({ disableBack: e.target.value as Customization["disableBack"] })
                  }
                >
                  <option value="default">Del preset (default)</option>
                  <option value="off">Consentita</option>
                  <option value="on">Disabilitata</option>
                </select>
              </label>
              <label>
                Schermata di errore
                <select
                  aria-label="Schermata di errore generica"
                  value={customization.errorScreen}
                  onChange={(e) =>
                    patchCustomization({ errorScreen: e.target.value as Customization["errorScreen"] })
                  }
                >
                  <option value="default">Del preset (default)</option>
                  <option value="on">Attiva</option>
                  <option value="off">Disattiva (footer)</option>
                </select>
              </label>
              <label>
                Lingua
                <select
                  aria-label="Lingua"
                  value={customization.locale}
                  onChange={(e) =>
                    patchCustomization({ locale: e.target.value as Customization["locale"] })
                  }
                >
                  <option value="default">Del preset (default)</option>
                  <option value="it">Italiano</option>
                  <option value="en">Inglese</option>
                </select>
              </label>
            </fieldset>

            <fieldset>
              <legend>Testi &amp; pulsanti</legend>
              <label>
                Pulsante &quot;Continua&quot;
                <input
                  type="text"
                  placeholder="Continua"
                  value={customization.continueLabel}
                  onChange={(e) => patchCustomization({ continueLabel: e.target.value })}
                />
              </label>
              <label>
                Pulsante &quot;Indietro&quot;
                <input
                  type="text"
                  placeholder="Indietro"
                  value={customization.backLabel}
                  onChange={(e) => patchCustomization({ backLabel: e.target.value })}
                />
              </label>
              <label>
                Pulsante invio (step review){!hasReviewStep && " — nessuno in questo preset"}
                <input
                  type="text"
                  placeholder="Invia"
                  disabled={!hasReviewStep}
                  value={customization.submitLabel}
                  onChange={(e) => patchCustomization({ submitLabel: e.target.value })}
                />
              </label>
              <label>
                Altri testi (JSON, chiave da <code>core/i18n.ts</code>)
                <textarea
                  aria-label="Altri testi, come JSON"
                  rows={3}
                  placeholder={'{"submitWithPayment": "Paga ora"}'}
                  value={customization.extraTexts}
                  onChange={(e) => patchCustomization({ extraTexts: e.target.value })}
                />
              </label>
              {extraTextsError && <p className="pg-customize-error">{extraTextsError}</p>}
            </fieldset>
          </div>
          <button
            type="button"
            className="pg-btn"
            onClick={() => {
              setCustomization(defaultCustomization)
              restart()
            }}
          >
            Ripristina personalizzazioni
          </button>
        </div>
      </div>

      <div className="pg-preview">
      <div
        className="pg-phone"
        style={{
          background: mode === "dark" ? customizedTheme.dark.canvas : customizedTheme.light.canvas,
          color: mode === "dark" ? customizedTheme.dark.text : customizedTheme.light.text,
        }}
      >
        <div className="pg-notch" />
        <div className="pg-statusbar">
          <span>9:41</span>
          <span>{customizedFlow?.title ?? "Caricamento…"}</span>
        </div>
        <div className="pg-frame">
          {customizedFlow && isOverlayDemo && (
            <div className="pg-overlay-demo">
              <p>
                Lo stesso flow, mostrato come drawer dal basso o come dialog centrato
                tramite <code>&lt;FlowOverlay&gt;</code> (<code>@flowkit-io/react/overlay</code>).
              </p>
              <label>
                Presentazione
                <select
                  aria-label="Presentazione overlay"
                  value={overlayPresentation}
                  onChange={(e) =>
                    setOverlayPresentation(e.target.value as FlowOverlayPresentation)
                  }
                >
                  <option value="auto">auto (drawer &lt; 640px, dialog ≥ 640px)</option>
                  <option value="drawer">drawer</option>
                  <option value="dialog">dialog</option>
                  <option value="fullscreen">fullscreen</option>
                </select>
              </label>
              <label className="pg-overlay-demo-check">
                <input
                  type="checkbox"
                  checked={overlayFixedHeight}
                  onChange={(e) => setOverlayFixedHeight(e.target.checked)}
                />
                Altezza fissa (aspect ratio verticale)
              </label>
              <button type="button" className="pg-btn" onClick={() => setOverlayOpen(true)}>
                Apri flow
              </button>
              <FlowOverlay
                open={overlayOpen}
                onOpenChange={setOverlayOpen}
                presentation={overlayPresentation}
                showTitle
                fixedHeight={overlayFixedHeight}
                flow={customizedFlow}
                theme={customizedTheme}
                mode={mode}
                haptics={customization.haptics}
                locale={customization.locale === "default" ? undefined : customization.locale}
                onSubmit={async (answers) => {
                  simulateStripeTestCardOutcome(customizedFlow, answers)
                  simulateStripe3dsOutcome(customizedFlow, answers)
                  await adapter.submit(customizedFlow.id, answers)
                  setLastSubmission(answers)
                }}
              />
            </div>
          )}
          {customizedFlow && !isOverlayDemo && (
            <FlowRunner
              key={`${presetKey}-${runKey}`}
              ref={(handle) => {
                flowRunnerRef.current = handle
                // Debug hook, read by e2e/flow-runner-resume.spec.ts — not part of the
                // public API, no effect on rendering.
                ;(window as unknown as { __flowkitRunner?: FlowRunnerHandle | null }).__flowkitRunner = handle
              }}
              flow={customizedFlow}
              theme={customizedTheme}
              mode={mode}
              haptics={customization.haptics}
              locale={customization.locale === "default" ? undefined : customization.locale}
              initialStep={debugInitialStep}
              initialAnswers={debugInitialAnswers}
              estimatedAddress={debugEstimatedCountry ? { country: debugEstimatedCountry } : undefined}
              onSubmit={async (answers) => {
                // Client-side stand-ins for a backend PaymentIntent.confirm(): a decline
                // (→ generic error screen) and an SCA card that needs 3D Secure (→
                // FlowRunner runs the challenge and re-submits, see simulate-stripe-3ds.ts).
                simulateStripeTestCardOutcome(customizedFlow, answers)
                simulateStripe3dsOutcome(customizedFlow, answers)
                await adapter.submit(customizedFlow.id, answers)
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

      {lastSubmission && (
        <pre className="pg-debug">{JSON.stringify(lastSubmission, null, 2)}</pre>
      )}
      </div>
      </div>

      <footer className="pg-footer">
        <a href="https://github.com/MaxMoffa/flowkit" target="_blank" rel="noreferrer">
          Codice su GitHub
        </a>
      </footer>
    </div>
  )
}
