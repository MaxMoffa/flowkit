import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"
import { clack, confirmInstall, selectFramework } from "../prompts"
import { detectPackageManager, installCommand } from "../detect-package-manager"
import { templatesRoot } from "../copy-template"

const FRAMEWORK_PACKAGES: Record<string, string[]> = {
  react: ["@flowkit/core", "@flowkit/themes", "@flowkit/adapters", "@flowkit/react"],
}

async function main() {
  clack.intro("flowkit-init — aggiungi flowkit a un progetto esistente")

  const framework = await selectFramework()
  const pm = detectPackageManager()
  const packages = FRAMEWORK_PACKAGES[framework]!

  const doInstall = await confirmInstall()

  if (doInstall) {
    const s = clack.spinner()
    s.start(`Installo ${packages.join(", ")} (${pm})`)
    try {
      execSync(installCommand(pm, packages), { stdio: "ignore", cwd: process.cwd() })
      s.stop("Dipendenze installate")
    } catch (err) {
      s.stop("Installazione fallita")
      clack.log.error(err instanceof Error ? err.message : String(err))
      clack.log.info(`Puoi installarle manualmente con: ${installCommand(pm, packages)}`)
    }
  } else {
    clack.log.info(`Installazione saltata. Comando da eseguire: ${installCommand(pm, packages)}`)
  }

  const templateFile = path.join(templatesRoot(import.meta.url), "init", framework, "flowkit-setup.tsx")
  const targetDir = path.join(process.cwd(), "src")
  if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true })
  const targetFile = path.join(targetDir, "flowkit-setup.tsx")

  if (existsSync(targetFile)) {
    clack.log.warn(`${path.relative(process.cwd(), targetFile)} esiste già, non sovrascritto.`)
  } else {
    writeFileSync(targetFile, readFileSync(templateFile, "utf8"))
    clack.log.success(`Creato ${path.relative(process.cwd(), targetFile)}`)
  }

  clack.outro(
    "Fatto! Importa FlowkitDemo da src/flowkit-setup.tsx nella tua app per vedere flowkit in azione.",
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
