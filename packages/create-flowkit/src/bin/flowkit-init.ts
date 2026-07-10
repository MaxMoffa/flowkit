import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"
import { clack, confirmInstall, selectFramework, selectSteps, type OptionalStepGroup } from "../prompts"
import { detectPackageManager, installCommand } from "../detect-package-manager"
import { templatesRoot } from "../copy-template"

const FRAMEWORK_PACKAGES: Record<string, string[]> = {
  react: ["@flowkit/core", "@flowkit/themes", "@flowkit/adapters", "@flowkit/react"],
}

const STEP_GROUP_PACKAGES: Record<OptionalStepGroup, string> = {
  "map-maplibre": "maplibre-gl",
  "map-leaflet": "leaflet",
}

const STEP_GROUP_IMPORTS: Record<OptionalStepGroup, string> = {
  "map-maplibre": "@flowkit/react/map-maplibre",
  "map-leaflet": "@flowkit/react/map-leaflet",
}

async function main() {
  clack.intro("flowkit-init — add flowkit to an existing project")

  const framework = await selectFramework()
  const steps = await selectSteps()
  const pm = detectPackageManager()
  const packages = [...FRAMEWORK_PACKAGES[framework]!, ...steps.map((s) => STEP_GROUP_PACKAGES[s])]

  const doInstall = await confirmInstall()

  if (doInstall) {
    const s = clack.spinner()
    s.start(`Installing ${packages.join(", ")} (${pm})`)
    try {
      execSync(installCommand(pm, packages), { stdio: "ignore", cwd: process.cwd() })
      s.stop("Dependencies installed")
    } catch (err) {
      s.stop("Installation failed")
      clack.log.error(err instanceof Error ? err.message : String(err))
      clack.log.info(`You can install them manually with: ${installCommand(pm, packages)}`)
    }
  } else {
    clack.log.info(`Installation skipped. Command to run: ${installCommand(pm, packages)}`)
  }

  const templateFile = path.join(templatesRoot(import.meta.url), "init", framework, "flowkit-setup.tsx")
  const targetDir = path.join(process.cwd(), "src")
  if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true })
  const targetFile = path.join(targetDir, "flowkit-setup.tsx")

  if (existsSync(targetFile)) {
    clack.log.warn(`${path.relative(process.cwd(), targetFile)} already exists, not overwritten.`)
  } else {
    const template = readFileSync(templateFile, "utf8")
    const extraImports = steps.map((s) => `import "${STEP_GROUP_IMPORTS[s]}"\n`).join("")
    const withImports = template.replace(
      'import "@flowkit/react/style.css"\n',
      `import "@flowkit/react/style.css"\n${extraImports}`,
    )
    writeFileSync(targetFile, withImports)
    clack.log.success(`Created ${path.relative(process.cwd(), targetFile)}`)
  }

  clack.outro(
    "Done! Import FlowkitDemo from src/flowkit-setup.tsx in your app to see flowkit in action.",
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
