import * as clack from "@clack/prompts"

export type SupportedFramework = "react"

const FRAMEWORK_OPTIONS = [
  { value: "react" as const, label: "React", hint: "available" },
  { value: "vue" as const, label: "Vue", hint: "coming soon, not yet supported" },
  { value: "svelte" as const, label: "Svelte", hint: "coming soon, not yet supported" },
  { value: "vanilla" as const, label: "Vanilla JS", hint: "coming soon, not yet supported" },
]

function flagValue(name: string): string | undefined {
  const prefix = `--${name}=`
  const inline = process.argv.find((a) => a.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)
  const idx = process.argv.indexOf(`--${name}`)
  if (idx !== -1) return process.argv[idx + 1]
  return undefined
}

/** Framework choice prompt. Only "react" is implemented in this CLI version: others are accepted but fall back to react with a warning. Respects `--framework <name>` for non-interactive use (CI/test). */
export async function selectFramework(): Promise<SupportedFramework> {
  const flagged = flagValue("framework")
  if (flagged) {
    if (flagged !== "react") {
      clack.log.warn(`"${flagged}" isn't supported yet in this CLI version: using React.`)
    }
    return "react"
  }

  const value = await clack.select({
    message: "Which framework are you using?",
    options: FRAMEWORK_OPTIONS,
  })
  if (clack.isCancel(value)) {
    clack.cancel("Operation cancelled.")
    process.exit(0)
  }
  if (value !== "react") {
    clack.log.warn(`"${value}" isn't supported yet in this CLI version: using React.`)
  }
  return "react"
}

/** Respects `--name <value>` for non-interactive use (CI/test). */
export async function promptProjectName(defaultName: string): Promise<string> {
  const flagged = flagValue("name")
  if (flagged) return flagged

  const value = await clack.text({
    message: "Project name (destination folder)",
    placeholder: defaultName,
    defaultValue: defaultName,
  })
  if (clack.isCancel(value)) {
    clack.cancel("Operation cancelled.")
    process.exit(0)
  }
  return value || defaultName
}

export const OPTIONAL_STEP_GROUPS = ["map-maplibre", "map-leaflet"] as const
export type OptionalStepGroup = (typeof OPTIONAL_STEP_GROUPS)[number]

const STEP_GROUP_OPTIONS = [
  { value: "map-maplibre" as const, label: "Map (MapLibre)", hint: "location step, +maplibre-gl" },
  { value: "map-leaflet" as const, label: "Map (Leaflet)", hint: "location-leaflet step, +leaflet" },
]

/**
 * Selection of optional steps with heavy dependencies (maps): only the ones chosen
 * get added as a dependency and imported in the generated/wired project, to stay
 * light by default. The "core" steps (no extra dependencies) are always included
 * and require no choice. Respects `--steps=map-maplibre,map-leaflet` for
 * non-interactive use (CI/test); `--steps=` (empty) or omitting a group excludes it.
 */
export async function selectSteps(): Promise<OptionalStepGroup[]> {
  const flagged = flagValue("steps")
  if (flagged !== undefined) {
    return flagged
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is OptionalStepGroup => (OPTIONAL_STEP_GROUPS as readonly string[]).includes(s))
  }

  const value = await clack.multiselect({
    message: "Which optional steps (with extra dependencies) do you want to include?",
    options: STEP_GROUP_OPTIONS,
    required: false,
  })
  if (clack.isCancel(value)) {
    clack.cancel("Operation cancelled.")
    process.exit(0)
  }
  return value
}

/** `--yes` confirms, `--no-install` declines, without showing the prompt (non-interactive use). */
export async function confirmInstall(): Promise<boolean> {
  if (process.argv.includes("--no-install")) return false
  if (process.argv.includes("--yes")) return true

  const value = await clack.confirm({
    message: "Install dependencies now?",
    initialValue: true,
  })
  if (clack.isCancel(value)) {
    clack.cancel("Operation cancelled.")
    process.exit(0)
  }
  return value
}

export { clack }
