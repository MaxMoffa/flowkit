/** Shared delete/trash icon — replaces the 🗑️ emoji on the signature "Cancella" button
 *  and the media viewer's delete button. */
export function TrashIcon() {
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
      <path d="M5 7h14" />
      <path d="M9.5 7V5.6a1.6 1.6 0 0 1 1.6-1.6h1.8a1.6 1.6 0 0 1 1.6 1.6V7" />
      <path d="M7 7l.9 12.4A2 2 0 0 0 9.9 21h4.2a2 2 0 0 0 2-1.6L17 7" />
    </svg>
  )
}
