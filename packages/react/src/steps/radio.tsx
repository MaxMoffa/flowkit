import type { RadioStep } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { OptionList } from "./shared/option-list"
import { FlowMarkdown } from "../markdown"
import { useRemoteOptions } from "./shared/use-remote-options"
import { RemoteLoadMoreButton, RemoteOptionsStatus, RemoteSearchInput } from "./shared/remote-options-ui"

export function RadioStepView({ step, value, onChange, answers }: StepComponentProps<RadioStep>) {
  const selected = typeof value === "string" ? value : undefined
  const remote = useRemoteOptions(step.dataSource, answers)
  const options = remote.isRemote ? remote.options : step.options

  return (
    <div className="fk-step fk-step-radio">
      {step.title && <h2 className="fk-title"><FlowMarkdown text={step.title} variant="inline" /></h2>}
      {step.subtitle && <p className="fk-subtitle"><FlowMarkdown text={step.subtitle} variant="block" /></p>}
      <RemoteSearchInput remote={remote} />
      <RemoteOptionsStatus remote={remote} />
      <OptionList
        options={options}
        inputType="radio"
        name={step.id}
        isSelected={(v) => selected === v}
        onPick={onChange}
      />
      <RemoteLoadMoreButton remote={remote} />
    </div>
  )
}
