import type { CSSProperties, ReactNode } from "react"
import type { Theme, ThemeMode } from "@flowkit-io/themes"
import { notionClean, themeToCssVars } from "@flowkit-io/themes"

export interface ThemeProviderProps {
  theme?: Theme
  mode?: ThemeMode
  children: ReactNode
}

export function ThemeProvider({ theme = notionClean, mode = "light", children }: ThemeProviderProps) {
  const vars = themeToCssVars(theme, mode) as CSSProperties
  return (
    <div className="fk-theme" data-fk-theme={theme.name} data-fk-mode={mode} style={vars}>
      {children}
    </div>
  )
}
