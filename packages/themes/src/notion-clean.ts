export interface ThemeTokens {
  text: string
  text2: string
  canvas: string
  soft: string
  surface: string
  border: string
  accent: string
  accentSoft: string
  success: string
  successSoft: string
  warning: string
  warningSoft: string
  danger: string
  dangerSoft: string
  radiusSm: string
  radiusMd: string
  radiusLg: string
  radiusXl: string
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
  accentSoft: "#E5F2FC",
  success: "#46A171",
  successSoft: "#E8F1EC",
  warning: "#D5803B",
  warningSoft: "#FBEBDE",
  danger: "#E56458",
  dangerSoft: "#FCE9E7",
  radiusSm: "10px",
  radiusMd: "14px",
  radiusLg: "20px",
  radiusXl: "28px",
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
  accentSoft: "#213348",
  success: "#5CBF8A",
  successSoft: "#1F332A",
  warning: "#E0954D",
  warningSoft: "#3A2C1C",
  danger: "#EC7A6E",
  dangerSoft: "#3A2320",
  radiusSm: "10px",
  radiusMd: "14px",
  radiusLg: "20px",
  radiusXl: "28px",
  spacing: notionCleanLight.spacing,
}
