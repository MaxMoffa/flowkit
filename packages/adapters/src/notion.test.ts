import { describe, expect, it, vi } from "vitest"
import { createNotionAdapter } from "./notion"

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: async () => body,
  } as Response
}

describe("createNotionAdapter", () => {
  it("submits answers as a new Notion page when no draft exists", async () => {
    const calls: { url: string; init?: RequestInit }[] = []
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init })
      if (url.includes("/query")) return jsonResponse({ results: [] })
      return jsonResponse({ id: "page-1" })
    })

    const adapter = createNotionAdapter({
      token: "secret_token",
      databaseId: "db-1",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    await adapter.submit("flow-1", { mood: "4", note: "tutto ok" })

    const createCall = calls.find((c) => c.url === "https://api.notion.com/v1/pages")
    expect(createCall).toBeDefined()
    expect(createCall!.init?.method).toBe("POST")
    const body = JSON.parse(createCall!.init!.body as string)
    expect(body.parent).toEqual({ database_id: "db-1" })
    expect(body.properties.mood).toEqual({ rich_text: [{ text: { content: "4" } }] })
    expect(body.properties.draft).toEqual({ checkbox: false })
  })

  it("patches the existing draft page instead of creating a new one", async () => {
    const calls: { url: string; init?: RequestInit }[] = []
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init })
      if (url.includes("/query")) return jsonResponse({ results: [{ id: "draft-page" }] })
      return jsonResponse({ id: "draft-page" })
    })

    const adapter = createNotionAdapter({
      token: "secret_token",
      databaseId: "db-1",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    await adapter.saveDraft("flow-1", { mood: "3" })

    const patchCall = calls.find((c) => c.url === "https://api.notion.com/v1/pages/draft-page")
    expect(patchCall).toBeDefined()
    expect(patchCall!.init?.method).toBe("PATCH")
    const body = JSON.parse(patchCall!.init!.body as string)
    expect(body.properties.draft).toEqual({ checkbox: true })
  })

  it("throws a descriptive error when the Notion API responds with an error", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes("/query")) return jsonResponse({ results: [] })
      return jsonResponse({}, false, 401)
    })

    const adapter = createNotionAdapter({
      token: "bad-token",
      databaseId: "db-1",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    await expect(adapter.submit("flow-1", {})).rejects.toThrow(/Notion submission failed/)
  })

  it("returns null from loadDraft when no draft page exists", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ results: [] }))
    const adapter = createNotionAdapter({
      token: "secret_token",
      databaseId: "db-1",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(await adapter.loadDraft("flow-1")).toBeNull()
  })
})
