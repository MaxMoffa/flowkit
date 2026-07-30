import type { MultiSelectStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { OptionList } from "./shared/option-list"
import { useToggleSelection } from "./shared/selection"
import { FlowMarkdown } from "../markdown"
import { useRemoteOptions } from "./shared/use-remote-options"
import { RemoteLoadMoreButton, RemoteOptionsStatus, RemoteSearchInput } from "./shared/remote-options-ui"

export function MultiSelectStepView({ step, value, onChange, answers }: StepComponentProps<MultiSelectStep>) {
  const { selected, toggle, maxReached } = useToggleSelection(
    { multiple: true, max: step.max },
    value,
    onChange,
  )
  const remote = useRemoteOptions(step.dataSource, answers)
  const options = remote.isRemote ? remote.options : step.options

  return (
    <div className="fk-step fk-step-multi-select">
      {step.title && <h2 className="fk-title"><FlowMarkdown text={step.title} variant="inline" /></h2>}
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
      <RemoteSearchInput remote={remote} />
      <RemoteOptionsStatus remote={remote} />
      <OptionList
        options={options}
        inputType="checkbox"
        isSelected={(v) => selected.includes(v)}
        onPick={toggle}
        isDisabled={(v) => maxReached && !selected.includes(v)}
      />
      <RemoteLoadMoreButton remote={remote} />
    </div>
  )
}
