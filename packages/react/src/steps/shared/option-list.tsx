import { FlowMarkdown } from "../../markdown"

interface OptionListProps {
  options: { value: string; label: string; description?: string; color?: string }[]
  isSelected: (optionValue: string) => boolean
  onPick: (optionValue: string) => void
  /** "radio" also needs a shared group name so the browser links the inputs. */
  inputType: "radio" | "checkbox"
  name?: string
  isDisabled?: (optionValue: string) => boolean
}

/** The `.fk-list` rows shared by the radio and multi-select steps: same markup, same
 *  selected/disabled classes, only the input type and the pick semantics differ.
 *  `description`/`color` are optional per-option extras (schema.ts's optionSchema):
 *  left unset, an option renders exactly as before (no swatch, no description line). */
export function OptionList({
  options,
  isSelected,
  onPick,
  inputType,
  name,
  isDisabled,
}: OptionListProps) {
  return (
    <div className="fk-list">
      {options.map((opt) => {
        const selected = isSelected(opt.value)
        return (
          <label key={opt.value} className={`fk-list-item${selected ? " fk-list-item-selected" : ""}`}>
            <input
              type={inputType}
              className="fk-list-input"
              name={name}
              checked={selected}
              onChange={() => onPick(opt.value)}
              disabled={isDisabled?.(opt.value) ?? false}
            />
            {opt.color && (
              <span className="fk-option-swatch" style={{ backgroundColor: opt.color }} aria-hidden="true" />
            )}
            {opt.description ? (
              <span className="fk-list-text">
                <span className="fk-list-label"><FlowMarkdown text={opt.label} variant="inline" /></span>
                <span className="fk-list-description"><FlowMarkdown text={opt.description} variant="block" /></span>
              </span>
            ) : (
              <span className="fk-list-label"><FlowMarkdown text={opt.label} variant="inline" /></span>
            )}
          </label>
        )
      })}
    </div>
  )
}
