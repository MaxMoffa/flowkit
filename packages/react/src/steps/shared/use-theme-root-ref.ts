import { useRef } from "react"

/**
 * Ref to attach to a step's (or the footer's) root element, plus the nearest
 * `.fk-theme` ancestor to portal a `SheetDialog` into — that's the element
 * `ThemeProvider` stamps its CSS custom properties on, so a plain `document.body`
 * portal would render outside the active theme. Falls back to `document.body` when
 * no `.fk-theme` ancestor exists yet (e.g. first render, or in a host that doesn't
 * use `ThemeProvider`). Same pattern previously duplicated in `catalog.tsx` and
 * `product.tsx`.
 */
export function useThemeRootRef<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const container =
    ref.current?.closest<HTMLElement>(".fk-theme") ?? (typeof document !== "undefined" ? document.body : null)
  return [ref, container] as const
}
