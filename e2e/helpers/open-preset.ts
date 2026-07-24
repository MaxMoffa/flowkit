import { expect, type Page } from "@playwright/test"

export interface OpenPresetOptions {
  /** Value of the playground's "Preset" select. Omit to keep its default (odori). */
  preset?: string
  /** Value of the "Tema" select, applied before the flow starts. */
  theme?: string
  /**
   * How many "Continua" clicks to perform after the intro CTA, to land on the step
   * under test. Each entry documents what is being skipped and shows up in traces.
   */
  skip?: string[]
  /** Set false to stop at the intro screen (e.g. visual snapshots of the hero). */
  start?: boolean
  /** Intro CTA label. Each preset writes its own; the default preset (odori) differs. */
  cta?: string
}

/**
 * Opens the playground on a preset and walks to the step under test.
 *
 * Every spec repeated this sequence — goto, pick preset, optionally pick theme, click
 * the intro CTA, then N "Continua" clicks — which made the interesting assertions hard
 * to find and meant a playground label change had to be applied in 50 places.
 */
export async function openPreset(page: Page, options: OpenPresetOptions = {}): Promise<void> {
  const { preset, theme, skip = [], start = true, cta = "Prova" } = options

  await page.goto("/")
  if (preset) await page.getByLabel("Preset", { exact: true }).selectOption(preset)
  if (theme) await page.getByLabel("Tema", { exact: true }).selectOption(theme)
  if (!start) return

  await page.getByRole("button", { name: cta }).click()
  for (let i = 0; i < skip.length; i++) {
    await continueStep(page)
  }
}

/** Clicks the footer's primary button, first waiting for the step to be valid. */
export async function continueStep(page: Page): Promise<void> {
  const button = page.getByRole("button", { name: "Continua", exact: true })
  await expect(button).toBeEnabled()
  await button.click()
}
