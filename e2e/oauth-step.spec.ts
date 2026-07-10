import { test, expect } from "@playwright/test"

test("oauth step builds a correct authorize URL and redirects on click", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Preset", { exact: true }).selectOption("features-demo")
  await page.getByRole("button", { name: "Prova" }).click()

  await expect(page.getByRole("heading", { name: "Accedi per continuare" })).toBeVisible()
  const providerButton = page.getByRole("button", { name: /Continua con generic/ })
  await expect(providerButton).toBeVisible()

  // Intercept the redirect instead of letting it hit the (fake) authorize URL for real.
  await page.route("https://example.com/oauth/authorize**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<html></html>" }),
  )

  await providerButton.click()
  await page.waitForURL(/example\.com\/oauth\/authorize/)

  const url = new URL(page.url())
  expect(url.searchParams.get("client_id")).toBe("demo-client-id")
  expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:5173/oauth/callback")
  expect(url.searchParams.get("response_type")).toBe("code")
  expect(url.searchParams.get("scope")).toBe("profile")
  // PKCE enabled by default (usePkce not set to false in the demo config).
  expect(url.searchParams.get("code_challenge")).toBeTruthy()
  expect(url.searchParams.get("code_challenge_method")).toBe("S256")
})
