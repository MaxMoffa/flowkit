import { parseFlow } from "@flowkit-io/core"
import type { Flow, Step } from "@flowkit-io/core"
import { stepPreviewConfigs } from "./step-preview-configs"

/** Generic wrapper steps, only used to satisfy parseFlow's structural rules (first step
 *  role "intro", last step role "confirmation") for a type that isn't itself one of
 *  those two roles. `parseStep`/`parseFlow` always return newly parsed objects (zod
 *  `.parse()` never mutates its input), so reusing these same two literals across every
 *  call is safe — nothing here is ever mutated in place. */
const shellIntroStep: Step = { id: "shell-intro", type: "intro", title: "Anteprima" } as Step
const shellConfirmationStep: Step = { id: "shell-confirmation", type: "confirmation" } as Step

/**
 * Builds a minimal, valid `Flow` that renders `type`'s example config (see
 * step-preview-configs.ts) as the step FlowRunner starts on (`initialStep: "preview"`,
 * every entry's `id`) — used by fullscreen-preview.tsx's `?stepPreview=<type>` mode,
 * which backs the live preview embedded on each type's docs page.
 *
 * Returns null for a type with no preview config (currently just "branch": role
 * "logic", invisible, resolved and skipped before it would ever render — nothing to
 * show).
 */
export function buildStepPreviewFlow(type: string): Flow | null {
  const previewStep = stepPreviewConfigs[type]
  if (!previewStep) return null

  const steps: Step[] =
    type === "intro"
      ? [previewStep, shellConfirmationStep]
      : type === "confirmation"
        ? [shellIntroStep, previewStep]
        : [shellIntroStep, previewStep, shellConfirmationStep]

  return parseFlow({
    id: `step-preview-${type}`,
    title: `Anteprima: ${type}`,
    steps,
  })
}
