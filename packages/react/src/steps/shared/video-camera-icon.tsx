/** Shared video-capture icon — replaces the 🎥 emoji on the media step's video-only
 *  capture label. Pairs with `CameraIcon` (the photo variant). */
export function VideoCameraIcon() {
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
      <rect x="3.6" y="7.6" width="11.2" height="9.6" rx="2" />
      <path d="M14.8 10.6 20 8.2v7.8l-5.2-2.4Z" />
      <circle cx="7" cy="12.4" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}
