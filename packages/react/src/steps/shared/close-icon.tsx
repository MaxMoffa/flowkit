/** Shared close/dismiss icon — replaces the raw "✕" character used across overlay,
 *  media/file/signature/photo remove buttons, the media viewer, and SheetDialog. */
export function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}
