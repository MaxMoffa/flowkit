import { FlowRunner } from "@flowkit/react"
import "@flowkit/react/style.css"
import { themes } from "@flowkit/themes"
import { createLocalAdapter } from "@flowkit/adapters"
import type { Flow } from "@flowkit/core"

const adapter = createLocalAdapter({ namespace: "my-app" })
const theme = themes["notion-clean"]

// Sostituisci con il tuo flow: vedi packages/presets o la sezione
// "Definire un flow" del README di flowkit per la struttura completa
// (step disponibili, config per tipo, temi, adapter).
const flow: Flow = {
  id: "my-flow",
  title: "Il mio flow",
  locale: "it",
  steps: [
    { id: "welcome", type: "intro", title: "Ciao!", cta: "Inizia" },
    { id: "end", type: "confirmation", title: "Grazie!" },
  ],
}

export function FlowkitDemo() {
  return (
    <FlowRunner
      flow={flow}
      theme={theme}
      onSubmit={async (answers) => {
        await adapter.submit(flow.id, answers)
      }}
    />
  )
}
