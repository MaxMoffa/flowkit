export interface ThemeTokens {
  text: string
  text2: string
  canvas: string
  soft: string
  surface: string
  border: string
  accent: string
  success: string
  warning: string
  danger: string
  radiusSm: string
  radiusMd: string
  radiusLg: string
  spacing: Record<"xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl", string>
}

export const notionCleanLight: ThemeTokens = {
  text: "#2C2C2B",
  text2: "#7D7A75",
  canvas: "#FFFFFF",
  soft: "#F9F8F7",
  surface: "#F0EFED",
  border: "#E6E5E3",
  accent: "#2783DE",
  success: "#46A171",
  warning: "#D5803B",
  danger: "#E56458",
  radiusSm: "8px",
  radiusMd: "12px",
  radiusLg: "20px",
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    xxl: "32px",
    xxxl: "48px",
  },
}

export const notionCleanDark: ThemeTokens = {
  text: "#EDECEA",
  text2: "#9B9892",
  canvas: "#1C1C1B",
  soft: "#232322",
  surface: "#2A2A29",
  border: "#3A3A38",
  accent: "#4B9FEF",
  success: "#5CBF8A",
  warning: "#E0954D",
  danger: "#EC7A6E",
  radiusSm: "8px",
  radiusMd: "12px",
  radiusLg: "20px",
  spacing: notionCleanLight.spacing,
}
