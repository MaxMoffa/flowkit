import { test, expect } from "@playwright/test"
import { openPreset, continueStep } from "./helpers/open-preset"

test.describe("restricted markdown rendering", () => {
  test("renders allowed markdown live, degrades lists inline, and neutralizes a malicious link", async ({
    page,
  }) => {
    const dialogs: string[] = []
    page.on("dialog", (dialog) => {
      dialogs.push(dialog.message())
      void dialog.dismiss()
    })

    await openPreset(page, { preset: "flow-markdown-demo", start: false })

    // Intro: bold/italic in the title, a link + bullet list in the block-variant subtitle.
    const introTitle = page.locator("h1.fk-title")
    await expect(introTitle.locator("strong")).toHaveText("Benvenuto")
    await expect(introTitle.locator("em")).toHaveText("markdown")

    const introSubtitle = page.locator("p.fk-subtitle")
    const introLink = introSubtitle.locator("a")
    await expect(introLink).toHaveAttribute("href", "https://example.com")
    await expect(introLink).toHaveAttribute("target", "_blank")
    await expect(introLink).toHaveAttribute("rel", "noopener noreferrer")
    await expect(introSubtitle.locator("ul li")).toHaveCount(2)

    await page.getByRole("button", { name: "Inizia" }).click()

    // Checkbox step: title keeps inline emphasis; the label's list markers degrade to
    // plain text (no <ul>/<li> in an inline context).
    const checkboxTitle = page.locator("h2.fk-title")
    await expect(checkboxTitle.locator("em")).toHaveText("enfasi")

    const label = page.locator(".fk-checkbox-row span")
    await expect(label.locator("ul, ol, li")).toHaveCount(0)
    await expect(label).toContainText("voce finta uno")
    await expect(label).toContainText("voce finta due")

    // Description: the javascript: link must render inert (no <a>), the https: link
    // must render as a real, safely-attributed anchor.
    const description = page.locator(".fk-checkbox-description")
    await expect(description).toContainText("clicca qui")
    await expect(description.getByRole("link", { name: "clicca qui" })).toHaveCount(0)

    const safeLink = description.getByRole("link", { name: "informativa" })
    await expect(safeLink).toHaveAttribute("href", "https://example.com/privacy")
    await expect(safeLink).toHaveAttribute("target", "_blank")
    await expect(safeLink).toHaveAttribute("rel", "noopener noreferrer")

    await continueStep(page)

    // Confirmation: message renders a real bullet list with bold/italic items.
    const message = page.locator("p.fk-subtitle")
    await expect(message.locator("ul li")).toHaveCount(2)
    await expect(message.locator("ul li strong").first()).toHaveText("in grassetto")
    await expect(message.locator("ul li em").first()).toHaveText("in corsivo")

    expect(dialogs).toHaveLength(0)
  })
})
