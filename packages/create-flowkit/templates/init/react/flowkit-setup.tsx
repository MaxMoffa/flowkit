import { FlowRunner } from "@flowkit/react"
import "@flowkit/react/style.css"
import { themes } from "@flowkit/themes"
import { createLocalAdapter } from "@flowkit/adapters"
import type { Flow } from "@flowkit/core"

const adapter = createLocalAdapter({ namespace: "my-app" })
const theme = themes["notion-clean"]

// Replace with your own flow: see packages/presets or the "Defining a flow"
// section of the flowkit README for the full structure (available steps,
// per-type config, themes, adapters).
const flow: Flow = {
  id: "my-flow",
  title: "My flow",
  locale: "en",
  steps: [
    { id: "welcome", type: "intro", title: "Hello!", cta: "Start" },
    { id: "end", type: "confirmation", title: "Thank you!" },
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
