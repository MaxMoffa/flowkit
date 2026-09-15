/** Shared photo-capture icon — replaces the 📷 emoji on the media/photo step capture
 *  buttons. Pairs with `VideoCameraIcon` for the video-capture label. */
export function CameraIcon() {
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
      <path d="M7.6 8.6h-2A1.6 1.6 0 0 0 4 10.2v7A1.6 1.6 0 0 0 5.6 18.8h12.8A1.6 1.6 0 0 0 20 17.2v-7a1.6 1.6 0 0 0-1.6-1.6h-2L15 6.6H9Z" />
      <circle cx="12" cy="13.6" r="2.8" />
    </svg>
  )
}
