const pending = new Map<string, Promise<void>>()

/** Loads an external <script> once per src, de-duplicating concurrent/repeated calls
 *  (e.g. StrictMode double-invoke, or the step remounting). Resolves once the script
 *  has fired its load event; rejects on error. */
export function loadExternalScript(src: string): Promise<void> {
  const existing = pending.get(src)
  if (existing) return existing
  const promise = new Promise<void>((resolve, reject) => {
    const existingTag = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existingTag) {
      existingTag.addEventListener("load", () => resolve())
      existingTag.addEventListener("error", () => reject(new Error(`Impossibile caricare lo script "${src}".`)))
      return
    }
    const tag = document.createElement("script")
    tag.src = src
    tag.async = true
    tag.defer = true
    tag.onload = () => resolve()
    tag.onerror = () => reject(new Error(`Impossibile caricare lo script "${src}".`))
    document.head.appendChild(tag)
  })
  pending.set(src, promise)
  return promise
}
