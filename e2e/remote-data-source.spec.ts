import { test, expect, type Page } from "@playwright/test"
import { openPreset, continueStep } from "./helpers/open-preset"

function jsonRoute(page: Page, body: unknown, status = 200) {
  return (route: Parameters<Parameters<Page["route"]>[1]>[0]) =>
    route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) })
}

test.describe("remote dataSource on elenco/select steps", () => {
  test("fetches a remote list, paginates dependent results, then autocompletes a search", async ({ page }) => {
    await page.route("https://jsonplaceholder.typicode.com/**", async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname === "/users" && url.searchParams.has("name_like")) {
        const q = url.searchParams.get("name_like")!.toLowerCase()
        const all = [{ id: 9, name: "Ada Autocomplete" }]
        return jsonRoute(page, all.filter((u) => u.name.toLowerCase().includes(q)))(route)
      }
      if (url.pathname === "/users") {
        return jsonRoute(page, [
          { id: 1, name: "Mario Utente" },
          { id: 2, name: "Luigi Utente" },
        ])(route)
      }
      if (url.pathname === "/posts") {
        if (url.searchParams.get("_page") === "2") {
          return jsonRoute(page, [{ id: 4, title: "Post Quattro" }])(route)
        }
        return jsonRoute(page, [
          { id: 1, title: "Post Uno" },
          { id: 2, title: "Post Due" },
          { id: 3, title: "Post Tre" },
        ])(route)
      }
      return route.fallback()
    })

    await openPreset(page, { preset: "remote-data-source-demo", cta: "Inizia" })

    // Remote list (select-cards): fetched once, no static options configured.
    await expect(page.getByRole("button", { name: "Mario Utente" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Luigi Utente" })).toBeVisible()
    await page.getByRole("button", { name: "Mario Utente" }).click()
    await continueStep(page)

    // Dependent remote list (radio), paginated with "Carica altro".
    await expect(page.getByText("Post Uno")).toBeVisible()
    await expect(page.getByText("Post Due")).toBeVisible()
    await expect(page.getByText("Post Tre")).toBeVisible()
    await expect(page.getByText("Post Quattro")).toBeHidden()

    const loadMore = page.getByRole("button", { name: "Carica altro" })
    await expect(loadMore).toBeVisible()
    await loadMore.click()
    await expect(page.getByText("Post Quattro")).toBeVisible()
    await expect(page.getByRole("button", { name: "Carica altro" })).toBeHidden()

    await page.getByText("Post Uno").click()
    await continueStep(page)

    // Search-autocomplete (chips): nothing fetched until minSearchLength is reached.
    await expect(page.getByText("Ada Autocomplete")).toBeHidden()
    await page.locator(".fk-remote-search").fill("a")
    await page.waitForTimeout(400)
    await expect(page.getByText("Ada Autocomplete")).toBeHidden()

    await page.locator(".fk-remote-search").fill("ada")
    await expect(page.getByText("Ada Autocomplete")).toBeVisible()
  })

  test("shows loading, empty, and error(+retry) states", async ({ page }) => {
    let usersCallCount = 0
    await page.route("https://jsonplaceholder.typicode.com/users", async (route) => {
      usersCallCount++
      if (usersCallCount === 1) {
        return route.fulfill({ status: 500, contentType: "text/plain", body: "boom" })
      }
      return jsonRoute(page, [{ id: 1, name: "Mario Utente" }])(route)
    })
    await page.route("https://jsonplaceholder.typicode.com/posts**", (route) => jsonRoute(page, [])(route))

    await openPreset(page, { preset: "remote-data-source-demo", cta: "Inizia" })

    await expect(page.getByText("Non è stato possibile caricare i risultati.")).toBeVisible()
    const retry = page.getByRole("button", { name: "Riprova" })
    await expect(retry).toBeVisible()
    await retry.click()
    await expect(page.getByRole("button", { name: "Mario Utente" })).toBeVisible()
    await page.getByRole("button", { name: "Mario Utente" }).click()
    await continueStep(page)

    await expect(page.getByText("Nessun risultato trovato.")).toBeVisible()
  })
})
