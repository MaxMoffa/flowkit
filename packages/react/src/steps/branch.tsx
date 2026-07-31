import type { StepComponentProps } from "../types"

/** Invisible step (role: "logic"): FlowRunner resolves and jumps past it in a
 *  useLayoutEffect before paint (see flow-runner.tsx), so this never actually renders
 *  on screen — it exists only so scripted/registry consistency checks (spec-check) and
 *  StepView's lookup have a real component to find. */
export function BranchStepView(_props: StepComponentProps) {
  return null
}
