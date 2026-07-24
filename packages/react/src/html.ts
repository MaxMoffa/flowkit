/** Internal helpers shared by the two HTML string renderers (report + receipt email).
 *  Not part of the public API: both renderers build markup by interpolation, so every
 *  interpolated value has to go through one of these. */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** `data:<mime>;base64,<payload>`, the exact shape FileReader.readAsDataURL emits. */
const IMAGE_DATA_URL = /^data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/]*={0,2}$/i

/**
 * Returns the data URL only if it matches the shape above, otherwise null.
 *
 * The mime part of an uploaded item's dataUrl comes from the browser-reported
 * `File.type`, which a caller constructing a File by hand controls: interpolating it
 * raw into `src="..."` lets it break out of the attribute. Matching this pattern is
 * what makes the value safe to interpolate unescaped — the base64 alphabet cannot
 * carry a quote or an angle bracket. Anything else is dropped rather than rendered.
 */
export function safeImageDataUrl(value: string): string | null {
  return IMAGE_DATA_URL.test(value) ? value : null
}
