import { FlowRunner } from "@flowkit/react"
import { themes } from "@flowkit/themes"
import { createLocalAdapter } from "@flowkit/adapters"
import { feedbackFlow } from "@flowkit/presets"

const adapter = createLocalAdapter({ namespace: "my-flowkit-app" })

export function App() {
  return (
    <FlowRunner
      flow={feedbackFlow}
      theme={themes["notion-clean"]}
      onSubmit={async (answers) => {
        await adapter.submit(feedbackFlow.id, answers)
        console.log("Feedback inviato:", answers)
      }}
    />
  )
}
