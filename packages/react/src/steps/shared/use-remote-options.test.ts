import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { remoteDataSourceSchema, type Answers } from "@flowkit-io/core"
import { useRemoteOptions } from "./use-remote-options"

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response
}

describe("useRemoteOptions", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it("is a stable no-op when there's no dataSource", () => {
    const { result } = renderHook(() => useRemoteOptions(undefined, {}))
    expect(result.current.isRemote).toBe(false)
    expect(result.current.options).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  })

  it("fetches once on mount for a plain remote list, then reports loaded", async () => {
    const config = remoteDataSourceSchema.parse({ endpoint: "https://api.test/items" })
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([{ value: "a", label: "A" }]))

    const { result } = renderHook(() => useRemoteOptions(config, {}))

    await waitFor(() => expect(result.current.status).toBe("loaded"))
    expect(result.current.options).toEqual([{ value: "a", label: "A" }])
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it("reports 'empty' when the response yields no options", async () => {
    const config = remoteDataSourceSchema.parse({ endpoint: "https://api.test/empty-items" })
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([]))

    const { result } = renderHook(() => useRemoteOptions(config, {}))
    await waitFor(() => expect(result.current.status).toBe("empty"))
  })

  it("reports 'error' on a failed request, and retry() re-fetches", async () => {
    const config = remoteDataSourceSchema.parse({ endpoint: "https://api.test/error-items" })
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(null, false, 500))

    const { result } = renderHook(() => useRemoteOptions(config, {}))
    await waitFor(() => expect(result.current.status).toBe("error"))

    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([{ value: "a", label: "A" }]))
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.status).toBe("loaded"))
  })

  it("waits for paramsFromSteps answers before fetching", async () => {
    const config = remoteDataSourceSchema.parse({
      endpoint: "https://api.test/items",
      paramsFromSteps: { userId: "user-step" },
    })
    const { result, rerender } = renderHook(({ answers }) => useRemoteOptions(config, answers), {
      initialProps: { answers: {} as Answers },
    })
    expect(fetch).not.toHaveBeenCalled()
    expect(result.current.status).toBe("idle")

    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([{ value: "a", label: "A" }]))
    rerender({ answers: { "user-step": "42" } })
    await waitFor(() => expect(result.current.status).toBe("loaded"))
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("userId=42"), expect.anything())
  })

  it("paginates via loadMore, appending results and respecting hasMore", async () => {
    const config = remoteDataSourceSchema.parse({
      endpoint: "https://api.test/items",
      pageSize: 2,
      pageParam: "_page",
      pageSizeParam: "_limit",
    })
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse([{ value: "1", label: "One" }, { value: "2", label: "Two" }]),
    )
    const { result } = renderHook(() => useRemoteOptions(config, {}))
    await waitFor(() => expect(result.current.status).toBe("loaded"))
    expect(result.current.canLoadMore).toBe(true)

    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([{ value: "3", label: "Three" }]))
    act(() => result.current.loadMore())
    await waitFor(() => expect(result.current.options).toHaveLength(3))
    expect(result.current.canLoadMore).toBe(false)
    expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining("_page=2"), expect.anything())
  })

  it("autocomplete mode: debounces typing and doesn't fetch below minSearchLength", async () => {
    vi.useFakeTimers()
    const config = remoteDataSourceSchema.parse({
      endpoint: "https://api.test/items",
      searchParam: "q",
      debounceMs: 300,
      minSearchLength: 2,
    })
    const { result } = renderHook(() => useRemoteOptions(config, {}))
    expect(result.current.isAutocomplete).toBe(true)

    act(() => result.current.setSearch("a"))
    await act(async () => vi.advanceTimersByTimeAsync(500))
    expect(fetch).not.toHaveBeenCalled()

    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([{ value: "ab1", label: "AB" }]))
    act(() => result.current.setSearch("ab"))
    expect(fetch).not.toHaveBeenCalled() // still debouncing
    await act(async () => vi.advanceTimersByTimeAsync(300))
    expect(fetch).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => expect(result.current.status).toBe("loaded"))
  })

  it("caches a response by request URL: revisiting the same query doesn't refetch", async () => {
    const config = remoteDataSourceSchema.parse({
      endpoint: "https://api.test/items",
      searchParam: "q",
      debounceMs: 0,
    })
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([{ value: "x", label: "X" }]))
    const { result, unmount } = renderHook(() => useRemoteOptions(config, {}))

    act(() => result.current.setSearch("roma"))
    await waitFor(() => expect(result.current.status).toBe("loaded"))
    expect(fetch).toHaveBeenCalledTimes(1)
    unmount()

    const { result: result2 } = renderHook(() => useRemoteOptions(config, {}))
    act(() => result2.current.setSearch("roma"))
    await waitFor(() => expect(result2.current.status).toBe("loaded"))
    expect(fetch).toHaveBeenCalledTimes(1) // still 1: served from cache
    expect(result2.current.options).toEqual([{ value: "x", label: "X" }])
  })
})
