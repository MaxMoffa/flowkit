/** Shared completed-step checkmark — replaces the plain "✓" character inside
 *  `.fk-progress-step-circle`. Has to stay legible filling a 20-24px accent-filled dot. */
export function ProgressCheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 12.2l4 4 8-8.4" />
    </svg>
  )
}
