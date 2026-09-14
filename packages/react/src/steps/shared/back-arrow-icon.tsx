/** Shared "back" arrow glyph — header's `.fk-back` (mobile) and the footer's
 *  `.fk-footer-back` (desktop) both render this instead of keeping their own,
 *  slightly different icons. */
export function BackArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  )
}
