import { test, expect } from "@playwright/test"

/**
 * `intro` / `review` step `ctaFootnote` — small print under the primary button, e.g. a
 * platform's standing disclaimer. The catalog demo carries one on the intro step (and
 * a differently-worded one on the review step).
 */
test("ctaFootnote: intro shows the disclaimer under the start button, with a clickable link", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("catalog-demo")

  const note = page.locator(".fk-footer-note")
  await expect(note).toBeVisible()
  await expect(note).toContainText("FlowLab non ne è l'autore")

  const link = note.getByRole("link", { name: "Termini di servizio" })
  await expect(link).toHaveAttribute("href", "https://example.com/termini")
  await expect(link).toHaveAttribute("target", "_blank")

  // Gone once the flow leaves the intro step.
  await page.getByRole("button", { name: "Inizia" }).click()
  await expect(page.locator(".fk-footer-note")).toHaveCount(0)
})
