import { existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"
import { clack, confirmInstall, promptProjectName, selectFramework } from "../prompts"
import { detectPackageManager, devInstallCommand, runScriptCommand } from "../detect-package-manager"
import { copyTemplate, templatesRoot } from "../copy-template"

async function main() {
  clack.intro("create-flowkit — scaffold di una mini-app con il preset \"feedback\"")

  const projectName = await promptProjectName("my-flowkit-app")
  const framework = await selectFramework()
  const targetDir = path.join(process.cwd(), projectName)

  if (existsSync(targetDir)) {
    clack.log.error(`La cartella "${projectName}" esiste già.`)
    process.exit(1)
  }

  const templateDir = path.join(templatesRoot(import.meta.url), "feedback", framework)
  copyTemplate(templateDir, targetDir)

  const pkgJsonPath = path.join(targetDir, "package.json")
  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf8")) as { name: string }
  pkgJson.name = projectName
  writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + "\n")
  clack.log.success(`Progetto creato in ./${projectName}`)

  const pm = detectPackageManager(targetDir)
  const doInstall = await confirmInstall()

  if (doInstall) {
    const s = clack.spinner()
    s.start(`Installo dipendenze (${pm})`)
    try {
      execSync(devInstallCommand(pm), { stdio: "ignore", cwd: targetDir })
      s.stop("Dipendenze installate")
    } catch (err) {
      s.stop("Installazione fallita")
      clack.log.error(err instanceof Error ? err.message : String(err))
    }
  }

  clack.outro(
    [
      `cd ${projectName}`,
      doInstall ? undefined : devInstallCommand(pm),
      runScriptCommand(pm, "dev"),
    ]
      .filter(Boolean)
      .join(" && "),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
