/** Shared rescan/retry icon — replaces the 🔄 emoji on the barcode-scan step's
 *  "scan again" button. */
export function RefreshIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.4 7.2A7.4 7.4 0 0 0 5 10.4" />
      <path d="M6.6 16.8A7.4 7.4 0 0 0 19 13.6" />
      <path d="M17 4.4l.4 2.8-2.8.6" />
      <path d="M7 19.6l-.4-2.8 2.8-.6" />
    </svg>
  )
}
