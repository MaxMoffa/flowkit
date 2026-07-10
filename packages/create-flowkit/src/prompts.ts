import * as clack from "@clack/prompts"

export type SupportedFramework = "react"

const FRAMEWORK_OPTIONS = [
  { value: "react" as const, label: "React", hint: "disponibile" },
  { value: "vue" as const, label: "Vue", hint: "in arrivo, non ancora supportato" },
  { value: "svelte" as const, label: "Svelte", hint: "in arrivo, non ancora supportato" },
  { value: "vanilla" as const, label: "Vanilla JS", hint: "in arrivo, non ancora supportato" },
]

function flagValue(name: string): string | undefined {
  const prefix = `--${name}=`
  const inline = process.argv.find((a) => a.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)
  const idx = process.argv.indexOf(`--${name}`)
  if (idx !== -1) return process.argv[idx + 1]
  return undefined
}

/** Prompt di scelta framework. Solo "react" è implementato in questa versione della CLI: gli altri vengono accettati ma ricondotti a react con un avviso. Rispetta `--framework <name>` per l'uso non interattivo (CI/test). */
export async function selectFramework(): Promise<SupportedFramework> {
  const flagged = flagValue("framework")
  if (flagged) {
    if (flagged !== "react") {
      clack.log.warn(`"${flagged}" non è ancora supportato in questa versione della CLI: uso React.`)
    }
    return "react"
  }

  const value = await clack.select({
    message: "Quale framework usi?",
    options: FRAMEWORK_OPTIONS,
  })
  if (clack.isCancel(value)) {
    clack.cancel("Operazione annullata.")
    process.exit(0)
  }
  if (value !== "react") {
    clack.log.warn(`"${value}" non è ancora supportato in questa versione della CLI: uso React.`)
  }
  return "react"
}

/** Rispetta `--name <value>` per l'uso non interattivo (CI/test). */
export async function promptProjectName(defaultName: string): Promise<string> {
  const flagged = flagValue("name")
  if (flagged) return flagged

  const value = await clack.text({
    message: "Nome del progetto (cartella di destinazione)",
    placeholder: defaultName,
    defaultValue: defaultName,
  })
  if (clack.isCancel(value)) {
    clack.cancel("Operazione annullata.")
    process.exit(0)
  }
  return value || defaultName
}

/** `--yes` conferma, `--no-install` rifiuta, senza mostrare il prompt (uso non interattivo). */
export async function confirmInstall(): Promise<boolean> {
  if (process.argv.includes("--no-install")) return false
  if (process.argv.includes("--yes")) return true

  const value = await clack.confirm({
    message: "Installare le dipendenze ora?",
    initialValue: true,
  })
  if (clack.isCancel(value)) {
    clack.cancel("Operazione annullata.")
    process.exit(0)
  }
  return value
}

export { clack }
