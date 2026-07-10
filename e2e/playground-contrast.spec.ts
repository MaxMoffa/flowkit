import { test, expect } from "@playwright/test"

test.describe("playground light-mode contrast", () => {
  test.use({ colorScheme: "dark" })

  test("controls stay readable in light mode even when the OS prefers dark", async ({ page }) => {
    await page.goto("/")

    const select = page.getByLabel("Tema", { exact: true })
    const color = await select.evaluate((el) => getComputedStyle(el).color)
    const [r, g, b] = color.match(/\d+/g)!.map(Number)
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    expect(luminance).toBeLessThan(0.5)

    const restartBtn = page.getByRole("button", { name: "Ricomincia" })
    const btnColor = await restartBtn.evaluate((el) => getComputedStyle(el).color)
    const [br, bg, bb] = btnColor.match(/\d+/g)!.map(Number)
    const btnLuminance = (0.2126 * br + 0.7152 * bg + 0.0722 * bb) / 255
    expect(btnLuminance).toBeLessThan(0.5)
  })
})
