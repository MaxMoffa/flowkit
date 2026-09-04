import { asAddressValue, resolveText, type AddressStep, type AddressValue } from "@flowkit-io/core"
import type { StepComponentProps } from "../types"
import { FlowMarkdown } from "../markdown"
import { StepTitle } from "./shared/step-title"
import { useFieldValidation } from "./shared/use-field-validation"
import { FieldError } from "./shared/field-error"

type Field = keyof AddressValue

export function AddressStepView({
  step,
  value,
  onChange,
  flow,
  answers,
  meta,
  validationAttempt,
}: StepComponentProps<AddressStep>) {
  const current = asAddressValue(value) ?? ({ country: "" } as AddressValue)
  const { message, errorId, handleBlur, ariaProps } = useFieldValidation(
    step,
    value,
    flow,
    answers,
    meta,
    validationAttempt,
  )

  function patch(field: Field, next: string) {
    const merged: AddressValue = { ...current, [field]: next }
    // Drop empty optionals so the stored answer stays tidy.
    for (const key of ["postalCode", "state", "city", "line1", "line2"] as Field[]) {
      if (!merged[key]) delete merged[key]
    }
    onChange(merged.country || merged.line1 || merged.postalCode ? merged : null)
  }

  return (
    <div className="fk-step fk-step-address">
      <StepTitle image={step.image} title={step.title} />
      {step.subtitle && (
        <p className="fk-subtitle">
          <FlowMarkdown text={step.subtitle} variant="block" />
        </p>
      )}

      <div className="fk-address-grid" onBlur={handleBlur} {...ariaProps}>
        <label className="fk-address-field fk-address-field-wide">
          <span className="fk-address-label">{resolveText(flow, "addressCountry")}</span>
          {step.countries ? (
            <select
              className="fk-input"
              value={current.country}
              onChange={(event) => patch("country", event.target.value)}
            >
              <option value="" disabled />
              {step.countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="fk-input"
              autoComplete="country"
              maxLength={2}
              placeholder="IT"
              value={current.country}
              onChange={(event) => patch("country", event.target.value.toUpperCase())}
            />
          )}
        </label>

        <label className="fk-address-field fk-address-field-wide">
          <span className="fk-address-label">{resolveText(flow, "addressLine1")}</span>
          <input
            className="fk-input"
            autoComplete="address-line1"
            value={current.line1 ?? ""}
            onChange={(event) => patch("line1", event.target.value)}
          />
        </label>

        <label className="fk-address-field fk-address-field-wide">
          <span className="fk-address-label">{resolveText(flow, "addressLine2")}</span>
          <input
            className="fk-input"
            autoComplete="address-line2"
            value={current.line2 ?? ""}
            onChange={(event) => patch("line2", event.target.value)}
          />
        </label>

        <label className="fk-address-field">
          <span className="fk-address-label">{resolveText(flow, "addressPostalCode")}</span>
          <input
            className="fk-input"
            autoComplete="postal-code"
            value={current.postalCode ?? ""}
            onChange={(event) => patch("postalCode", event.target.value)}
          />
        </label>

        <label className="fk-address-field">
          <span className="fk-address-label">{resolveText(flow, "addressCity")}</span>
          <input
            className="fk-input"
            autoComplete="address-level2"
            value={current.city ?? ""}
            onChange={(event) => patch("city", event.target.value)}
          />
        </label>

        <label className="fk-address-field fk-address-field-wide">
          <span className="fk-address-label">{resolveText(flow, "addressState")}</span>
          <input
            className="fk-input"
            autoComplete="address-level1"
            value={current.state ?? ""}
            onChange={(event) => patch("state", event.target.value)}
          />
        </label>
      </div>

      <FieldError id={errorId} message={message} />
    </div>
  )
}
