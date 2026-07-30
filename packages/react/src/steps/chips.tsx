import type { ChipsStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { useToggleSelection } from "./shared/selection"
import { FlowMarkdown } from "../markdown"
import { useRemoteOptions } from "./shared/use-remote-options"
import { RemoteLoadMoreButton, RemoteOptionsStatus, RemoteSearchInput } from "./shared/remote-options-ui"

export function ChipsStepView({ step, value, onChange, answers }: StepComponentProps<ChipsStep>) {
  const { selected, toggle } = useToggleSelection({ multiple: step.multiple }, value, onChange)
  const remote = useRemoteOptions(step.dataSource, answers)
  const options = remote.isRemote ? remote.options : step.options

  return (
    <div className="fk-step fk-step-chips">
      {step.title && <h2 className="fk-title"><FlowMarkdown text={step.title} variant="inline" /></h2>}
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
      <RemoteSearchInput remote={remote} />
      <RemoteOptionsStatus remote={remote} />
      <div className="fk-chips-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`fk-chip ${selected.includes(opt.value) ? "fk-chip-selected" : ""}`}
            onClick={() => toggle(opt.value)}
          >
            <FlowMarkdown text={opt.label} variant="inline" />
          </button>
        ))}
      </div>
      <RemoteLoadMoreButton remote={remote} />
    </div>
  )
}
