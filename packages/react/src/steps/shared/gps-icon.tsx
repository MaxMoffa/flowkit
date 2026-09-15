/** Shared GPS-trigger icon — replaces the 📍 emoji in `.fk-gps-btn`
 *  (`location-step-layout.tsx`), a crosshair-target outline SVG so it renders
 *  identically across platforms/fonts instead of relying on the OS's own emoji glyph. */
export function GpsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="6.2" />
      <path d="M12 2.2v3.4M12 18.4v3.4M2.2 12h3.4M18.4 12h3.4" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}
