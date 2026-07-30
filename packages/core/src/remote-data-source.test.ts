import { describe, expect, it } from "vitest"
import {
  buildRemoteDataSourceUrl,
  extractHasMore,
  extractRemoteOptions,
  remoteDataSourceSchema,
  resolveRemoteDataSourceParams,
} from "./remote-data-source"

function config(overrides: Partial<Parameters<typeof remoteDataSourceSchema.parse>[0]> = {}) {
  return remoteDataSourceSchema.parse({ endpoint: "https://api.example.com/items", ...overrides })
}

describe("extractRemoteOptions", () => {
  it("maps a bare array response using labelField/valueField", () => {
    const cfg = config({ labelField: "name", valueField: "id" })
    const options = extractRemoteOptions([{ id: "1", name: "Uno" }, { id: "2", name: "Due" }], cfg)
    expect(options).toEqual([
      { value: "1", label: "Uno" },
      { value: "2", label: "Due" },
    ])
  })

  it("resolves itemsPath for a nested items array", () => {
    const cfg = config({ itemsPath: "results.items" })
    const options = extractRemoteOptions(
      { results: { items: [{ value: "a", label: "A" }] } },
      cfg,
    )
    expect(options).toEqual([{ value: "a", label: "A" }])
  })

  it("supports one level of dot nesting on the item fields", () => {
    const cfg = config({ labelField: "name.it", valueField: "code" })
    const options = extractRemoteOptions([{ code: "IT", name: { it: "Italia", en: "Italy" } }], cfg)
    expect(options).toEqual([{ value: "IT", label: "Italia" }])
  })

  it("returns an empty array (never throws) for a malformed response", () => {
    expect(extractRemoteOptions({ not: "an array" }, config())).toEqual([])
    expect(extractRemoteOptions(null, config())).toEqual([])
    expect(extractRemoteOptions([{ irrelevant: true }], config())).toEqual([])
  })
})

describe("extractHasMore", () => {
  it("uses hasMorePath when present and boolean", () => {
    const cfg = config({ hasMorePath: "meta.more" })
    expect(extractHasMore({ meta: { more: true } }, cfg, 5)).toBe(true)
    expect(extractHasMore({ meta: { more: false } }, cfg, 5)).toBe(false)
  })

  it("falls back to a full-page heuristic when pageSize is set", () => {
    const cfg = config({ pageSize: 10 })
    expect(extractHasMore({}, cfg, 10)).toBe(true)
    expect(extractHasMore({}, cfg, 3)).toBe(false)
  })

  it("is false when neither hasMorePath nor pageSize is configured", () => {
    expect(extractHasMore({}, config(), 100)).toBe(false)
  })
})

describe("resolveRemoteDataSourceParams", () => {
  it("includes staticParams as-is", () => {
    const cfg = config({ staticParams: { lang: "it" } })
    expect(resolveRemoteDataSourceParams(cfg, {})?.get("lang")).toBe("it")
  })

  it("resolves paramsFromSteps from answers, returns undefined until all are filled", () => {
    const cfg = config({ paramsFromSteps: { userId: "user-step" } })
    expect(resolveRemoteDataSourceParams(cfg, {})).toBeUndefined()
    expect(resolveRemoteDataSourceParams(cfg, { "user-step": "" })).toBeUndefined()
    expect(resolveRemoteDataSourceParams(cfg, { "user-step": "42" })?.get("userId")).toBe("42")
  })

  it("returns undefined for autocomplete mode when no search term is given", () => {
    const cfg = config({ searchParam: "q" })
    expect(resolveRemoteDataSourceParams(cfg, {})).toBeUndefined()
    expect(resolveRemoteDataSourceParams(cfg, {}, { search: "roma" })?.get("q")).toBe("roma")
  })

  it("only sets the page param from page 2 onward", () => {
    const cfg = config({ pageParam: "_page" })
    expect(resolveRemoteDataSourceParams(cfg, {}, { page: 1 })?.has("_page")).toBe(false)
    expect(resolveRemoteDataSourceParams(cfg, {}, { page: 2 })?.get("_page")).toBe("2")
  })

  it("sends the page size param only when pageSize is configured", () => {
    const cfg = config({ pageSize: 5, pageSizeParam: "_limit" })
    expect(resolveRemoteDataSourceParams(cfg, {})?.get("_limit")).toBe("5")
    expect(resolveRemoteDataSourceParams(config(), {})?.has("pageSize")).toBe(false)
  })
})

describe("buildRemoteDataSourceUrl", () => {
  it("appends params with '?' when the endpoint has none", () => {
    const url = buildRemoteDataSourceUrl(config(), new URLSearchParams({ a: "1" }))
    expect(url).toBe("https://api.example.com/items?a=1")
  })

  it("appends params with '&' when the endpoint already has a query string", () => {
    const cfg = config({ endpoint: "https://api.example.com/items?fixed=1" })
    const url = buildRemoteDataSourceUrl(cfg, new URLSearchParams({ a: "1" }))
    expect(url).toBe("https://api.example.com/items?fixed=1&a=1")
  })

  it("returns the bare endpoint when there are no params", () => {
    expect(buildRemoteDataSourceUrl(config(), new URLSearchParams())).toBe("https://api.example.com/items")
  })
})
