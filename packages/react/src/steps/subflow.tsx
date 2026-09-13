import type { StepComponentProps } from "../types"

/** Never actually rendered: `parseFlow` flattens every "subflow" step away before a
 *  parsed `Flow`'s own `steps` ever reaches FlowRunner (see schema.ts's
 *  `flattenSubflows`) — this exists only so registry consistency checks (spec-check)
 *  and StepView's lookup have a real component to find, same reason `BranchStepView`
 *  does for the "branch" (role: "logic") step. */
export function SubflowStepView(_props: StepComponentProps) {
  return null
}
