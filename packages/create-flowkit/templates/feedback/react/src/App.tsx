import { FlowRunner } from "@flowkit-io/react"
import { themes } from "@flowkit-io/themes"
import { createLocalAdapter } from "@flowkit-io/adapters"
import { feedbackFlow } from "@flowkit-io/presets"

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
