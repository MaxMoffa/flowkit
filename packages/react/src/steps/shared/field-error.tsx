/** Inline, field-anchored validation message. Renders nothing when there's no error —
 *  callers can mount it unconditionally next to the field it describes (see
 *  use-field-validation.ts's `errorId`/`ariaProps.aria-describedby`). */
export function FieldError({ id, message }: { id: string; message: string | null }) {
  if (!message) return null
  return (
    <p id={id} className="fk-field-error" role="alert">
      {message}
    </p>
  )
}
