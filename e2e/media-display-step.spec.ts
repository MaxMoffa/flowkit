import { test, expect } from "@playwright/test"
import { openPreset } from "./helpers/open-preset"

test.describe("media-display step", () => {
  test("renders a read-only image, then a read-only video, both responsive", async ({ page }) => {
    await openPreset(page, { preset: "media-display-demo" })

    const image = page.locator(".fk-media-display-image")
    await expect(image).toBeVisible()
    await expect(image).toHaveAttribute("src", /^data:image\/png;base64,/)
    await expect(page.getByText("Foto scattata durante l'evento.")).toBeVisible()

    await page.getByRole("button", { name: "Continua", exact: true }).click() // photo -> opinion
    await page.getByRole("button", { name: "Continua", exact: true }).click() // opinion -> clip

    const video = page.locator(".fk-media-display-video")
    await expect(video).toBeVisible()
    await expect(video).toHaveAttribute("src", "/media-demo/sample.mp4")
    await expect(video).toHaveJSProperty("muted", true)
    await expect(video).toHaveJSProperty("autoplay", true)
    await expect(video).toHaveJSProperty("controls", true)
    await expect(page.getByText("Video di esempio (autoplay silenzioso).")).toBeVisible()
  })

  test("frame stays within its container on a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await openPreset(page, { preset: "media-display-demo" })

    const frame = page.locator(".fk-media-display-frame").first()
    await expect(frame).toBeVisible()
    const box = await frame.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeLessThanOrEqual(320)
  })
})
