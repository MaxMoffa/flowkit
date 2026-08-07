import type { CSSProperties } from "react"

/**
 * Bridges an option's `color` (schema.ts's `optionSchema.color`, a free-form CSS
 * color string) onto the `--fk-option-color` custom property so the CSS in
 * style.css can tint the whole card/chip/list-item container — not just the small
 * swatch dot it used to be limited to. Returns `undefined` when the option has no
 * color, so unset options keep rendering with zero style overrides (no regression
 * for existing configs).
 */
export function optionColorStyle(color?: string): CSSProperties | undefined {
  if (!color) return undefined
  return { "--fk-option-color": color } as CSSProperties
}

/**
 * The modifier class style.css keys its per-option color rules off (`.fk-card
 * .fk-option-colored`, `.fk-chip.fk-option-colored`, `.fk-list-item.fk-option-colored`)
 * — always paired with `optionColorStyle` on the same element. Returns `""` when the
 * option has no color, so it's safe to append directly onto a className template.
 */
export function optionColorClass(color?: string): string {
  return color ? "fk-option-colored" : ""
}
