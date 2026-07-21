import { test, expect } from "@playwright/test"

const textFile = (name: string) => ({
  name,
  mimeType: "text/plain",
  buffer: Buffer.from("hello flowkit"),
})

test("file step: accepts multiple files, shows chips, removes and previews them", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("file-step-demo")
  await page.getByRole("button", { name: "Prova" }).click()

  await expect(page.getByRole("heading", { name: "Carica un documento" })).toBeVisible()

  const input = page.locator(".fk-step-file input[type=file]")
  await expect(input).toHaveAttribute("multiple", "")

  await input.setInputFiles([textFile("doc1.txt"), textFile("doc2.txt")])

  const chips = page.locator(".fk-file-chip")
  await expect(chips).toHaveCount(2)
  await expect(chips.first().locator(".fk-file-chip-name")).toHaveText("doc1.txt")

  // remove the first chip via its X button
  await chips.first().locator(".fk-media-remove").click()
  await expect(chips).toHaveCount(1)
  await expect(chips.first().locator(".fk-file-chip-name")).toHaveText("doc2.txt")

  // clicking the chip itself (not the X) opens a preview with name/size/download + remove
  await chips.first().click()
  const preview = page.locator(".fk-media-lightbox")
  await expect(preview).toBeVisible()
  await expect(preview.locator(".fk-file-preview-name")).toHaveText("doc2.txt")

  await preview.locator(".fk-media-lightbox-remove").click()
  await expect(preview).toBeHidden()
  await expect(chips).toHaveCount(0)

  // the step is optional: continue stays enabled even with no attachments
  await expect(page.getByRole("button", { name: "Continua", exact: true })).toBeEnabled()
})
