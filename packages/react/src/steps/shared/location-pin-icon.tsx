/** Shared location-pin icon — replaces the 📍 emoji used for the selected-address icon
 *  (`.fk-loc-ic` in location-step-layout.tsx) and the "permission blocked" dialog icon
 *  (`.fk-gps-guide-ic`, sized up via CSS on that container). */
export function LocationPinIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20.5S6 13.9 6 9.6a6 6 0 1 1 12 0c0 4.3-6 10.9-6 10.9Z" />
      <circle cx="12" cy="9.6" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}
