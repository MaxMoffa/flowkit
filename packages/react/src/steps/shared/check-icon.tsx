/** Shared success/result-check icon — replaces the ✅ emoji used as a dedicated result
 *  icon on the barcode-scan "found" state (sized up via CSS on `.fk-barcode-result-icon`)
 *  and the verification step's "completed" card. */
export function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.6 12.6l4.8 4.8L19.4 7" />
    </svg>
  )
}
